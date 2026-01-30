import PageByIdRenderer from '@/components/PageByIdRenderer';
import { ContactForm } from '@/components/contact/ContactForm';
import { API_URL } from '@/lib/api';

type PageData = {
  id: string;
  slug: string;
  status?: string;
};

async function getContactPage(): Promise<PageData | null> {
  try {
    const slug = encodeURIComponent('contact');
    const res = await fetch(`${API_URL}/pages/slug/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as PageData;
    if (data?.status && data.status !== 'PUBLISHED') return null;
    return data;
  } catch (error) {
    console.error('Failed to load contact page:', error);
    return null;
  }
}

export default async function ContactPage() {
  const contactPage = await getContactPage();

  if (contactPage?.id) {
    return <PageByIdRenderer pageId={contactPage.id} />;
  }

  // Fallback: render the built-in contact form until a contact page exists in the CMS.
  return <ContactForm />;
}
