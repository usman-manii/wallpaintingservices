// Update homePageLayout to single
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.siteSettings.findFirst();
  console.log('Current homePageLayout:', settings?.homePageLayout);
  
  const updated = await prisma.siteSettings.update({
    where: { id: settings.id },
    data: { homePageLayout: 'single' }
  });
  
  console.log('Updated homePageLayout to:', updated.homePageLayout);
  console.log('✅ Database updated successfully');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); process.exit(1); });
