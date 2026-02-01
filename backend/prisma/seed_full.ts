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

  const tagNames = [
    'Dubai','Abu Dhabi','Sharjah','Color Trends','Wall Painting','Texture Painting','Eco Friendly','Waterproofing','Exterior Coatings','Interior Primers',
    'Luxury Finish','Budget Makeover','Office Painting','Villa Painting','Apartment','Retail Fitout','Industrial Coatings','Epoxy Flooring','School Painting','Hospital Safe Paint',
    'Fire Retardant','UV Resistant','Low VOC','Green Building','Maintenance','Repainting','Color Psychology','Accent Walls','Kids Room','Ceiling Design',
    'Faux Finish','Spray Painting','Roller Techniques','Surface Prep','Crack Repair','Damp Proofing','Stucco','Plaster Repair','Metal Painting','Wood Staining',
    'Fence Painting','Deck Stain','Facade Restoration','Signage Painting','Parking Lot Marking','Line Striping','Water Tank','Roof Coating','Heat Reflective','Sound Dampening','Anti-mold'
  ];

  const palette = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#0ea5e9','#14b8a6','#e11d48','#64748b','#22c55e'];

  const tags = [];
  for (let i = 0; i < tagNames.length; i++) {
    const name = tagNames[i];
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const featured = i % 7 === 0;
    const trending = i % 5 === 0;
    const locked = i < 2; // protect key geo tags
    const color = palette[i % palette.length];
    const synonyms = [
      name.toLowerCase(),
      `${name.toLowerCase()} services`,
      `${name.toLowerCase()} uae`,
    ];

    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {
        color,
        featured,
        trending,
        locked,
        synonyms,
      },
      create: {
        name,
        slug,
        color,
        featured,
        trending,
        locked,
        synonyms,
      },
    });
    tags.push(tag);
  }

  // Add linkedTagIds (companion tags) to improve auto-attach
  for (let i = 0; i < tags.length; i++) {
    const linked = [];
    if (tags[i + 1]) linked.push(tags[i + 1].id);
    if (tags[i + 2]) linked.push(tags[i + 2].id);
    await prisma.tag.update({
      where: { id: tags[i].id },
      data: { linkedTagIds: linked },
    });
  }

  console.log('✅ Categories:', categories.length, 'Tags:', tags.length);
  return { categories, tags };
}

async function seedMedia(adminId: string) {
  console.log('🖼  Seeding media library...');
  const imageUrls = [
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1600',
    'https://images.unsplash.com/photo-1523419400524-218a0ce511eb?w=1600',
    'https://images.unsplash.com/photo-1505693415763-3b5854c4f9a8?w=1600',
    'https://images.unsplash.com/photo-1523419400524-218a0ce511ec?w=1600',
  ];

  const media = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    const existing = await prisma.media.findFirst({ where: { url } });
    let record = existing;
    if (!record) {
      record = await prisma.media.create({
        data: {
          filename: `seed-image-${i + 1}.jpg`,
          originalName: `seed-image-${i + 1}.jpg`,
          mimeType: 'image/jpeg',
          size: 500_000,
          url,
          path: url,
          width: 1600,
          height: 900,
          altText: 'Demo project photo',
          title: `Demo Image ${i + 1}`,
          description: 'Seeded image for demo posts',
          tags: ['demo', 'seed', 'wallpainting'],
          uploadedById: adminId,
        },
      });
    }
    media.push(record);
  }
  console.log('✅ Media items:', media.length);
  return media;
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
  media: any[],
) {
  console.log('📝 Seeding demo posts with SEO, tags, media, and comments...');

  const baseFeatured =
    media.length > 0
      ? media[0].url
      : 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?q=80&w=1200&auto=format&fit=crop';

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
    mediaUrl: string;
  }> = [];

  // Generate 50 varied posts
  for (let i = 1; i <= 50; i++) {
    const isPublished = i <= 15;
    const isDraft = i > 15 && i <= 25;
    const isScheduled = i > 25 && i <= 35;
    const isApprovedDraft = i > 35 && i <= 45;
    const isAIReview = i > 45;

    const title = `Demo Wall Painting Post ${i}`;
    const slug = `demo-wall-painting-post-${i}`;
    const excerpt = `Demo post ${i} exploring professional wall painting services, color psychology, and maintenance tips for UAE properties.`;
    const mediaItem = media[i % media.length] || { url: baseFeatured };
    const videoEmbed =
      i % 2 === 0
        ? `<div class="video"><iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="YouTube video" frameborder="0" allowfullscreen></iframe></div>`
        : `<div class="video"><iframe width="560" height="315" src="https://www.youtube.com/embed/oHg5SJYRHA0" title="YouTube video" frameborder="0" allowfullscreen></iframe></div>`;

    const content = `
      <article>
        <h2>Demo Wall Painting Case Study #${i}</h2>
        <p>This is a richly formatted demo article used to populate the CMS. It covers wall preparation, primer selection, and color combinations that work well in UAE light conditions.</p>
        <h3>Before & After Transformation</h3>
        <p>We transformed a dull living room into a bright, inviting space using high-quality, low-VOC paints.</p>
        <img src="${mediaItem.url}" alt="Project photo ${i}" style="width:100%;border-radius:12px;margin:16px 0;" />
        ${videoEmbed}
        <p><strong>Tip:</strong> Always test a sample patch on your walls before committing to a full room paint.</p>
      </article>
    `;

    const status = isPublished
      ? PostStatus.PUBLISHED
      : isScheduled
      ? PostStatus.SCHEDULED
      : isApprovedDraft
      ? PostStatus.APPROVED_DRAFT
      : isAIReview
      ? PostStatus.AI_REVIEW
      : PostStatus.DRAFT;

    const offsetDays = -i; // spread in the past
    const scheduledOffsetDays = isScheduled ? i : undefined;

    // pick 3 random tag slugs
    const pickTag = () => tags[Math.floor(Math.random() * tags.length)].slug;
    const tagSlugs = Array.from(new Set([pickTag(), pickTag(), pickTag()]));

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
      mediaUrl: mediaItem.url,
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
        featuredImage: p.mediaUrl,
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

    // Create a couple of approved comments for every post (helps admin testing)
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

    console.log(`✓ Created demo post: ${p.title}`);
  }

  // Update usage counts and trending flags based on seeded posts
  const tagUsage = await prisma.tag.findMany({
    include: { posts: { select: { id: true } } },
  });

  const usageSorted = tagUsage
    .map((t) => ({ id: t.id, count: t.posts.length }))
    .sort((a, b) => b.count - a.count);

  for (const t of tagUsage) {
    await prisma.tag.update({
      where: { id: t.id },
      data: {
        usageCount: t.posts.length,
        trending: usageSorted.slice(0, 10).some((x) => x.id === t.id) || t.trending,
      },
    });
  }
}

async function main() {
  try {
    await clearContent();
    const { admin } = await seedUsers();
    const { categories, tags } = await seedTaxonomy();
    const media = await seedMedia(admin.id);
    await seedPosts(admin.id, categories as any, tags as any, media);
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

