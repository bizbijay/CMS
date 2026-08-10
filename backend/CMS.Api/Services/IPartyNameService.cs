using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface IPartyNameService
{
    Task<IEnumerable<PartyNameListItemDto>> GetAllAsync();
    Task<IEnumerable<PartyNameListItemDto>> GetDropdownAsync();
    Task<PartyNameListItemDto?> GetByIdAsync(int id);
    Task<IEnumerable<PartyBalanceLogListItemDto>> GetBalanceLogsAsync(int partyNameId);
    Task<PartyNameListItemDto> CreateAsync(CreatePartyNameRequest request, int createdById);
    Task<(PartyNameListItemDto? PartyName, string? Error)> UpdateAsync(int id, UpdatePartyNameRequest request, int updatedById);
    Task<(PartyBalanceLogListItemDto? Log, string? Error)> AddBalanceAsync(int partyNameId, AddPartyBalanceRequest request, int createdById);
    Task<(PartyBalanceLogListItemDto? Log, string? Error)> ReceiveAmountAsync(int partyNameId, ReceivePartyAmountRequest request, int createdById);
    Task<bool> DeleteAsync(int id, int deletedById);
}
