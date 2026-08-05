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
