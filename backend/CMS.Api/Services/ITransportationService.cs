using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface ITransportationService
{
    Task<IEnumerable<TransportationListItemDto>> GetAllAsync();
    Task<IEnumerable<TransportationListItemDto>> GetByProjectAsync(int projectId);
    Task<TransportationListItemDto?> GetByIdAsync(int id);
    Task<(TransportationListItemDto? Item, string? Error)> CreateAsync(CreateTransportationRequest request, int createdById);
    Task<(TransportationListItemDto? Item, string? Error)> UpdateAsync(int id, UpdateTransportationRequest request, int updatedById);
    Task<bool> DeleteAsync(int id, int deletedById);
}
