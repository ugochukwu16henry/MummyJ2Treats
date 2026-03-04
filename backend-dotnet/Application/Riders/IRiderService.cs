using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace MummyJ2Treats.Application.Riders;

public interface IRiderService
{
    Task<IReadOnlyList<RiderDto>> GetAllAsync(CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

