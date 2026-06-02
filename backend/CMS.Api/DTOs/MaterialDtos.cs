using System.ComponentModel.DataAnnotations;

namespace CMS.Api.DTOs;

public class MaterialListItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateMaterialRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;
}

public class UpdateMaterialRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;
}
