// Check and fix homePageLayout setting
import { PrismaClient } from '@prisma/client';
import { log, logError } from './src/common/utils/cli-logger';

const prisma = new PrismaClient();

async function main() {
  log('Checking homePageLayout setting...');
  
  // Get current settings
  const settings = await prisma.siteSettings.findFirst();
  
  if (!settings) {
    log('No settings found in database');
    log('Creating default settings...');
    const newSettings = await prisma.siteSettings.create({
      data: {
        siteName: 'Wall Painting Services',
        description: 'Professional painting services in UAE',
        homePageLayout: 'single'
      }
    });
    log('Created settings with homePageLayout:', newSettings.homePageLayout);
  } else {
    log('Current homePageLayout:', settings.homePageLayout);
    log('Site Name:', settings.siteName);
    
    if (settings.homePageLayout !== 'single') {
      log('homePageLayout is not "single", updating...');
      const updated = await prisma.siteSettings.update({
        where: { id: settings.id },
        data: { homePageLayout: 'single' }
      });
      log('Updated homePageLayout to:', updated.homePageLayout);
    } else {
      log('homePageLayout is already set to "single"');
    }
  }
  
  // Show final state
  const final = await prisma.siteSettings.findFirst();
  log('Final settings:');
  log('- ID:', final?.id);
  log('- Site Name:', final?.siteName);
  log('- Home Page Layout:', final?.homePageLayout);
}

main()
  .catch((error) => {
    logError('Settings check failed:', error);
  })
  .finally(() => prisma.$disconnect());
