import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { register } from './metrics';

@Controller()
export class MetricsController {
  @Get('metrics')
  async getMetrics(@Res() res: Response): Promise<void> {
    // prom-client >= 14 expone metrics() como Promise<string>: hay que
    // esperarla antes de cerrar la respuesta.
    res.setHeader('Content-Type', register.contentType);
    res.end(await register.metrics());
  }
}
