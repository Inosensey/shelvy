// organization.service.ts
import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from './organization.repository';
import { CreateOrganizationDTO } from './organization.dto';

@Injectable()
export class OrganizationService {
  constructor(private readonly orgRepo: OrganizationRepository) {}

  async createOrganization(data: CreateOrganizationDTO, userId: string) {
    return this.orgRepo.create(data, userId);
  }

  async getOrganizationById(id: string) {
    return this.orgRepo.findById(id);
  }

  async getMyOrganization(userId: string) {
    return this.orgRepo.findByUserId(userId);
  }
}
