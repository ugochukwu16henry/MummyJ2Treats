using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using MummyJ2Treats.Api.Services;
using MummyJ2Treats.Api.Models;

var builder = WebApplication.CreateBuilder(args);

var corsOriginsRaw = Environment.GetEnvironmentVariable("CORS_ORIGINS")
    ?? Environment.GetEnvironmentVariable("FRONTEND_URL")
    ?? string.Empty;

var corsOrigins = corsOriginsRaw
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .ToArray();

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
var jwtKey = builder.Configuration["Jwt:Key"] ?? Environment.GetEnvironmentVariable("JWT_SECRET") ?? "CHANGE_THIS_KEY_IN_PRODUCTION_123!";
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

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        if (corsOrigins.Length > 0)
        {
            policy.WithOrigins(corsOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
        else
        {
            policy.AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});

var app = builder.Build();

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();

var api = app.MapGroup("/api");

app.MapGet("/health", (IWebHostEnvironment env) =>
{
    var dataPath = Path.Combine(env.ContentRootPath, "data", "store.json");
    return Results.Ok(new
    {
        status = "ok",
        storage = "json-file",
        dataPath,
        service = "MummyJ2Treats.Api"
    });
});

api.MapGet("/health", (IWebHostEnvironment env) =>
{
    var dataPath = Path.Combine(env.ContentRootPath, "data", "store.json");
    return Results.Ok(new
    {
        status = "ok",
        storage = "json-file",
        dataPath,
        service = "MummyJ2Treats.Api"
    });
});

// Auth: simple single-admin login that returns a JWT
api.MapPost("/auth/login", (LoginRequest request) =>
{
    var adminEmail = Environment.GetEnvironmentVariable("ADMIN_EMAIL") ?? "admin@mummyj2treats.com";
    var adminPassword = Environment.GetEnvironmentVariable("ADMIN_PASSWORD") ?? "YourSecurePassword";

    if (!string.Equals(request.Email?.Trim(), adminEmail, StringComparison.OrdinalIgnoreCase) ||
        request.Password != adminPassword)
    {
        return Results.Unauthorized();
    }

    var claims = new[]
    {
        new Claim(JwtRegisteredClaimNames.Sub, adminEmail),
        new Claim(ClaimTypes.Role, "Admin")
    };

    var token = new JwtSecurityToken(
        claims: claims,
        expires: DateTime.UtcNow.AddHours(12),
        signingCredentials: new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256)
    );

    var handler = new JwtSecurityTokenHandler();
    var jwt = handler.WriteToken(token);

    return Results.Ok(new { token = jwt });
});

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

admin.MapPost("/products", async (HttpRequest httpRequest, JsonDataStore store, IWebHostEnvironment env, IServiceProvider sp) =>
{
    var data = store.Load();

    // Support multipart form-data with image upload, or fallback to JSON body.
    CreateProductRequest request;
    IFormFile? imageFile = null;

    if (httpRequest.HasFormContentType)
    {
        var form = await httpRequest.ReadFormAsync();
        var name = form["name"].ToString();
        var description = form["description"].ToString();
        var size = form["size"].ToString();
        var categoryIdText = form["categoryId"].ToString();
        var priceText = form["price"].ToString();
        var isActiveText = form["isActive"].ToString();

        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(priceText) || string.IsNullOrWhiteSpace(categoryIdText))
        {
            return Results.BadRequest(new { message = "Name, price and category are required." });
        }

        if (!decimal.TryParse(priceText, out var price))
        {
            return Results.BadRequest(new { message = "Invalid price." });
        }

        if (!Guid.TryParse(categoryIdText, out var categoryId))
        {
            return Results.BadRequest(new { message = "Invalid category id." });
        }

        var isActive = string.IsNullOrWhiteSpace(isActiveText) || bool.Parse(isActiveText);

        imageFile = form.Files["image"];

        request = new CreateProductRequest(
            Name: name,
            Slug: null,
            Description: string.IsNullOrWhiteSpace(description) ? null : description,
            Price: price,
            Size: string.IsNullOrWhiteSpace(size) ? null : size,
            ImageUrl: null,
            CategoryId: categoryId,
            IsActive: isActive
        );
    }
    else
    {
        var body = await httpRequest.ReadFromJsonAsync<CreateProductRequest>();
        if (body is null)
        {
            return Results.BadRequest(new { message = "Invalid product payload." });
        }
        request = body;
    }

    // If there is an image file, upload to Cloudinary or local /uploads/products.
    string? imageUrl = request.ImageUrl;
    if (imageFile != null && imageFile.Length > 0)
    {
        var cloud = sp.GetService<Cloudinary>();
        if (cloud != null)
        {
            await using var stream = imageFile.OpenReadStream();
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(imageFile.FileName, stream),
                Folder = "mummyj2_products"
            };
            var result = await cloud.UploadAsync(uploadParams);
            imageUrl = result.SecureUrl?.ToString();
        }
        else
        {
            var webRoot = string.IsNullOrEmpty(env.WebRootPath)
                ? Path.Combine(env.ContentRootPath, "wwwroot")
                : env.WebRootPath;
            Directory.CreateDirectory(webRoot);
            var uploadDir = Path.Combine(webRoot, "uploads", "products");
            Directory.CreateDirectory(uploadDir);

            var ext = Path.GetExtension(imageFile.FileName);
            if (string.IsNullOrWhiteSpace(ext))
                ext = ".jpg";
            var safeExt = ext.ToLowerInvariant();
            var fileName = Guid.NewGuid() + safeExt;
            var path = Path.Combine(uploadDir, fileName);

            await using var fs = new FileStream(path, FileMode.Create, FileAccess.Write, FileShare.None);
            await imageFile.CopyToAsync(fs);
            imageUrl = "/uploads/products/" + fileName;
        }
    }

    var createWithImage = request with { ImageUrl = imageUrl };
    var product = Product.Create(createWithImage, data.Categories);
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

