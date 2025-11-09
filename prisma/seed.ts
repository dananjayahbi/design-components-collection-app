import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Hash the superadmin password
  const hashedPassword = await bcrypt.hash('superadmin123', 10);

  // Create superadmin user
  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@dashboard.com' },
    update: {},
    create: {
      email: 'superadmin@dashboard.com',
      password: hashedPassword,
      name: 'Super Administrator',
      role: 'SUPERADMIN',
      isActive: true,
    },
  });

  console.log('Superadmin created successfully');
  console.log('Email: superadmin@dashboard.com');
  console.log('Password: superadmin123');
  console.log('Role: SUPERADMIN');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
