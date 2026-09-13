import * as companyRepo from '../repositories/company.repository';
import { AppError } from '../utils/AppError';
import type { CreateCompanyInput, ListCompaniesQuery, UpdateCompanyInput } from '../schemas/company.schema';

export async function listCompanies(organizationId: string, query: ListCompaniesQuery) {
  return companyRepo.list(organizationId, query);
}

export async function getCompany(organizationId: string, id: string) {
  const company = await companyRepo.findById(organizationId, id);
  if (!company) throw new AppError('Company not found', 404);
  return company;
}

export async function createCompany(organizationId: string, input: CreateCompanyInput) {
  return companyRepo.create(organizationId, input);
}

export async function updateCompany(organizationId: string, id: string, input: UpdateCompanyInput) {
  const updated = await companyRepo.update(organizationId, id, input);
  if (!updated) throw new AppError('Company not found', 404);
  return updated;
}

export async function deleteCompany(organizationId: string, id: string) {
  const deleted = await companyRepo.softDelete(organizationId, id);
  if (!deleted) throw new AppError('Company not found', 404);
  return deleted;
}
