import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { createLeadSchema, listLeadsQuerySchema, updateLeadSchema } from '../schemas/lead.schema';
import * as leadService from '../services/lead.service';
import * as importExportService from '../services/importExport.service';
import { parseCsvBuffer } from '../utils/csv';
import { AppError } from '../utils/AppError';
import { recordAudit } from '../utils/audit';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listLeadsQuerySchema.parse(req.query);
    const result = await leadService.listLeads(req.organizationId!, query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const lead = await leadService.getLead(req.organizationId!, req.params.id);
    res.json(lead);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createLeadSchema.parse(req.body);
    const lead = await leadService.createLead(req.organizationId!, input);
    await recordAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'lead.created',
      resourceType: 'lead',
      resourceId: lead.id,
      ipAddress: req.ip,
    });
    res.status(201).json(lead);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateLeadSchema.parse(req.body);
    const lead = await leadService.updateLead(req.organizationId!, req.params.id, input);
    await recordAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'lead.updated',
      resourceType: 'lead',
      resourceId: lead.id,
      ipAddress: req.ip,
    });
    res.json(lead);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await leadService.deleteLead(req.organizationId!, req.params.id);
    await recordAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'lead.deleted',
      resourceType: 'lead',
      resourceId: req.params.id,
      ipAddress: req.ip,
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

const importMappingSchema = z.object({ mapping: z.string() }); // JSON-encoded { crmField: csvHeader }

export async function importCsv(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError('No CSV file provided', 400);
    const { mapping } = importMappingSchema.parse(req.body);
    const parsedMapping = JSON.parse(mapping);
    const { rows } = parseCsvBuffer(req.file.buffer);
    const result = await importExportService.importLeads(req.organizationId!, rows, parsedMapping);
    await recordAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'leads.imported',
      metadata: { imported: result.imported, skipped: result.skipped },
      ipAddress: req.ip,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function exportCsv(req: Request, res: Response, next: NextFunction) {
  try {
    const csv = await importExportService.exportLeads(req.organizationId!);
    await recordAudit({ organizationId: req.organizationId!, userId: req.user!.id, action: 'leads.exported', ipAddress: req.ip });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
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

export async function duplicates(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await leadService.getDuplicateGroups(req.organizationId!));
  } catch (err) {
    next(err);
  }
}

const mergeSchema = z.object({ keepId: z.string().uuid(), mergeIds: z.array(z.string().uuid()).min(1) });

export async function merge(req: Request, res: Response, next: NextFunction) {
  try {
    const { keepId, mergeIds } = mergeSchema.parse(req.body);
    const merged = await leadService.mergeLeads(req.organizationId!, keepId, mergeIds);
    await recordAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'leads.merged',
      resourceType: 'lead',
      resourceId: keepId,
      metadata: { mergedIds: mergeIds },
      ipAddress: req.ip,
    });
    res.json(merged);
  } catch (err) {
    next(err);
  }
}
