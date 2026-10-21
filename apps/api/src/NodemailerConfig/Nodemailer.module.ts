import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { NodemailerService } from './Nodemailer.service';
import { InviteCleanupService } from './inviteCleanup.service';
import { OrganizationRepository } from 'src/modules/organizationModule/organization.repository';
import { UserModule } from 'src/modules/usersModule/user.module';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const port = Number(configService.get<number>('MAIL_PORT', 2525));

        return {
          transport: {
            host: configService.get<string>(
              'MAIL_HOST',
              'sandbox.smtp.mailtrap.io',
            ),
            port: port,
            secure: port === 465,
            auth: {
              user: configService.get<string>('MAIL_USER') || '',
              pass: configService.get<string>('MAIL_PASS') || '',
            },
          },
        };
      },
      inject: [ConfigService],
    }),
    UserModule,
  ],
  providers: [NodemailerService, InviteCleanupService, OrganizationRepository],
  exports: [NodemailerService],
})
export class NodemailerModule {}
