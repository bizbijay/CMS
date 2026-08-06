using System.ComponentModel.DataAnnotations;

namespace CMS.Api.DTOs;

public class BankAccountListItemDto
{
    public int Id { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string AccountHolder { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string? Branch { get; set; }
    public bool IsPrimary { get; set; }
    public decimal TotalBalance { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}

public class CreateBankAccountRequest
{
    [Required, MaxLength(200)]
    public string BankName { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string AccountHolder { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string AccountNumber { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Branch { get; set; }

    public bool IsPrimary { get; set; }
}

public class UpdateBankAccountRequest
{
    [Required, MaxLength(200)]
    public string BankName { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string AccountHolder { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string AccountNumber { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Branch { get; set; }

    public bool IsPrimary { get; set; }
}

public class BankAccountBalanceSummaryDto
{
    public int BankAccountId { get; set; }
    public decimal TotalBalance { get; set; }
}

public class BankAccountCreditLogListItemDto
{
    public int Id { get; set; }
    public int BankAccountId { get; set; }
    public decimal Amount { get; set; }
    public DateOnly LoggedOn { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
}

public class BankAccountDebitLogListItemDto
{
    public int Id { get; set; }
    public int BankAccountId { get; set; }
    public int? VendorId { get; set; }
    public string? VendorName { get; set; }
    public decimal Amount { get; set; }
    public DateOnly DebitedOn { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
}

public class AddBankAccountBalanceRequest
{
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    public DateOnly? LoggedOn { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }
}
