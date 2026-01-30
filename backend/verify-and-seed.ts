import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Checking existing users...');
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} user(s)`);
  
  users.forEach(u => {
    console.log(`- ${u.email}: ${u.role}`);
  });
  
  const password = await bcrypt.hash('password123', 10);
  
  // Upsert Super Admin
  console.log('\nUpserting admin@example.com as ADMINISTRATOR...');
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { role: Role.ADMINISTRATOR },
    create: {
      email: 'admin@example.com',
      username: 'admin',
      firstName: 'Super',
      lastName: 'Admin',
      password,
      role: Role.ADMINISTRATOR,
    },
  });
  
  // Upsert Editor
  console.log('Upserting editor@example.com as EDITOR...');
  await prisma.user.upsert({
    where: { email: 'editor@example.com' },
    update: {},
    create: {
      email: 'editor@example.com',
      username: 'editor',
      firstName: 'Editor',
      lastName: 'User',
      password,
      role: Role.EDITOR,
    },
  });
  
  // Upsert Author
  console.log('Upserting author@example.com as AUTHOR...');
  await prisma.user.upsert({
    where: { email: 'author@example.com' },
    update: {},
    create: {
      email: 'author@example.com',
      username: 'author',
      firstName: 'Author',
      lastName: 'User',
      password,
      role: Role.AUTHOR,
    },
  });
  
  console.log('\nFinal user list:');
  const finalUsers = await prisma.user.findMany();
  finalUsers.forEach(u => {
    console.log(`✓ ${u.email}: ${u.role}`);
  });
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
    await prisma.$disconnect();
  });
