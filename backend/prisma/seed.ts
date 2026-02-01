import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Force load .env from current directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL not found. Current Env:", process.env);
  throw new Error('DATABASE_URL is not defined in environment');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('password123', 10);
  
  // Create Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      firstName: 'Super',
      lastName: 'Admin',
      nickname: 'SuperAdmin',
      displayName: 'username',
      password,
      role: Role.ADMINISTRATOR,
    },
  });
  console.log(`Seeded Super Admin: ${superAdmin.email}`);
  
  // Create Editor
  const editor = await prisma.user.upsert({
    where: { email: 'editor@example.com' },
    update: {},
    create: {
      username: 'editor',
      email: 'editor@example.com',
      firstName: 'Editor',
      lastName: 'User',
      nickname: 'EditorPro',
      displayName: 'firstName',
      password,
      role: Role.EDITOR,
    },
  });
  console.log('Seeded Editor:', editor.email);
  
  // Create Author
  const author = await prisma.user.upsert({
    where: { email: 'author@example.com' },
    update: {},
    create: {
      username: 'author',
      email: 'author@example.com',
      firstName: 'Author',
      lastName: 'Writer',
      nickname: 'AuthorPen',
      displayName: 'nickname',
      password,
      role: Role.AUTHOR,
    },
  });
  console.log('Seeded Author:', author.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); 
  });
