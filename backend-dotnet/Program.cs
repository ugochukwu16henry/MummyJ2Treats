using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication;
using System.Text;
using MummyJ2Treats.Api.Auth;
using MummyJ2Treats.Api.Storefront;
using MummyJ2Treats.Api.Orders;
using MummyJ2Treats.Api.Payments;
using MummyJ2Treats.Api.Carts;
using MummyJ2Treats.Api.Admin;
using MummyJ2Treats.Application.Auth;
using MummyJ2Treats.Application.Common;
using MummyJ2Treats.Application.Products;
using MummyJ2Treats.Application.Orders;
using MummyJ2Treats.Application.Payments;
using MummyJ2Treats.Application.Carts;
using MummyJ2Treats.Application.Riders;
using MummyJ2Treats.Infrastructure.Auth;
using MummyJ2Treats.Infrastructure.Persistence;
using MummyJ2Treats.Infrastructure.Products;
using MummyJ2Treats.Infrastructure.Orders;
using MummyJ2Treats.Infrastructure.Payments;
using MummyJ2Treats.Infrastructure.Carts;
using MummyJ2Treats.Infrastructure.Riders;
using MummyJ2Treats.Domain.Users;

// Load .env from project directory (so ConnectionStrings__DefaultConnection etc. can override appsettings)
DotNetEnv.Env.TraversePath().Load();
var builder = WebApplication.CreateBuilder(args);

// Railway (and similar hosts) set PORT; listen on 0.0.0.0 so the app accepts external traffic
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// Database: prefer env vars (Railway) over appsettings.json
var envConnection =
    Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection") ??
    Environment.GetEnvironmentVariable("DATABASE_URL") ??
    builder.Configuration.GetConnectionString("DefaultConnection");

// Normalize to one line (Railway UI sometimes keeps pasted newlines)
var connectionString = string.IsNullOrWhiteSpace(envConnection) ? null : string.Join(";",
    envConnection.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()).Where(s => s.Length > 0));

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("Set ConnectionStrings__DefaultConnection or DATABASE_URL for the database connection.");
}

builder.Services.AddDbContext<MummyJ2TreatsDbContext>(options =>
    options.UseNpgsql(connectionString));

// Auth & JWT
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();

var jwtSection = builder.Configuration.GetSection("Jwt");
var key = jwtSection["Key"] ?? "CHANGE_THIS_SUPER_SECRET_KEY";
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSection["Issuer"] ?? "MummyJ2Treats",
        ValidAudience = jwtSection["Audience"] ?? "MummyJ2Treats.Frontend",
        IssuerSigningKey = signingKey
    };

    // Allow tokens to be sent via access_token cookie (frontend already sets this)
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var token = context.Request.Cookies["access_token"];
            if (!string.IsNullOrEmpty(token))
            {
                context.Token = token;
            }

            return Task.CompletedTask;
        }
    };
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .SetIsOriginAllowed(_ => true) // allow all origins
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddAuthorization();

// Products
builder.Services.AddScoped<IProductQueryService, ProductQueryService>();

// Orders
builder.Services.AddScoped<IOrderService, OrderService>();

// Payments
builder.Services.AddScoped<IPaymentService, PaymentService>();

// Cart
builder.Services.AddScoped<ICartService, CartService>();

// Admin orders
builder.Services.AddScoped<IAdminOrderService, AdminOrderService>();

// Riders
builder.Services.AddScoped<IRiderService, RiderService>();

var app = builder.Build();

// Ensure database schema exists and seed founder admin if configured (non-fatal so app still starts if DB is down)
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<MummyJ2TreatsDbContext>();
    db.Database.EnsureCreated();

    var founderEmail = Environment.GetEnvironmentVariable("FOUNDER_ADMIN_EMAIL")?.Trim();
    var seedPassword = Environment.GetEnvironmentVariable("ADMIN_SEED_PASSWORD")?.Trim();
    if (!string.IsNullOrEmpty(founderEmail) && !string.IsNullOrEmpty(seedPassword))
    {
        var existing = db.Users.FirstOrDefaultAsync(u => u.Email == founderEmail).GetAwaiter().GetResult();
        if (existing == null)
        {
            db.Users.Add(new User
            {
                FirstName = "Admin",
                LastName = "Founder",
                Email = founderEmail,
                PasswordHash = global::BCrypt.Net.BCrypt.HashPassword(seedPassword),
                Role = UserRole.Admin,
                IsActive = true
            });
            db.SaveChangesAsync().GetAwaiter().GetResult();
        }
    }
}
catch (Exception ex)
{
    // Log but do not crash: app will start and respond; API calls may fail until DB is fixed
    Console.WriteLine($"[Startup] Database init/seed failed: {ex.Message}");
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// Minimal API endpoints
app.MapAuthEndpoints();
app.MapProductEndpoints();
app.MapOrderEndpoints();
app.MapPaymentEndpoints();
app.MapCartEndpoints();
app.MapAdminOrderEndpoints();
app.MapAdminRiderEndpoints();

app.MapGet("/", () => "MummyJ2Treats Backend is running!");
app.Run();
