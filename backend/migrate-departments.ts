import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  
  const departments = ['ENGINEERING', 'SALES', 'MARKETING', 'OPERATIONS'];

  for (const user of users) {
    if (user.role === 'ADMIN') {
      await prisma.user.update({
        where: { id: user.id },
        data: { department: 'N/A' }
      });
    } else {
      // Assign random department if they don't have one or have 'UNASSIGNED'
      if (!user.department || user.department === 'UNASSIGNED' || user.department === '') {
        const randomDept = departments[Math.floor(Math.random() * departments.length)];
        await prisma.user.update({
          where: { id: user.id },
          data: { department: randomDept }
        });
      }
    }
  }

  console.log('Successfully updated departments for existing users!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
