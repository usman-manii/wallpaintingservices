import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { log, logError } from '../src/common/utils/cli-logger';

// Force load .env from current directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  logError("DATABASE_URL not found. Current Env:", process.env);
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
  log(`Seeded Super Admin: ${superAdmin.email}`);
  
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
  log('Seeded Editor:', editor.email);
  
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
  log('Seeded Author:', author.email);

  // Seed demo comments for existing posts (if any)
  const recentPosts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, title: true },
  });

  if (recentPosts.length === 0) {
    log('No posts found. Skipping comment seeding.');
    return;
  }

  const sampleComments = [
    {
      content: 'Great insights. This is a seeded comment for admin testing.',
      authorName: 'Demo Visitor',
      authorEmail: 'demo.visitor@example.com',
      isApproved: true,
    },
    {
      content: 'Can you share more details on prep work?',
      authorName: 'Pending Reviewer',
      authorEmail: 'pending.reviewer@example.com',
      isApproved: false,
    },
    {
      content: 'This should be reviewed by moderation.',
      authorName: 'Flagged User',
      authorEmail: 'flagged.user@example.com',
      isApproved: true,
      isFlagged: true,
      flagReason: 'Off-topic',
    },
  ];

  for (const post of recentPosts) {
    const existingComments = await prisma.comment.count({ where: { postId: post.id } });
    if (existingComments > 0) {
      log(`Skipping comments for post: ${post.title} (already has comments)`);
      continue;
    }

    await prisma.comment.createMany({
      data: sampleComments.map((comment) => ({
        ...comment,
        postId: post.id,
      })),
    });
    log(`Seeded comments for post: ${post.title}`);
  }
}

main()
  .catch((e) => {
    logError(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); 
  });
