import AuthCard from '@/components/auth-card';
import { Logo } from '@/components/logo';

export default function AuthenticationPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center justify-center gap-6">
        <Logo />
        <p className="text-center text-muted-foreground">
          Sign in or create an account to continue
        </p>
        <AuthCard />
      </div>
    </main>
  );
}
