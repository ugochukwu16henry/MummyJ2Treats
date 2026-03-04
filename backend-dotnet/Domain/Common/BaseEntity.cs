using System;

namespace MummyJ2Treats.Domain.Common;

/// <summary>
/// Base type for all aggregate roots and entities.
/// Provides GUID primary key, audit timestamps and soft-delete flag.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }
}

