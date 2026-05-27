import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const assets = await prisma.asset.findMany();
  console.log(`Found ${assets.length} assets.`);

  for (const asset of assets) {
    if (!asset.categoryId) {
      // Find or create category based on asset.category
      let category = await prisma.category.findUnique({ where: { name: asset.category } });
      if (!category) {
        category = await prisma.category.create({ data: { name: asset.category } });
        console.log(`Created category: ${asset.category}`);
      }
      
      // Update asset
      await prisma.asset.update({
        where: { id: asset.id },
        data: { categoryId: category.id }
      });
      console.log(`Updated asset ${asset.serialNumber} to category ${category.name}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
