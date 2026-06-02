using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CMS.Api.Models;

[Table("Fuels")]
public class Fuel
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public int? CreatedById { get; set; }
    public User? CreatedBy { get; set; }

    public int? UpdatedById { get; set; }
    public User? UpdatedBy { get; set; }
}
