'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FileUp, Settings, History } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Generator', icon: FileUp },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/history', label: 'History', icon: History },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-2 rounded-lg bg-card p-1 shadow-inner">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link href={item.href} key={item.href}>
              <button
                className={cn(
                  'flex items-center gap-2 rounded-md px-6 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
