// users.module.ts
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { AuthModule } from '../authModule/auth.module';
import { OrganizationModule } from '../organizationModule/organization.module';

@Module({
  imports: [AuthModule, OrganizationModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
