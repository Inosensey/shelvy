// src/prismaConfig/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Required so the serverless driver can use WebSockets in Node.js environments
neonConfig.webSocketConstructor = ws;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // 1. Establish the Neon Serverless Pool
    const adapter = new PrismaNeon({
      connectionString: process.env.DATABASE_URL,
    });

    super({ adapter });
  }

  async onModuleInit() {
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

    try {
      await this.$connect();
      console.log('✅ Prisma connected successfully to Neon');

      const result = await this.$queryRaw`SELECT NOW()`;
      console.log('✅ Database response:', result);
    } catch (error) {
      console.error('❌ Prisma connection failed:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
