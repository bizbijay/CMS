using System.ComponentModel.DataAnnotations;

namespace CMS.Api.DTOs;

public class GovernmentOfficeListItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateGovernmentOfficeRequest
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;
}

public class UpdateGovernmentOfficeRequest
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;
}
