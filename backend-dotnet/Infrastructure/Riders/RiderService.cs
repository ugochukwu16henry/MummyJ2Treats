using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MummyJ2Treats.Application.Riders;
using MummyJ2Treats.Domain.Riders;
using MummyJ2Treats.Infrastructure.Persistence;

namespace MummyJ2Treats.Infrastructure.Riders;

public sealed class RiderService : IRiderService
{
    private readonly MummyJ2TreatsDbContext _db;

    public RiderService(MummyJ2TreatsDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<RiderDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var riders = await _db.Riders
            .AsNoTracking()
            .Where(r => !r.IsDeleted)
            .OrderBy(r => r.FullName)
            .ToListAsync(cancellationToken);

        return riders
            .Select(r =>
            {
                var parts = (r.FullName ?? string.Empty).Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
                var fullName = r.FullName;
                return new RiderDto(
                    Id: r.Id.ToString(),
                    FullName: fullName,
                    PhoneNumber: r.PhoneNumber,
                    Status: r.Status.ToString(),
                    IsAvailable: r.Status == RiderStatus.Active);
            })
            .ToList();
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var rider = await _db.Riders.FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted, cancellationToken);
        if (rider is null)
        {
            return;
        }

        _db.Riders.Remove(rider);
        await _db.SaveChangesAsync(cancellationToken);
    }
}

