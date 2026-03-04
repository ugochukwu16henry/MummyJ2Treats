using System;
using MummyJ2Treats.Domain.Common;
using MummyJ2Treats.Domain.Users;

namespace MummyJ2Treats.Domain.Locations;

public class Location : BaseEntity
{
    public Guid UserId { get; set; }
    public User? User { get; set; }

    public string AddressLine1 { get; set; } = null!;
    public string? AddressLine2 { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Country { get; set; }
    public string? PostalCode { get; set; }

    public double Latitude { get; set; }
    public double Longitude { get; set; }
}

