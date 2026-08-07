using System.ComponentModel.DataAnnotations;

namespace CMS.Api.DTOs;

public class PartyNameListItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal TotalBalance { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class PartyBalanceLogListItemDto
{
    public int Id { get; set; }
    public int PartyNameId { get; set; }
    public string EntryType { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateOnly LoggedOn { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
}

public class CreatePartyNameRequest
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
}

public class UpdatePartyNameRequest
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
}

public class AddPartyBalanceRequest
{
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    public DateOnly? LoggedOn { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }
}

public class ReceivePartyAmountRequest
{
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    public DateOnly? ReceivedOn { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }
}
