import { PrismaClient, Role, PostStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Force load .env from current directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding blog posts...');

  // Get the author (Admin)
  const author = await prisma.user.findFirst({
    where: { email: 'admin@example.com' },
  });

  if (!author) {
    console.error('Admin user not found, seed/create users first.');
    return;
  }

  // Create Categories
  const categories = await Promise.all([
    prisma.category.upsert({
        where: { slug: 'residential-painting' },
        update: {},
        create: { name: 'Residential Painting', slug: 'residential-painting', description: 'Home painting services in UAE' }
    }),
    prisma.category.upsert({
        where: { slug: 'commercial-painting' },
        update: {},
        create: { name: 'Commercial Painting', slug: 'commercial-painting', description: 'Office and building painting services' }
    }),
    prisma.category.upsert({
        where: { slug: 'interior-design' },
        update: {},
        create: { name: 'Interior Design', slug: 'interior-design', description: 'Tips and trends for interiors' }
    })
  ]);

  // Create Tags
  const tags = await Promise.all([
    prisma.tag.upsert({ where: { slug: 'dubai' }, update: {}, create: { name: 'Dubai', slug: 'dubai' } }),
    prisma.tag.upsert({ where: { slug: 'wall-painting' }, update: {}, create: { name: 'Wall Painting', slug: 'wall-painting' } }),
    prisma.tag.upsert({ where: { slug: 'home-decor' }, update: {}, create: { name: 'Home Decor', slug: 'home-decor' } }),
    prisma.tag.upsert({ where: { slug: 'affordable' }, update: {}, create: { name: 'Affordable', slug: 'affordable' } }),
  ]);

  const posts = [
    {
      title: 'Top 5 Wall Painting Trends in Dubai for 2026',
      slug: 'top-5-wall-painting-trends-dubai-2026',
      excerpt: 'Discover the latest color trends sweeping through villas and apartments in Dubai. From earthy tones to bold feature walls.',
      content: `
        <article>
          <h2>The Evolution of Dubai's Interior Aesthetics</h2>
          <p>Dubai is known for its luxury and innovation, and this extends to the walls of our homes. In 2026, we are seeing a shift towards more sustainable, eco-friendly paints and warm, earthy tones that bring a sense of calm to the bustling city life.</p>
          
          <h3>1. Desert Sand & Terracotta</h3>
          <p>Inspired by the Arabian desert, these warm hues are perfect for living rooms, creating a cozy and inviting atmosphere. They pair beautifully with modern minimalist furniture.</p>
          
          <h3>2. Deep Ocean Blue</h3>
          <p>For feature walls, deep blues are making a comeback. They add depth and sophistication to bedrooms and home offices, mimicking the calm of the Arabian Gulf.</p>
          
          <h3>3. Textured Finishes</h3>
          <p>It's not just about color; it's about texture. Limewash and Venetian plaster effects are highly sought after for that bespoke, artisanal look.</p>
          
          <p>At <strong>WallPaintingServices.ae</strong>, we specialize in applying these trend-setting styles with precision and care. Contact us today for a consultation.</p>
        </article>
      `,
      seoTitle: 'Top 5 Wall Painting Trends in Dubai (2026 Guide)',
      seoDescription: 'Explore the hottest wall painting trends in Dubai for 2026. Expert insights on colors, textures, and finishes for your home.',
      seoKeywords: ['Dubai painting trends', 'wall painting Dubai', 'interior design 2026', 'house painting services'],
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      featuredImage: 'https://images.unsplash.com/photo-1562663474-6cbb3eaa4d14?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'How to Choose the Right Paint for UAE Climate',
      slug: 'choose-right-paint-uae-climate',
      excerpt: 'The harsh summer heat and humidity in UAE require special high-quality paints. Learn what works best.',
      content: `
        <article>
          <h2>Battling the Elements: Paint vs. UAE Weather</h2>
          <p>The UAE's climate presents unique challenges for exterior and interior paint. High humidity, intense UV radiation, and dust storms can degrade standard paints quickly.</p>
          
          <h3>UV Resistance is Key</h3>
          <p>Look for paints with high UV resistance ratings. These prevent fading and cracking under the intense Dubai sun.</p>
          
          <h3>Washability & Durability</h3>
          <p>Dust is a constant reality. High-quality acrylic emulsions that are easy to wipe down without losing their sheen are essential for UAE homes.</p>
          
          <p>Our team ensures all materials used are climate-resilient and long-lasting.</p>
        </article>
      `,
      seoTitle: 'Best Paint for UAE Climate - Heat & Dust Resistant',
      seoDescription: 'Guide to choosing durable paints for Dubai and Abu Dhabi weather. Protect your walls from heat, humidity, and dust.',
      seoKeywords: ['exterior painting Dubai', 'heat resistant paint', 'best paint brand UAE', 'villa painting'],
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 86400000), // Yesterday
      featuredImage: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'Professional Villa Painting Services in Abu Dhabi',
      slug: 'professional-villa-painting-abu-dhabi',
      excerpt: 'Complete guide to our premium villa painting services across Abu Dhabi and Al Ain regions.',
      content: `
        <article>
          <h2>Transform Your Villa with Expert Painters</h2>
          <p>Your villa is your sanctuary. Whether you are in Khalifa City, Yas Island, or Al Reem, our professional team provides top-tier painting services tailored to large residences.</p>
          
          <ul>
            <li>Exterior facade restoration</li>
            <li>Interior decorative painting</li>
            <li>Majlis and high-ceiling specialized equipment</li>
          </ul>
          
          <p>We use scaffolding and safety gear to reach every corner, ensuring a flawless finish for your magnificent home.</p>
        </article>
      `,
      seoTitle: 'Villa Painting Services Abu Dhabi | Professional Painters',
      seoDescription: 'Premium villa painting in Abu Dhabi. Exterior and interior services for luxury homes. Get a free quote today.',
      seoKeywords: ['villa painting Abu Dhabi', 'painters Abu Dhabi', 'luxury home painting', 'exterior wall painting'],
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 172800000),
      featuredImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop',
    },
    {
      title: 'Budget-Friendly Studio Apartment Makeovers',
      slug: 'budget-studio-apartment-painting-makeover',
      excerpt: 'Living in a studio? Here is how to use color to make your space feel bigger and brighter without breaking the bank.',
      content: `
        <article>
          <h2>Maximize Space with Color</h2>
          <p>Light colors, mirrors, and strategic accent walls can double the visual size of a studio apartment.</p>
          <h3>The Monochromatic Look</h3>
          <p>Using different shades of the same color creates a seamless flow, eliminating visual breaks that make a room feel smaller.</p>
        </article>
      `,
      seoTitle: 'Studio Apartment Painting Ideas - Make Small Spaces Big',
      seoDescription: 'Affordable painting tips for studio apartments in Dubai. Maximize space with color strategies.',
      seoKeywords: ['apartment painting Dubai', 'small room painting ideas', 'budget painters', 'studio makeover'],
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 250000000),
      featuredImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1000&auto=format&fit=crop',
    }
  ];

  for (const p of posts) {
    const exists = await prisma.post.findUnique({ where: { slug: p.slug }});
    if (!exists) {
        await prisma.post.create({
            data: {
                ...p,
                authorId: author.id,
                categories: { connect: categories.map(c => ({ id: c.id })) }, // Connect all for demo
                tags: { connect: tags.map(t => ({ id: t.id })) }
            }
        });
        console.log(`Created post: ${p.title}`);
    } else {
        console.log(`Skipping existing post: ${p.title}`);
    }
  }
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
