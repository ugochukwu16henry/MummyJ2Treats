import {
  Controller,
  Post,
  Param,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(AuthGuard('jwt'))
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

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
