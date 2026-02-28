import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { mkdirSync } from 'fs';

async function bootstrap() {
  const uploadsRoot = join(process.cwd(), 'uploads');
  const founderAdminDir = join(uploadsRoot, 'founder-admin');
  try {
    mkdirSync(founderAdminDir, { recursive: true });
  } catch {
    // ignore if already exists or permission issue
  }

  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  // CORS: whitelist frontend so browser allows cross-origin requests (including preflight OPTIONS)
  const defaultOrigins = [
    'https://www.mummyj2treats.com',
    'https://mummyj2treats.com',
    'http://localhost:3000',
  ];
  const envOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const allowedOrigins = envOrigins.length > 0 ? envOrigins : defaultOrigins;

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  // Serve uploaded testimonial images (and other future assets)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use('/uploads', require('express').static(uploadsRoot));

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
}

bootstrap();
