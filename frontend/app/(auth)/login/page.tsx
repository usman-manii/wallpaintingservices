// frontend/app/(auth)/login/page.tsx
import { redirect } from 'next/navigation';

export default function LoginPage() {
  redirect('/auth?mode=login');
}
