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

var builder = WebApplication.CreateBuilder(args);

// Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
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
        policy.WithOrigins(
                "http://localhost:3000",
                "https://www.mummyj2treats.com",
                "https://mummyj2treats.com")
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

app.Run();
