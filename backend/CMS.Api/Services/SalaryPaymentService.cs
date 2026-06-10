using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class SalaryPaymentService : ISalaryPaymentService
{
    private readonly AppDbContext _db;
    private readonly ISalaryDetailService _salaryDetailService;

    public SalaryPaymentService(AppDbContext db, ISalaryDetailService salaryDetailService)
    {
        _db = db;
        _salaryDetailService = salaryDetailService;
    }

    public async Task<IEnumerable<SalaryPaymentListItem>> GetAllAsync()
    {
        var payments = await _db.SalaryPayments
            .Include(p => p.User)
            .OrderByDescending(p => p.PaidOn)
            .ThenBy(p => p.User.FirstName).ThenBy(p => p.User.LastName)
            .ToListAsync();

        return payments.Select(ToDto);
    }

    public async Task<SalaryPaymentListItem> CreateAsync(CreateSalaryPaymentRequest request, int actorId)
    {
        var payment = new SalaryPayment
        {
            UserId = request.UserId,
            Amount = request.Amount,
            PaidOn = request.PaidOn,
            Remarks = string.IsNullOrWhiteSpace(request.Remarks) ? null : request.Remarks.Trim(),
            CreatedById = actorId,
            CreatedAt = DateTime.UtcNow
        };

        _db.SalaryPayments.Add(payment);
        await _salaryDetailService.AdjustAsync(request.UserId, paidDelta: request.Amount);
        await _db.SaveChangesAsync();
        await _db.Entry(payment).Reference(p => p.User).LoadAsync();

        return ToDto(payment);
    }

    public async Task<(SalaryPaymentListItem? Item, string? Error)> UpdateAsync(int id, UpdateSalaryPaymentRequest request, int actorId)
    {
        var payment = await _db.SalaryPayments
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (payment is null) return (null, "Payment record not found.");

        var oldUserId = payment.UserId;
        var oldAmount = payment.Amount;

        payment.UserId = request.UserId;
        payment.Amount = request.Amount;
        payment.PaidOn = request.PaidOn;
        payment.Remarks = string.IsNullOrWhiteSpace(request.Remarks) ? null : request.Remarks.Trim();
        payment.UpdatedById = actorId;
        payment.UpdatedAt = DateTime.UtcNow;

        if (oldUserId == request.UserId)
        {
            // Same employee: net delta on one record.
            await _salaryDetailService.AdjustAsync(request.UserId, paidDelta: request.Amount - oldAmount);
        }
        else
        {
            // Employee changed: subtract from old, add to new.
            await _salaryDetailService.AdjustAsync(oldUserId, paidDelta: -oldAmount);
            await _salaryDetailService.AdjustAsync(request.UserId, paidDelta: request.Amount);
        }

        await _db.SaveChangesAsync();
        await _db.Entry(payment).Reference(p => p.User).LoadAsync();

        return (ToDto(payment), null);
    }

    public async Task<bool> DeleteAsync(int id, int deletedById)
    {
        var payment = await _db.SalaryPayments.FindAsync(id);
        if (payment is null) return false;

        payment.IsDeleted = true;
        payment.DeletedById = deletedById;
        payment.DeletedOn = DateTime.UtcNow;
        await _salaryDetailService.AdjustAsync(payment.UserId, paidDelta: -payment.Amount);
        await _db.SaveChangesAsync();
        return true;
    }

    private static SalaryPaymentListItem ToDto(SalaryPayment p)
    {
        var name = string.IsNullOrWhiteSpace($"{p.User.FirstName} {p.User.LastName}".Trim())
            ? p.User.Username
            : $"{p.User.FirstName} {p.User.LastName}".Trim();

        return new SalaryPaymentListItem
        {
            Id = p.Id,
            UserId = p.UserId,
            UserName = name,
            Amount = p.Amount,
            PaidOn = p.PaidOn,
            Remarks = p.Remarks,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
        };
    }
}
