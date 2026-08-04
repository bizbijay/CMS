using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface IPartyNameService
{
    Task<IEnumerable<PartyNameListItemDto>> GetAllAsync();
    Task<PartyNameListItemDto> CreateAsync(CreatePartyNameRequest request, int createdById);
    Task<(PartyNameListItemDto? PartyName, string? Error)> UpdateAsync(int id, UpdatePartyNameRequest request, int updatedById);
    Task<bool> DeleteAsync(int id, int deletedById);
}
