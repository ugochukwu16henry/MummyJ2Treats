using System;

namespace MummyJ2Treats.Application.Riders;

public sealed record RiderDto(
    string Id,
    string FullName,
    string PhoneNumber,
    string Status,
    bool IsAvailable
);

