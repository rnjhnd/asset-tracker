import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const randomNames = [
  'Alice Smith', 'Bob Johnson', 'Charlie Williams', 'Diana Brown', 'Ethan Jones',
  'Fiona Garcia', 'George Martinez', 'Hannah Rodriguez', 'Ian Martinez', 'Julia Hernandez',
  'Kevin Lopez', 'Laura Gonzalez', 'Michael Wilson', 'Nina Anderson', 'Oliver Thomas'
];

async function main() {
  // 1. Update ADMIN to Administrator
  await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data: { name: 'Administrator' }
  });

  // 2. Update existing EMPLOYEEs that have default name
  const employees = await prisma.user.findMany({
    where: { role: 'EMPLOYEE', name: 'Unknown Employee' }
  });

  for (let i = 0; i < employees.length; i++) {
    const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
    await prisma.user.update({
      where: { id: employees[i].id },
      data: { name: randomName }
    });
  }

  console.log('Successfully updated user names.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
