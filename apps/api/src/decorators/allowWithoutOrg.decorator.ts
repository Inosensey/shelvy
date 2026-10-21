import { SetMetadata } from '@nestjs/common';

export const ALLOW_NO_ORG = 'allowNoOrg';
export const AllowWithoutOrganization = () => SetMetadata(ALLOW_NO_ORG, true);
