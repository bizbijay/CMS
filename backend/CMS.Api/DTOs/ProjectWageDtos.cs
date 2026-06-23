using System.ComponentModel.DataAnnotations;

namespace CMS.Api.DTOs;

public class ProjectWageListItemDto
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public int NumberOfWorkers { get; set; }
    public decimal Rate { get; set; }
    public decimal TotalAmount { get; set; }
    public DateOnly Date { get; set; }
    public string? Remarks { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateProjectWageRequest
{
    [Required]
    public int ProjectId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Number of workers must be at least 1.")]
    public int NumberOfWorkers { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Rate { get; set; }

    [Required]
    public DateOnly Date { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }
}

public class UpdateProjectWageRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "Number of workers must be at least 1.")]
    public int NumberOfWorkers { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Rate { get; set; }

    [Required]
    public DateOnly Date { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }
}
