'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  initiateEmailSignUp,
  initiateEmailSignIn,
} from '@/firebase/non-blocking-login';
import { useAuth } from '@/firebase/provider';
import { Loader2 } from 'lucide-react';

export default function AuthCard() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuthAction = async (
    action: 'sign-in' | 'sign-up'
  ) => {
    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please enter both email and password.',
      });
      return;
    }

    setLoading(true);

    try {
      if (action === 'sign-up') {
        initiateEmailSignUp(auth, email, password);
      } else {
        initiateEmailSignIn(auth, email, password);
      }
      // Non-blocking, so we navigate immediately. The useUser hook will handle the redirect.
      toast({
        title: 'Processing...',
        description: 'Please wait while we set up your account.',
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error(`${action} error:`, error);
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description:
          error.message || 'An unexpected error occurred. Please try again.',
      });
      setLoading(false);
    }
  };

  return (
    <Tabs defaultValue="sign-in" className="w-full max-w-md">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="sign-in">Sign In</TabsTrigger>
        <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
      </TabsList>
      <TabsContent value="sign-in">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Enter your credentials to access your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-signin">Email</Label>
              <Input
                id="email-signin"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-signin">Password</Label>
              <Input
                id="password-signin"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => handleAuthAction('sign-in')}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="sign-up">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Create an Account</CardTitle>
            <CardDescription>
              Enter your email below to create your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-signup">Email</Label>
              <Input
                id="email-signup"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-signup">Password</Label>
              <Input
                id="password-signup"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => handleAuthAction('sign-up')}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign Up
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
