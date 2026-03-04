using System.Threading;
using System.Threading.Tasks;

namespace MummyJ2Treats.Application.Payments;

public interface IPaymentService
{
    Task<InitializeOnlinePaymentResponse> InitializeOnlinePaymentAsync(InitializeOnlinePaymentRequest request, CancellationToken cancellationToken = default);

    Task<PaymentDto> CreateBankTransferPaymentAsync(BankTransferPaymentRequest request, CancellationToken cancellationToken = default);
}

