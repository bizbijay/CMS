using System.ComponentModel.DataAnnotations;

namespace CMS.Api.DTOs;

public class VendorListItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? PanNumber { get; set; }
    public decimal TotalBalance { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class VendorBalanceLogListItemDto
{
    public int Id { get; set; }
    public int VendorId { get; set; }
    public int? BankAccountId { get; set; }
    public string? BankAccountName { get; set; }
    public string EntryType { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateOnly LoggedOn { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
}

public class CreateVendorRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? PanNumber { get; set; }
}

public class UpdateVendorRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? PanNumber { get; set; }
}

public class AddVendorBalanceRequest
{
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    public DateOnly? LoggedOn { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }
}

public class PayVendorAmountRequest
{
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    [Range(1, int.MaxValue)]
    public int BankAccountId { get; set; }

    public DateOnly? PaidOn { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }
}
