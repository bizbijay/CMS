using System.ComponentModel.DataAnnotations;

namespace CMS.Api.DTOs;

public class MaintenancePartListItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateMaintenancePartRequest
{
    [Required, MaxLength(300)]
    public string Name { get; set; } = string.Empty;
}

public class UpdateMaintenancePartRequest
{
    [Required, MaxLength(300)]
    public string Name { get; set; } = string.Empty;
}
