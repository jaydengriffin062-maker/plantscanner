'use client';

import { ArrowLeft, History, Leaf, ScanLine } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Scan', icon: ScanLine },
  { href: '/history', label: 'History', icon: History },
];

/** Sticky top bar: optional back button, brand, and the two main destinations. */
export default function AppHeader({ backHref }) {
  const pathname = usePathname();

  return (
    <header className="app-header">
      <div className="container app-header__inner">
        {backHref && (
          <Link href={backHref} className="icon-button" aria-label="Back">
            <ArrowLeft size={20} />
          </Link>
        )}
        <Link href="/" className={`brand ${backHref ? 'brand--compact' : ''}`}>
          <span className="brand__mark">
            <Leaf size={18} aria-hidden />
          </span>
          <span className="brand__name">Plant Scanner</span>
        </Link>
        <nav className="app-nav" aria-label="Main">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`app-nav__link ${pathname === href ? 'is-active' : ''}`}
              aria-current={pathname === href ? 'page' : undefined}
            >
              <Icon size={18} aria-hidden />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
