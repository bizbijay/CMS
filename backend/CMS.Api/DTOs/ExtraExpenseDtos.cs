using System.ComponentModel.DataAnnotations;

namespace CMS.Api.DTOs;

public class ExtraExpenseListItemDto
{
    public int Id { get; set; }
    public int? ExpensedById { get; set; }
    public string ExpensedByName { get; set; } = string.Empty;
    public string? ExpensedByOther { get; set; }
    public string Item { get; set; } = string.Empty;
    public decimal? Quantity { get; set; }
    public decimal? Cost { get; set; }
    public decimal TotalCost { get; set; }
    public string? Remarks { get; set; }
    public bool IsVerified { get; set; }
    public int? VerifiedById { get; set; }
    public string? VerifiedByName { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public DateOnly Date { get; set; }
    public int? CreatedById { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateExtraExpenseRequest
{
    public int? ExpensedById { get; set; }

    [MaxLength(200)]
    public string? ExpensedByOther { get; set; }

    [Required]
    [MaxLength(200)]
    public string Item { get; set; } = string.Empty;

    public decimal? Quantity { get; set; }
    public decimal? Cost { get; set; }

    [Required]
    public decimal TotalCost { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    [Required]
    public DateOnly Date { get; set; }
}

public class UpdateExtraExpenseRequest
{
    public int? ExpensedById { get; set; }

    [MaxLength(200)]
    public string? ExpensedByOther { get; set; }

    [Required]
    [MaxLength(200)]
    public string Item { get; set; } = string.Empty;

    public decimal? Quantity { get; set; }
    public decimal? Cost { get; set; }

    [Required]
    public decimal TotalCost { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    [Required]
    public DateOnly Date { get; set; }
}
