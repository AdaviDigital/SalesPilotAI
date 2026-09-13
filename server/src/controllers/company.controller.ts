import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { createCompanySchema, listCompaniesQuerySchema, updateCompanySchema } from '../schemas/company.schema';
import * as companyService from '../services/company.service';
import * as importExportService from '../services/importExport.service';
import { parseCsvBuffer } from '../utils/csv';
import { AppError } from '../utils/AppError';
import { recordAudit } from '../utils/audit';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listCompaniesQuerySchema.parse(req.query);
    res.json(await companyService.listCompanies(req.organizationId!, query));
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await companyService.getCompany(req.organizationId!, req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createCompanySchema.parse(req.body);
    const company = await companyService.createCompany(req.organizationId!, input);
    await recordAudit({ organizationId: req.organizationId!, userId: req.user!.id, action: 'company.created', resourceType: 'company', resourceId: company.id, ipAddress: req.ip });
    res.status(201).json(company);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateCompanySchema.parse(req.body);
    const company = await companyService.updateCompany(req.organizationId!, req.params.id, input);
    await recordAudit({ organizationId: req.organizationId!, userId: req.user!.id, action: 'company.updated', resourceType: 'company', resourceId: company.id, ipAddress: req.ip });
    res.json(company);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await companyService.deleteCompany(req.organizationId!, req.params.id);
    await recordAudit({ organizationId: req.organizationId!, userId: req.user!.id, action: 'company.deleted', resourceType: 'company', resourceId: req.params.id, ipAddress: req.ip });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

const importMappingSchema = z.object({ mapping: z.string() });

export async function importCsv(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError('No CSV file provided', 400);
    const { mapping } = importMappingSchema.parse(req.body);
    const { rows } = parseCsvBuffer(req.file.buffer);
    const result = await importExportService.importCompanies(req.organizationId!, rows, JSON.parse(mapping));
    await recordAudit({ organizationId: req.organizationId!, userId: req.user!.id, action: 'companies.imported', metadata: { imported: result.imported, skipped: result.skipped }, ipAddress: req.ip });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function exportCsv(req: Request, res: Response, next: NextFunction) {
  try {
    const csv = await importExportService.exportCompanies(req.organizationId!);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="companies.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

export async function previewCsv(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError('No CSV file provided', 400);
    const { headers, rows } = parseCsvBuffer(req.file.buffer);
    res.json({ headers, rowCount: rows.length, sample: rows.slice(0, 5) });
  } catch (err) {
    next(err);
  }
}
