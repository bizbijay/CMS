using System.ComponentModel.DataAnnotations;

namespace CMS.Api.DTOs;

public class ProjectCommissionListItemDto
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public int? OfficeId { get; set; }
    public string? OfficeName { get; set; }
    public string? OtherOption { get; set; }
    public decimal Amount { get; set; }
    public string? Remarks { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateProjectCommissionRequest
{
    [Required]
    public int ProjectId { get; set; }

    public int? OfficeId { get; set; }

    [MaxLength(200)]
    public string? OtherOption { get; set; }

    [Required]
    public decimal Amount { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }
}

public class UpdateProjectCommissionRequest
{
    public int? OfficeId { get; set; }

    [MaxLength(200)]
    public string? OtherOption { get; set; }

    [Required]
    public decimal Amount { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }
}
