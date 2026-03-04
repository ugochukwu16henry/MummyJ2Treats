using System;
using System.Threading;
using System.Threading.Tasks;

namespace MummyJ2Treats.Application.Carts;

public interface ICartService
{
    Task<CartResponseDto> GetMyCartAsync(Guid customerId, CancellationToken cancellationToken = default);

    Task<CartResponseDto> AddItemAsync(Guid customerId, Guid productId, int quantity, CancellationToken cancellationToken = default);

    Task<CartResponseDto> UpdateItemAsync(Guid customerId, Guid productId, int quantity, CancellationToken cancellationToken = default);
}

