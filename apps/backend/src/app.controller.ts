import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      name: 'MummyJ2Treats API',
      version: '1.0',
      health: '/health',
      docs: 'See /health for API status.',
    };
  }
}
