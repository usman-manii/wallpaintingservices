import { PrismaClient, Prisma, Role, PostStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment from backend .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL not found. Current Env:', process.env);
  throw new Error('DATABASE_URL is not defined in environment');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clearContent() {
  console.log('🧹 Clearing existing blog-related data...');

  await prisma.$transaction([
    prisma.internalLink.deleteMany({}),
    prisma.comment.deleteMany({}),
    prisma.post.deleteMany({}),
    prisma.tag.deleteMany({}),
    prisma.category.deleteMany({}),
  ]);

  console.log('✅ Cleared posts, comments, tags, categories, and internal links');
}

async function seedUsers() {
  console.log('👥 Seeding users...');
  const password = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { role: Role.ADMINISTRATOR },
    create: {
      username: 'admin',
      email: 'admin@example.com',
      firstName: 'Super',
      lastName: 'Admin',
      displayName: 'Super Admin',
      password,
      role: Role.ADMINISTRATOR,
    },
  });

  const editor = await prisma.user.upsert({
    where: { email: 'editor@example.com' },
    update: { role: Role.EDITOR },
    create: {
      username: 'editor',
      email: 'editor@example.com',
      firstName: 'Content',
      lastName: 'Editor',
      displayName: 'Content Editor',
      password,
      role: Role.EDITOR,
    },
  });

  const author = await prisma.user.upsert({
    where: { email: 'author@example.com' },
    update: { role: Role.AUTHOR },
    create: {
      username: 'author',
      email: 'author@example.com',
      firstName: 'Guest',
      lastName: 'Author',
      displayName: 'Guest Author',
      password,
      role: Role.AUTHOR,
    },
  });

  console.log('✅ Users ready:', [admin.email, editor.email, author.email]);
  return { admin, editor, author };
}

async function seedTaxonomy() {
  console.log('🏷  Seeding categories and tags...');

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'residential-painting' },
      update: {},
      create: {
        name: 'Residential Painting',
        slug: 'residential-painting',
        description: 'Painting for villas and apartments.',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'commercial-painting' },
      update: {},
      create: {
        name: 'Commercial Painting',
        slug: 'commercial-painting',
        description: 'Painting for offices and commercial spaces.',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'interior-design' },
      update: {},
      create: {
        name: 'Interior Design Tips',
        slug: 'interior-design',
        description: 'Design and decoration tips.',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'maintenance' },
      update: {},
      create: {
        name: 'Maintenance & Care',
        slug: 'maintenance',
        description: 'Wall maintenance and aftercare.',
      },
    }),
  ]);

  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { slug: 'dubai' },
      update: {},
      create: { name: 'Dubai', slug: 'dubai' },
    }),
    prisma.tag.upsert({
      where: { slug: 'abu-dhabi' },
      update: {},
      create: { name: 'Abu Dhabi', slug: 'abu-dhabi' },
    }),
    prisma.tag.upsert({
      where: { slug: 'villa-painting' },
      update: {},
      create: { name: 'Villa Painting', slug: 'villa-painting' },
    }),
    prisma.tag.upsert({
      where: { slug: 'apartment' },
      update: {},
      create: { name: 'Apartment', slug: 'apartment' },
    }),
    prisma.tag.upsert({
      where: { slug: 'wall-painting' },
      update: {},
      create: { name: 'Wall Painting', slug: 'wall-painting' },
    }),
    prisma.tag.upsert({
      where: { slug: 'color-trends' },
      update: {},
      create: { name: 'Color Trends', slug: 'color-trends' },
    }),
    prisma.tag.upsert({
      where: { slug: 'maintenance' },
      update: {},
      create: { name: 'Maintenance', slug: 'maintenance' },
    }),
    prisma.tag.upsert({
      where: { slug: 'eco-friendly' },
      update: {},
      create: { name: 'Eco Friendly', slug: 'eco-friendly' },
    }),
  ]);

  console.log('✅ Categories:', categories.length, 'Tags:', tags.length);
  return { categories, tags };
}

function buildSeo(title: string, excerpt: string, keywords: string[]): Pick<
  Prisma.PostCreateInput,
  'seoTitle' | 'seoDescription' | 'seoKeywords' | 'ogTitle' | 'ogDescription'
> {
  const seoTitle = `${title.substring(0, 60)}`;
  const seoDescription = `${excerpt.substring(0, 155)}`;
  return {
    seoTitle,
    seoDescription,
    seoKeywords: keywords,
    ogTitle: seoTitle,
    ogDescription: `${seoDescription}...`,
  };
}

async function seedPosts(
  authorId: string,
  categories: Prisma.CategoryUncheckedCreateInput[],
  tags: Prisma.TagUncheckedCreateInput[],
) {
  console.log('📝 Seeding demo posts with SEO, tags, and comments...');

  const baseFeatured =
    'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?q=80&w=1200&auto=format&fit=crop';

  const demoPosts: Array<{
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    status: PostStatus;
    offsetDays: number;
    scheduledOffsetDays?: number;
    tagSlugs: string[];
    categorySlugs: string[];
  }> = [];

  // Generate 20 varied posts
  for (let i = 1; i <= 20; i++) {
    const isPublished = i <= 10;
    const isDraft = i > 10 && i <= 15;
    const isScheduled = i > 15;

    const title = `Demo Wall Painting Post ${i}`;
    const slug = `demo-wall-painting-post-${i}`;
    const excerpt = `Demo post ${i} exploring professional wall painting services, color psychology, and maintenance tips for UAE properties.`;
    const content = `
      <article>
        <h2>Demo Wall Painting Case Study #${i}</h2>
        <p>This is a richly formatted demo article used to populate the CMS. It covers wall preparation, primer selection, and color combinations that work well in UAE light conditions.</p>
        <h3>Before & After Transformation</h3>
        <p>We transformed a dull living room into a bright, inviting space using high-quality, low-VOC paints.</p>
        <p><strong>Tip:</strong> Always test a sample patch on your walls before committing to a full room paint.</p>
      </article>
    `;

    const status = isPublished
      ? PostStatus.PUBLISHED
      : isScheduled
      ? PostStatus.SCHEDULED
      : PostStatus.DRAFT;

    const offsetDays = -i; // spread in the past
    const scheduledOffsetDays = isScheduled ? i : undefined;

    const tagSlugs =
      i % 3 === 0
        ? ['dubai', 'wall-painting', 'color-trends']
        : i % 3 === 1
        ? ['abu-dhabi', 'villa-painting', 'eco-friendly']
        : ['apartment', 'maintenance'];

    const categorySlugs =
      i % 4 === 0
        ? ['residential-painting', 'interior-design']
        : i % 4 === 1
        ? ['commercial-painting']
        : i % 4 === 2
        ? ['maintenance']
        : ['residential-painting'];

    demoPosts.push({
      title,
      slug,
      excerpt,
      content,
      status,
      offsetDays,
      scheduledOffsetDays,
      tagSlugs,
      categorySlugs,
    });
  }

  for (const p of demoPosts) {
    const existing = await prisma.post.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`↷ Skipping existing post: ${p.slug}`);
      continue;
    }

    const createdAt = new Date(Date.now() + p.offsetDays * 24 * 60 * 60 * 1000);
    const publishedAt =
      p.status === PostStatus.PUBLISHED ? createdAt : null;
    const scheduledFor =
      p.status === PostStatus.SCHEDULED && p.scheduledOffsetDays
        ? new Date(Date.now() + p.scheduledOffsetDays * 24 * 60 * 60 * 1000)
        : null;

    const allTags = await prisma.tag.findMany({
      where: { slug: { in: p.tagSlugs } },
    });
    const allCategories = await prisma.category.findMany({
      where: { slug: { in: p.categorySlugs } },
    });

    const wordCount = p.content.replace(/<[^>]*>/g, ' ').split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    const seo = buildSeo(p.title, p.excerpt, p.tagSlugs);

    const post = await prisma.post.create({
      data: {
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        content: p.content,
        featuredImage: baseFeatured,
        status: p.status,
        publishedAt,
        scheduledFor,
        wordCount,
        readingTime,
        ...seo,
        author: { connect: { id: authorId } },
        categories: {
          connect: allCategories.map((c) => ({ id: c.id })),
        },
        tags: {
          connect: allTags.map((t) => ({ id: t.id })),
        },
      },
    });

    // Create a couple of approved comments for each published post
    if (post.status === PostStatus.PUBLISHED) {
      await prisma.comment.createMany({
        data: [
          {
            postId: post.id,
            content:
              'Great insights! This demo comment shows how approved comments look under a post.',
            isApproved: true,
            authorName: 'Demo Visitor',
          },
          {
            postId: post.id,
            content:
              'Very helpful tips on wall preparation and color choices.',
            isApproved: true,
            authorName: 'Second Visitor',
          },
        ],
      });
    }

    console.log(`✓ Created demo post: ${p.title}`);
  }
}

async function main() {
  try {
    await clearContent();
    const { admin } = await seedUsers();
    const { categories, tags } = await seedTaxonomy();
    await seedPosts(admin.id, categories as any, tags as any);
    console.log('🎉 Demo content seeding complete.');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();

