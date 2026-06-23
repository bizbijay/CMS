using System.ComponentModel.DataAnnotations;

namespace CMS.Api.DTOs;

public class ProjectExpenseSummaryDto
{
    public int ProjectId { get; set; }
    public decimal ExpensesTotal { get; set; }
    public decimal WagesTotal { get; set; }
    public decimal TransportationTotal { get; set; }
    public decimal GrandTotal { get; set; }
}


public class ProjectExpenseListItemDto
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public int? MaterialId { get; set; }
    public string? MaterialName { get; set; }
    public decimal? Quantity { get; set; }
    public decimal? CostPerUnit { get; set; }
    public decimal? TotalCost { get; set; }
    public int? VendorId { get; set; }
    public string? VendorName { get; set; }
    public string? VendorOther { get; set; }
    public DateOnly Date { get; set; }
    public string? Remarks { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateProjectExpenseRequest
{
    [Required]
    public int ProjectId { get; set; }

    public int? MaterialId { get; set; }

    public decimal? Quantity { get; set; }

    public decimal? CostPerUnit { get; set; }

    public int? VendorId { get; set; }

    [MaxLength(200)]
    public string? VendorOther { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    [Required]
    public DateOnly Date { get; set; }
}

public class UpdateProjectExpenseRequest
{
    public int? MaterialId { get; set; }

    public decimal? Quantity { get; set; }

    public decimal? CostPerUnit { get; set; }

    public int? VendorId { get; set; }

    [MaxLength(200)]
    public string? VendorOther { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    [Required]
    public DateOnly Date { get; set; }
}
