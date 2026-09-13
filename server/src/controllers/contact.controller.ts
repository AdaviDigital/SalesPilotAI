import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { createContactSchema, listContactsQuerySchema, updateContactSchema } from '../schemas/contact.schema';
import * as contactService from '../services/contact.service';
import * as importExportService from '../services/importExport.service';
import { parseCsvBuffer } from '../utils/csv';
import { AppError } from '../utils/AppError';
import { recordAudit } from '../utils/audit';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listContactsQuerySchema.parse(req.query);
    res.json(await contactService.listContacts(req.organizationId!, query));
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await contactService.getContact(req.organizationId!, req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createContactSchema.parse(req.body);
    const contact = await contactService.createContact(req.organizationId!, input);
    await recordAudit({ organizationId: req.organizationId!, userId: req.user!.id, action: 'contact.created', resourceType: 'contact', resourceId: contact.id, ipAddress: req.ip });
    res.status(201).json(contact);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateContactSchema.parse(req.body);
    const contact = await contactService.updateContact(req.organizationId!, req.params.id, input);
    await recordAudit({ organizationId: req.organizationId!, userId: req.user!.id, action: 'contact.updated', resourceType: 'contact', resourceId: contact.id, ipAddress: req.ip });
    res.json(contact);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await contactService.deleteContact(req.organizationId!, req.params.id);
    await recordAudit({ organizationId: req.organizationId!, userId: req.user!.id, action: 'contact.deleted', resourceType: 'contact', resourceId: req.params.id, ipAddress: req.ip });
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
    const result = await importExportService.importContacts(req.organizationId!, rows, JSON.parse(mapping));
    await recordAudit({ organizationId: req.organizationId!, userId: req.user!.id, action: 'contacts.imported', metadata: { imported: result.imported, skipped: result.skipped }, ipAddress: req.ip });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function exportCsv(req: Request, res: Response, next: NextFunction) {
  try {
    const csv = await importExportService.exportContacts(req.organizationId!);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');
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
