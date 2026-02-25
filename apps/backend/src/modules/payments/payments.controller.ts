import {
  Controller,
  Post,
  Param,
  Body,
  Req,
  Res,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  UnauthorizedException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /** Paystack webhook (no auth; verify X-Paystack-Signature) */
  @Post('webhook/paystack')
  async paystackWebhook(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const signature = req.headers['x-paystack-signature'] as string;
    if (!signature) {
      throw new UnauthorizedException('Missing signature');
    }
    const valid = this.paymentsService.verifyPaystackSignature(req.body, signature);
    if (!valid) {
      throw new UnauthorizedException('Invalid signature');
    }
    try {
      await this.paymentsService.handlePaystackWebhook(req.body);
    } catch {
      // still return 200 so Paystack doesn't retry
    }
    res.status(200).send();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':paymentId/receipt')
  @UseInterceptors(FileInterceptor('receipt'))
  uploadReceipt(
    @Param('paymentId') paymentId: string,
    @UploadedFile() file: any,
  ) {
    return this.paymentsService.handleBankTransferReceipt(
      paymentId,
      file.path,
    );
  }
}
