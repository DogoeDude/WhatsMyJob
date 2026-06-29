'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { LogIn, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type AuthPromptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
};

export function AuthPromptDialog({
  open,
  onOpenChange,
  title = 'Sign in to see more jobs',
  description = 'Create a free account or sign in to browse the full list, save searches, and access more listings.',
}: AuthPromptDialogProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const callbackUrl = `${pathname}${query ? `?${query}` : ''}`;
  const loginHref = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  const registerHref = `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button asChild className="w-full">
            <Link href={loginHref} onClick={() => onOpenChange(false)}>
              <LogIn className="h-4 w-4" />
              Sign in
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href={registerHref} onClick={() => onOpenChange(false)}>
              <UserPlus className="h-4 w-4" />
              Create account
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
