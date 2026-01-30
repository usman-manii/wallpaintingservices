
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    console.log('Connecting to database...');
    const userCount = await prisma.user.count();
    console.log(`Number of users in database: ${userCount}`);
    
    if (userCount > 0) {
        const users = await prisma.user.findMany({ take: 5 });
        console.log('Sample users:', users.map(u => ({ id: u.id, email: u.email, role: u.role })));
    }
  } catch (e) {
    console.error('Error checking database:', e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
