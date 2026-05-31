/**
 * Promote an existing user to admin by email.
 * Usage: npx tsx scripts/make-admin.ts you@example.com
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: npx tsx scripts/make-admin.ts <email>');
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { email },
    data: { role: 'admin' },
  });

  console.log(`Updated ${user.email} → role: admin`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
