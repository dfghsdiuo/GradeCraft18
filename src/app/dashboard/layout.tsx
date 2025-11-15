import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { Logo } from '@/components/logo';
import DashboardNav from '@/components/dashboard/dashboard-nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-20 items-center gap-4 border-b bg-card px-4 md:px-6">
        <div className="flex-1">
          <Logo />
          <p className="text-sm text-muted-foreground mt-1">
            Automate student report cards with a single click.
          </p>
        </div>
        <Link href="/">
          <Button variant="outline">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </Link>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <DashboardNav />
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
