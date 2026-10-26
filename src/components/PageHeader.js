import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PageHeader({ title, backHref = '/', action }) {
  return (
    <header className="page-header">
      <Link href={backHref} className="icon-button" aria-label="Back">
        <ArrowLeft size={22} />
      </Link>
      <h1 className="page-header__title">{title}</h1>
      <div className="page-header__action">{action}</div>
    </header>
  );
}
