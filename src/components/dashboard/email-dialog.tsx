'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';

interface EmailDialogProps {
  trigger: React.ReactNode;
  fileName: string;
  fileCount: number;
}

export function EmailDialog({ trigger, fileName, fileCount }: EmailDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const handleSend = () => {
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter a recipient email address.',
        variant: 'destructive',
      });
      return;
    }

    const subject = `Report Cards Ready: ${fileName}`;
    const body = `Hello,\n\nThe batch of ${fileCount} report cards for "${fileName}" has been generated and is available for download in the application.\n\nThank you.`;

    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoLink;

    toast({
      title: 'Email Client Opening',
      description: 'Your default email client is opening with a pre-filled draft.',
    });
    setIsOpen(false);
    setEmail('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={(e) => {
        e.stopPropagation();
        setIsOpen(true);
      }}>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Email Notification</DialogTitle>
          <DialogDescription>
            Enter the recipient's email address. This will open your default
            email client with a pre-filled message.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
              placeholder="recipient@example.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSend}>
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
