using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using MummyJ2Treats.Api.Models;

namespace MummyJ2Treats.Api.Services;

public class PdfReceiptService
{
    public string GenerateReceipt(Order order, IWebHostEnvironment env)
    {
        var webRoot = string.IsNullOrEmpty(env.WebRootPath)
            ? Path.Combine(env.ContentRootPath, "wwwroot")
            : env.WebRootPath;
        Directory.CreateDirectory(webRoot);

        var receiptDir = Path.Combine(webRoot, "receipts");
        Directory.CreateDirectory(receiptDir);

        var fileName = $"{order.OrderId}.pdf";
        var filePath = Path.Combine(receiptDir, fileName);

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(30);
                page.Size(PageSizes.A4);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(TextStyle.Default.FontSize(12));

                page.Content().Column(col =>
                {
                    col.Item().Text("MummyJ2Treats").FontSize(20).SemiBold();
                    col.Item().Text($"Order Receipt").FontSize(14).SemiBold();
                    col.Item().Text($"Order ID: {order.OrderId}");
                    col.Item().Text($"Date: {order.OrderDate:yyyy-MM-dd HH:mm}");
                    col.Item().Text($"Customer: {order.CustomerName}");
                    col.Item().Text($"Email: {order.CustomerEmail}");
                    col.Item().Text($"Phone: {order.CustomerPhone}");
                    col.Item().Text($"Delivery address: {order.DeliveryAddress}");

                    col.Item().LineHorizontal(1).LineColor(Colors.Grey.Lighten2).MarginVertical(10);

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(30);
                            columns.RelativeColumn(4);
                            columns.ConstantColumn(60);
                            columns.ConstantColumn(50);
                        });

                        table.Header(header =>
                        {
                            header.Cell().Text("#").SemiBold();
                            header.Cell().Text("Item").SemiBold();
                            header.Cell().AlignRight().Text("Qty").SemiBold();
                            header.Cell().AlignRight().Text("Total").SemiBold();
                        });

                        var index = 1;
                        foreach (var item in order.Items)
                        {
                            table.Cell().Text(index++.ToString());
                            table.Cell().Text(item.ProductName);
                            table.Cell().AlignRight().Text(item.Quantity.ToString());
                            table.Cell().AlignRight().Text($"₦{(item.UnitPrice * item.Quantity):N0}");
                        }
                    });

                    col.Item().AlignRight().Text($"Total: ₦{order.TotalAmount:N0}").FontSize(14).SemiBold().MarginTop(10);

                    col.Item().Text("Status: " + order.Status).MarginTop(10);
                });
            });
        });

        doc.GeneratePdf(filePath);

        return "/receipts/" + fileName;
    }
}

