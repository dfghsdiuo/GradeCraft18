'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import DashboardNav from '@/components/dashboard/dashboard-nav';
import { useAuth, useUser } from '@/firebase';
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/');
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-20 items-center gap-4 border-b bg-card px-4 md:px-6">
        <div className="flex-1 flex justify-center text-center">
          <div>
            <Logo />
            <p className="mt-1 text-sm text-muted-foreground">
              Automate student report cards with a single click.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <DashboardNav />
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
