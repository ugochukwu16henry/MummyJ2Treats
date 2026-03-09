using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
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
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

// Data store (JSON file as lightweight database)
builder.Services.AddSingleton<JsonDataStore>();

// Optional: Cloudinary for receipt image uploads
var cloudSection = builder.Configuration.GetSection("Cloudinary");
var cloudName = cloudSection["CloudName"];
var cloudKey = cloudSection["ApiKey"];
var cloudSecret = cloudSection["ApiSecret"];
if (!string.IsNullOrWhiteSpace(cloudName) &&
    !string.IsNullOrWhiteSpace(cloudKey) &&
    !string.IsNullOrWhiteSpace(cloudSecret))
{
    var account = new Account(cloudName, cloudKey, cloudSecret);
    builder.Services.AddSingleton(new Cloudinary(account));
}

// PDF receipt service (QuestPDF entrypoint)
builder.Services.AddSingleton<PdfReceiptService>();

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

api.MapPost("/orders/{orderId:guid}/upload-receipt", async (Guid orderId, IFormFile file, JsonDataStore store, IWebHostEnvironment env, IServiceProvider sp) =>
{
    var data = store.Load();
    var order = data.Orders.SingleOrDefault(o => o.OrderId == orderId);
    if (order is null) return Results.NotFound(new { message = "Order not found." });

    if (file == null || file.Length == 0)
        return Results.BadRequest(new { message = "No file uploaded." });

    // Prefer Cloudinary if configured
    var cloud = sp.GetService<Cloudinary>();
    if (cloud != null)
    {
        await using var stream = file.OpenReadStream();
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = "mummyj2_receipts"
        };
        var result = await cloud.UploadAsync(uploadParams);
        order.BankReceiptImageUrl = result.SecureUrl?.ToString();
    }
    else
    {
        // Fallback: store under wwwroot/uploads/receipts
        var webRoot = string.IsNullOrEmpty(env.WebRootPath)
            ? Path.Combine(env.ContentRootPath, "wwwroot")
            : env.WebRootPath;
        Directory.CreateDirectory(webRoot);
        var uploadDir = Path.Combine(webRoot, "uploads", "receipts");
        Directory.CreateDirectory(uploadDir);

        foreach (var existing in Directory.GetFiles(uploadDir, orderId + ".*"))
        {
            try { File.Delete(existing); } catch { /* ignore */ }
        }

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(ext))
            ext = ".jpg";
        var safeExt = ext.ToLowerInvariant();
        var fileName = orderId + safeExt;
        var path = Path.Combine(uploadDir, fileName);
        await using var fs = new FileStream(path, FileMode.Create, FileAccess.Write, FileShare.None);
        await file.CopyToAsync(fs);
        order.BankReceiptImageUrl = "/uploads/receipts/" + fileName;
    }

    order.Status = OrderStatus.Pending;
    store.Save(data);
    return Results.Ok(new { message = "Receipt uploaded. Waiting for admin approval." });
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
    return Results.Ok(data.Orders.OrderByDescending(o => o.OrderDate));
});

admin.MapPost("/orders/{id}/approve", (Guid id, JsonDataStore store, PdfReceiptService pdf, IWebHostEnvironment env) =>
{
    var data = store.Load();
    var order = data.Orders.SingleOrDefault(o => o.OrderId == id);
    if (order is null) return Results.NotFound();
    order.Status = OrderStatus.Approved;
    order.ReceiptPdfUrl = pdf.GenerateReceipt(order, env);
    store.Save(data);
    return Results.Ok(new { message = "Order Approved and Receipt Generated", order, pdfLink = order.ReceiptPdfUrl });
});

app.MapGet("/", () => Results.Ok(new { message = "MummyJ2Treats JSON API running" }));

app.Run();

