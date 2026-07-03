import { redirect } from 'next/navigation';

// Redirect /dashboard -> handled by (admin) route group
export default function AdminRoot() {
  redirect('/dashboard');
}
