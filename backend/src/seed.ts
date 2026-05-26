import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database reset...');

  // 1. Delete all existing records (in correct order due to foreign keys)
  await prisma.assignment.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Database cleared. Injecting pristine demo data...');

  // 2. Create the Master Admin account
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@system.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isActive: true,
    }
  });

  // 3. Create standard Employee accounts
  const employeePassword = await bcrypt.hash('employee123', 10);
  const employee1 = await prisma.user.create({
    data: {
      email: 'employee1@system.com',
      passwordHash: employeePassword,
      role: 'EMPLOYEE',
      isActive: true,
    }
  });

  const employee2 = await prisma.user.create({
    data: {
      email: 'employee2@system.com',
      passwordHash: employeePassword,
      role: 'EMPLOYEE',
      isActive: true,
    }
  });

  // 4. Create base hardware inventory
  const baseAssets = [
    { name: 'MacBook Pro 16" (M3 Max)', serialNumber: 'MBP-16-001', category: 'LAPTOP', status: 'ASSIGNED', purchaseDate: new Date('2024-01-15') },
    { name: 'MacBook Pro 14" (M3 Pro)', serialNumber: 'MBP-14-001', category: 'LAPTOP', status: 'AVAILABLE', purchaseDate: new Date('2024-01-15') },
    { name: 'Dell XPS 15', serialNumber: 'DXP-15-001', category: 'LAPTOP', status: 'MAINTENANCE', purchaseDate: new Date('2023-11-01') },
    { name: 'Dell UltraSharp 32" 4K', serialNumber: 'MON-32-001', category: 'MONITOR', status: 'ASSIGNED', purchaseDate: new Date('2023-06-10') },
    { name: 'LG 27" Ergo Monitor', serialNumber: 'MON-27-001', category: 'MONITOR', status: 'AVAILABLE', purchaseDate: new Date('2023-06-10') },
    { name: 'iPhone 15 Pro', serialNumber: 'IPH-15-001', category: 'PHONE', status: 'ASSIGNED', purchaseDate: new Date('2023-09-22') },
    { name: 'iPad Pro 12.9"', serialNumber: 'IPD-12-001', category: 'TABLET', status: 'AVAILABLE', purchaseDate: new Date('2024-02-10') },
    { name: 'Cisco Meraki MX68', serialNumber: 'NET-MX-001', category: 'NETWORK', status: 'RETIRED', purchaseDate: new Date('2021-01-15') },
    { name: 'Server Rack X1', serialNumber: 'SRV-X1-001', category: 'SERVER', status: 'AVAILABLE', purchaseDate: new Date('2023-05-01') },
    { name: 'Logitech MX Master 3S', serialNumber: 'ACC-MX-001', category: 'ACCESSORY', status: 'AVAILABLE', purchaseDate: new Date('2024-01-01') },
  ];

  const createdAssets = [];
  for (const assetData of baseAssets) {
    const asset = await prisma.asset.create({
      data: {
        name: assetData.name,
        serialNumber: assetData.serialNumber,
        category: assetData.category as any,
        status: assetData.status as any,
        purchaseDate: assetData.purchaseDate
      }
    });
    createdAssets.push(asset);
  }

  // 5. Create assignments for the assigned assets
  // Assign MacBook Pro 16 to employee1
  await prisma.assignment.create({
    data: {
      userId: employee1.id,
      assetId: createdAssets[0].id,
      checkoutDate: new Date('2024-01-20'),
    }
  });

  // Assign Dell Monitor to employee1
  await prisma.assignment.create({
    data: {
      userId: employee1.id,
      assetId: createdAssets[3].id,
      checkoutDate: new Date('2024-01-20'),
    }
  });

  // Assign iPhone to employee2
  await prisma.assignment.create({
    data: {
      userId: employee2.id,
      assetId: createdAssets[5].id,
      checkoutDate: new Date('2023-09-25'),
    }
  });

  console.log('✅ Demo state successfully seeded! The database is now pristine.');
}

main()
  .catch((e) => {
    console.error('❌ Failed to seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
