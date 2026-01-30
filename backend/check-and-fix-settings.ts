// Check and fix homePageLayout setting
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking homePageLayout setting...\n');
  
  // Get current settings
  const settings = await prisma.siteSettings.findFirst();
  
  if (!settings) {
    console.log('❌ No settings found in database');
    console.log('Creating default settings...');
    const newSettings = await prisma.siteSettings.create({
      data: {
        siteName: 'Wall Painting Services',
        description: 'Professional painting services in UAE',
        homePageLayout: 'single'
      }
    });
    console.log('✅ Created settings with homePageLayout:', newSettings.homePageLayout);
  } else {
    console.log('Current homePageLayout:', settings.homePageLayout);
    console.log('Site Name:', settings.siteName);
    
    if (settings.homePageLayout !== 'single') {
      console.log('\n⚠️  homePageLayout is not "single", updating...');
      const updated = await prisma.siteSettings.update({
        where: { id: settings.id },
        data: { homePageLayout: 'single' }
      });
      console.log('✅ Updated homePageLayout to:', updated.homePageLayout);
    } else {
      console.log('✅ homePageLayout is already set to "single"');
    }
  }
  
  // Show final state
  const final = await prisma.siteSettings.findFirst();
  console.log('\nFinal settings:');
  console.log('- ID:', final?.id);
  console.log('- Site Name:', final?.siteName);
  console.log('- Home Page Layout:', final?.homePageLayout);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
