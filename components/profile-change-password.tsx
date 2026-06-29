'use client';

import { useId, useMemo, useState } from 'react';
import { Check, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ProfileField, profileControlClass } from '@/components/profile-field';
import { winMessageBannerClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';

type ProfileChangePasswordProps = {
  hasPassword: boolean;
};

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  disabled,
  invalid,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  disabled?: boolean;
  invalid?: boolean;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <ProfileField label={label} htmlFor={id} hint={hint} hintError={invalid}>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={invalid}
          className={cn(profileControlClass, 'pr-11')}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </ProfileField>
  );
}

export function ProfileChangePassword({ hasPassword }: ProfileChangePasswordProps) {
  const formId = useId();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [revokeOthers, setRevokeOthers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const checks = useMemo(
    () => ({
      minLength: newPassword.length >= 8,
      matches: confirmPassword.length > 0 && newPassword === confirmPassword,
      different: newPassword.length > 0 && newPassword !== currentPassword,
    }),
    [newPassword, confirmPassword, currentPassword]
  );

  const canSubmit =
    currentPassword.length > 0 &&
    checks.minLength &&
    checks.matches &&
    checks.different &&
    !saving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!checks.minLength) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (!checks.matches) {
      setError('New passwords do not match.');
      return;
    }
    if (!checks.different) {
      setError('New password must be different from your current password.');
      return;
    }

    setSaving(true);
    try {
      const { error: authError } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: revokeOthers,
      });
      if (authError) {
        throw new Error(authError.message ?? 'Could not change password');
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setRevokeOthers(false);
      setSuccess('Your password has been updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change password');
    } finally {
      setSaving(false);
    }
  };

  if (!hasPassword) {
    return (
      <div className="flex gap-3 rounded-lg border border-border bg-secondary px-4 py-4">
        <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">
          This account was not created with email and password — nothing to update here.
        </p>
      </div>
    );
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className={winMessageBannerClass}
        >
          {success}
        </p>
      )}

      <PasswordField
        id={`${formId}-current`}
        label="Current password"
        value={currentPassword}
        onChange={setCurrentPassword}
        autoComplete="current-password"
        disabled={saving}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-5">
        <PasswordField
          id={`${formId}-new`}
          label="New password"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
          disabled={saving}
          hint={newPassword.length > 0 && !checks.minLength ? 'At least 8 characters' : undefined}
          invalid={newPassword.length > 0 && !checks.minLength}
        />
        <PasswordField
          id={`${formId}-confirm`}
          label="Confirm new password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          disabled={saving}
          hint={
            confirmPassword.length > 0 && !checks.matches
              ? 'Passwords do not match'
              : undefined
          }
          invalid={confirmPassword.length > 0 && !checks.matches}
        />
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <ul className="flex flex-wrap gap-2">
          {[
            { ok: checks.minLength, label: '8+ characters' },
            { ok: checks.matches, label: 'Passwords match' },
            { ok: checks.different, label: 'Different from current' },
          ].map((item) => (
            <li
              key={item.label}
              className={cn(
                'flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium',
                item.ok ? 'win-status-badge' : 'win-status-muted'
              )}
            >
              <Check
                className={cn('h-3.5 w-3.5', item.ok ? 'opacity-100' : 'opacity-30')}
                aria-hidden
              />
              {item.label}
            </li>
          ))}
        </ul>

        <div className="win-settings-row rounded-lg border border-border bg-secondary">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Sign out other devices</p>
            <p className="text-xs text-muted-foreground">After you save</p>
          </div>
          <Switch
            checked={revokeOthers}
            onCheckedChange={setRevokeOthers}
            disabled={saving}
            aria-label="Sign out other devices"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <Button type="submit" disabled={!canSubmit} className="h-11 px-6">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating…
            </>
          ) : (
            'Update password'
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-11 text-muted-foreground"
          disabled={saving || (!currentPassword && !newPassword && !confirmPassword)}
          onClick={() => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setError(null);
            setSuccess(null);
          }}
        >
          Clear
        </Button>
      </div>
    </form>
  );
}
