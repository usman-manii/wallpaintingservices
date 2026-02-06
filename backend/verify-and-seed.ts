import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { log, logError } from './src/common/utils/cli-logger';

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  log('Checking existing users...');
  const users = await prisma.user.findMany();
  log(`Found ${users.length} user(s)`);
  
  users.forEach(u => {
    log(`- ${u.email}: ${u.role}`);
  });
  
  const password = await bcrypt.hash('password123', 10);
  
  // Upsert Super Admin
  log('Upserting admin@example.com as ADMINISTRATOR...');
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
  log('Upserting editor@example.com as EDITOR...');
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
  log('Upserting author@example.com as AUTHOR...');
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
  
  log('Final user list:');
  const finalUsers = await prisma.user.findMany();
  finalUsers.forEach(u => {
    log(`[SEED] ${u.email}: ${u.role}`);
  });
}

main()
  .catch((e) => {
    logError('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
    await prisma.$disconnect();
  });
