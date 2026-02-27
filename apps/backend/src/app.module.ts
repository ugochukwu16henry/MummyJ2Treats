// Clean Architecture: Application root module
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { HealthController } from './health.controller';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CartModule } from './modules/cart/cart.module';
import { AdminModule } from './modules/admin/admin.module';
import { MoatModule } from './modules/moat/moat.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { RidersModule } from './modules/riders/riders.module';
import { TestimonialsModule } from './modules/testimonials/testimonials.module';
import { NewsletterModule } from './modules/newsletter/newsletter.module';

@Module({
  controllers: [AppController, HealthController],
  imports: [
    DatabaseModule,
    AuthModule,
    UsersModule,
    VendorsModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    CartModule,
    AdminModule,
    MoatModule,
    DeliveryModule,
    RidersModule,
    TestimonialsModule,
    NewsletterModule,
  ],
})
export class AppModule {}
