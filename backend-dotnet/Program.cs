using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MummyJ2Treats.Api.Services;
using MummyJ2Treats.Api.Models;

var builder = WebApplication.CreateBuilder(args);

// JSON options
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

// Data store (JSON file as lightweight database)
builder.Services.AddSingleton<JsonDataStore>();

// Simple JWT auth (for admin APIs)
var jwtKey = builder.Configuration["Jwt:Key"] ?? "CHANGE_THIS_KEY_IN_PRODUCTION_123!";
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

var api = app.MapGroup("/api");

// Public storefront APIs
api.MapGet("/products", (JsonDataStore store) =>
{
    var data = store.Load();
    var products = data.Products.Where(p => p.IsActive).ToList();
    return Results.Ok(products);
});

api.MapGet("/categories", (JsonDataStore store) =>
{
    var data = store.Load();
    return Results.Ok(data.Categories);
});

api.MapPost("/orders", (CreateOrderRequest request, JsonDataStore store) =>
{
    var data = store.Load();
    var order = Order.CreateFromRequest(request, data.Products);
    data.Orders.Add(order);
    store.Save(data);
    return Results.Ok(order);
});

// Admin APIs (JWT protected)
var admin = api.MapGroup("/admin").RequireAuthorization();

admin.MapGet("/products", (JsonDataStore store) =>
{
    var data = store.Load();
    return Results.Ok(data.Products);
});

admin.MapPost("/products", (CreateProductRequest request, JsonDataStore store) =>
{
    var data = store.Load();
    var product = Product.Create(request, data.Categories);
    data.Products.Add(product);
    store.Save(data);
    return Results.Ok(product);
});

admin.MapPut("/products/{id}", (Guid id, UpdateProductRequest request, JsonDataStore store) =>
{
    var data = store.Load();
    var product = data.Products.SingleOrDefault(p => p.Id == id);
    if (product is null) return Results.NotFound();
    product.Update(request, data.Categories);
    store.Save(data);
    return Results.Ok(product);
});

admin.MapDelete("/products/{id}", (Guid id, JsonDataStore store) =>
{
    var data = store.Load();
    var product = data.Products.SingleOrDefault(p => p.Id == id);
    if (product is null) return Results.NotFound();
    data.Products.Remove(product);
    store.Save(data);
    return Results.NoContent();
});

admin.MapGet("/orders", (JsonDataStore store) =>
{
    var data = store.Load();
    return Results.Ok(data.Orders.OrderByDescending(o => o.CreatedAt));
});

admin.MapPost("/orders/{id}/approve", (Guid id, JsonDataStore store) =>
{
    var data = store.Load();
    var order = data.Orders.SingleOrDefault(o => o.Id == id);
    if (order is null) return Results.NotFound();
    order.Status = "Approved";
    // Receipt PDF generation hook would plug in here (QuestPDF).
    store.Save(data);
    return Results.Ok(order);
});

app.MapGet("/", () => Results.Ok(new { message = "MummyJ2Treats JSON API running" }));

app.Run();

