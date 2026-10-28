import { redirect } from 'next/navigation';

// Previewing and identifying now happen in the scanner card on the home page.
// Kept so older links and installed home-screen shortcuts still land somewhere useful.
export default function IdentifyPage() {
  redirect('/');
}
