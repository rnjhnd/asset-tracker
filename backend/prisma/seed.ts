import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

async function main() {
  const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@system.com' } });
  
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: 'admin@system.com',
        passwordHash,
        role: 'ADMIN',
      }
    });
    console.log('Admin user created: admin@system.com / admin123');
  } else {
    console.log('Admin user already exists.');
  }

  // Create a dummy asset if none exist
  const existingAsset = await prisma.asset.findUnique({ where: { serialNumber: 'MBP-16-001' } });
  if (!existingAsset) {
    await prisma.asset.create({
      data: {
        name: 'MacBook Pro 16"',
        serialNumber: 'MBP-16-001',
        category: 'LAPTOP',
        status: 'AVAILABLE',
        purchaseDate: new Date(),
      }
    });
    console.log('Dummy asset created.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
