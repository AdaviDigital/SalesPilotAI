import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('DemoPass123!', 12);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@demo.salespilot.ai' },
    update: {},
    create: {
      email: 'owner@demo.salespilot.ai',
      firstName: 'Amara',
      lastName: 'Chukwu',
      passwordHash,
      isEmailVerified: true,
    },
  });

  const rep = await prisma.user.upsert({
    where: { email: 'rep@demo.salespilot.ai' },
    update: {},
    create: {
      email: 'rep@demo.salespilot.ai',
      firstName: 'Daniel',
      lastName: 'Okafor',
      passwordHash,
      isEmailVerified: true,
    },
  });

  const org = await prisma.organization.upsert({
    where: { slug: 'demo-organization' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-organization',
      industry: 'Technology',
      currency: 'USD',
      settings: { create: {} },
      subscription: { create: { plan: 'PROFESSIONAL', status: 'active', seatLimit: 10, aiRequestLimit: 1000 } },
      pipelines: {
        create: {
          name: 'Default Pipeline',
          isDefault: true,
          stages: {
            create: [
              { name: 'New Lead', order: 0, probability: 10 },
              { name: 'Contacted', order: 1, probability: 20 },
              { name: 'Qualified', order: 2, probability: 40 },
              { name: 'Discovery', order: 3, probability: 55 },
              { name: 'Proposal', order: 4, probability: 70 },
              { name: 'Negotiation', order: 5, probability: 85 },
              { name: 'Closed Won', order: 6, probability: 100, isWon: true },
              { name: 'Closed Lost', order: 7, probability: 0, isLost: true },
            ],
          },
        },
      },
    },
  });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: owner.id } },
    update: {},
    create: { organizationId: org.id, userId: owner.id, role: 'OWNER', joinedAt: new Date() },
  });
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: rep.id } },
    update: {},
    create: { organizationId: org.id, userId: rep.id, role: 'SALES_REP', joinedAt: new Date() },
  });

  const existingLeads = await prisma.lead.count({ where: { organizationId: org.id } });
  if (existingLeads === 0) {
    await prisma.lead.createMany({
      data: [
        {
          organizationId: org.id,
          firstName: 'Ifeoma',
          lastName: 'Balogun',
          email: 'ifeoma.balogun@acmetech.example',
          companyName: 'Acme Technologies',
          jobTitle: 'Head of Sales',
          industry: 'Technology',
          source: 'LinkedIn',
          status: 'QUALIFIED',
          leadScore: 88,
          temperature: 'HOT',
          estimatedValue: 24000,
          ownerId: rep.id,
        },
        {
          organizationId: org.id,
          firstName: 'Segun',
          lastName: 'Adeyemi',
          email: 'segun@bluewave.example',
          companyName: 'BlueWave Logistics',
          jobTitle: 'Operations Director',
          industry: 'Logistics',
          source: 'Website',
          status: 'NEW',
          leadScore: 54,
          temperature: 'WARM',
          estimatedValue: 9000,
          ownerId: rep.id,
        },
        {
          organizationId: org.id,
          firstName: 'Grace',
          lastName: 'Nnamdi',
          email: 'grace.nnamdi@fintrust.example',
          companyName: 'FinTrust Capital',
          jobTitle: 'VP Partnerships',
          industry: 'Financial Services',
          source: 'Referral',
          status: 'CONTACTED',
          leadScore: 71,
          temperature: 'WARM',
          estimatedValue: 42000,
          ownerId: owner.id,
        },
      ],
    });
  }

  // eslint-disable-next-line no-console
  console.log('✅ Seed complete. Demo login: owner@demo.salespilot.ai / DemoPass123!');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
