import { Global, Module } from '@nestjs/common';
import { PlanService } from './plan.service';
import { PlanRepository } from './plan.repository';

@Global()
@Module({ providers: [PlanService, PlanRepository], exports: [PlanService] })
export class PlanModule {}
