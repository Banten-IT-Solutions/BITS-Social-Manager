import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { User, Lock, Mail, Save, HardDrive, Unplug, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import type { DriveConnectionInfo } from '../lib/types';
import {
  Button,
  Input,
  FormField,
  Alert,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Separator,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine(d => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  // Google Drive connection (one per app user)
  const [drive, setDrive] = useState<DriveConnectionInfo | null>(null);
  const [driveLoading, setDriveLoading] = useState(true);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [driveNotice, setDriveNotice] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('drive');
    if (result === 'connected') {
      setDriveNotice('Google Drive connected successfully.');
    } else if (result === 'error') {
      const reason = params.get('reason');
      setDriveError(
        reason
          ? `Could not connect Google Drive: ${decodeURIComponent(reason).replace(/_/g, ' ')}`
          : 'Could not connect Google Drive.'
      );
    }
    if (result) window.history.replaceState({}, '', window.location.pathname);

    api.drive
      .status()
      .then(res => setDrive(res.connection))
      .catch(e => setDriveError(e instanceof Error ? e.message : 'Failed to load Drive status'))
      .finally(() => setDriveLoading(false));
  }, []);

  const connectDrive = async () => {
    setDriveError(null);
    setDriveNotice(null);
    setConnecting(true);
    try {
      const { url } = await api.drive.connect();
      window.location.assign(url);
    } catch (e) {
      setDriveError(e instanceof Error ? e.message : 'Failed to start Google Drive connection');
      setConnecting(false);
    }
  };

  const disconnectDrive = async () => {
    setDisconnecting(true);
    setDriveError(null);
    try {
      await api.drive.disconnect();
      setDrive(null);
      setConfirmDisconnect(false);
      setDriveNotice('Google Drive disconnected. Your files and folders remain in Drive.');
    } catch (e) {
      setDriveError(e instanceof Error ? e.message : 'Failed to disconnect Google Drive');
    } finally {
      setDisconnecting(false);
    }
  };

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '' },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (user) profileForm.reset({ name: user.name, email: user.email });
  }, [user]); // eslint-disable-line

  const onProfileSubmit = async (data: ProfileForm) => {
    setProfileError(null);
    setProfileSuccess(false);
    try {
      const res = await api.profile.update(data);
      updateUser(res.user);
      setProfileSuccess(true);
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : 'Failed to update profile');
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    setPwError(null);
    setPwSuccess(false);
    try {
      await api.profile.update({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      passwordForm.reset();
      setPwSuccess(true);
    } catch (e) {
      setPwError(e instanceof Error ? e.message : 'Failed to update password');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <header className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
        {/* Subtle violet glow for depth (matches Dashboard / Project headers) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-transparent"
        />

        <div className="relative flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-violet-500/20 bg-gradient-to-br from-violet-500/20 to-violet-600/10"
          >
            <User className="h-5 w-5 text-violet-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Profile</h1>
            <p className="mt-1 text-sm text-zinc-400">Manage your account settings</p>
          </div>
        </div>
      </header>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-2xl font-bold text-zinc-300">
          {user?.name?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <div>
          <p className="font-medium text-zinc-100">{user?.name}</p>
          <p className="text-sm text-zinc-500">{user?.email}</p>
        </div>
      </div>

      <Separator />

      {/* 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-zinc-400" />
              <CardTitle>Personal info</CardTitle>
            </div>
            <CardDescription>Update your name and email address</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              {profileError && <Alert variant="destructive">{profileError}</Alert>}
              {profileSuccess && <Alert>Profile updated successfully.</Alert>}
              <FormField label="Name" error={profileForm.formState.errors.name?.message} required>
                <Input {...profileForm.register('name')} className="min-h-[44px]" />
              </FormField>
              <FormField label="Email" error={profileForm.formState.errors.email?.message} required>
                <Input type="email" {...profileForm.register('email')} className="min-h-[44px]" />
              </FormField>
              <Button type="submit" variant="primary" loading={profileForm.formState.isSubmitting}>
                <Save className="h-4 w-4 mr-1.5" />
                Save changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-zinc-400" />
              <CardTitle>Change password</CardTitle>
            </div>
            <CardDescription>Use a strong password with at least 8 characters</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              {pwError && <Alert variant="destructive">{pwError}</Alert>}
              {pwSuccess && <Alert>Password changed successfully.</Alert>}
              <FormField
                label="Current password"
                error={passwordForm.formState.errors.currentPassword?.message}
                required
              >
                <Input
                  type="password"
                  autoComplete="current-password"
                  {...passwordForm.register('currentPassword')}
                  className="min-h-[44px]"
                />
              </FormField>
              <FormField
                label="New password"
                error={passwordForm.formState.errors.newPassword?.message}
                required
              >
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register('newPassword')}
                  className="min-h-[44px]"
                />
              </FormField>
              <FormField
                label="Confirm new password"
                error={passwordForm.formState.errors.confirmPassword?.message}
                required
              >
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...passwordForm.register('confirmPassword')}
                  className="min-h-[44px]"
                />
              </FormField>
              <Button type="submit" variant="primary" loading={passwordForm.formState.isSubmitting}>
                <Lock className="h-4 w-4 mr-1.5" />
                Update password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Google Drive connection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-zinc-400" />
            <CardTitle>Google Drive</CardTitle>
          </div>
          <CardDescription>
            Content plan videos are uploaded to your own Drive — one connection for all social
            accounts, with a separate folder per account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {driveNotice && <Alert>{driveNotice}</Alert>}
          {driveError && <Alert variant="destructive">{driveError}</Alert>}

          {driveLoading ? (
            <div className="h-16 animate-pulse rounded-lg border border-zinc-800 bg-zinc-900/40 motion-reduce:animate-none" />
          ) : drive ? (
            <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10"
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-100">{drive.googleEmail}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Connected{' '}
                    {new Date(drive.connectedAt).toLocaleDateString(undefined, {
                      dateStyle: 'medium',
                    })}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setConfirmDisconnect(true)}
                className="shrink-0"
              >
                <Unplug className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-200">No Google Drive connected</p>
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                  Connect once, then upload videos right from the Content page. Only files created
                  by this app are accessible (scope{' '}
                  <code className="text-zinc-400">drive.file</code>
                  ).
                </p>
              </div>
              <Button
                variant="primary"
                onClick={connectDrive}
                loading={connecting}
                className="shrink-0"
              >
                <HardDrive className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Connect Google Drive
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmDisconnect} onOpenChange={setConfirmDisconnect}>
        <DialogContent>
          <DialogHeader icon={<Unplug className="h-4 w-4" />} tone="danger">
            <DialogTitle>Disconnect Google Drive</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            New video uploads and previews will stop working until you reconnect. Your existing
            files and folders are <strong className="text-zinc-200">not deleted</strong> — they stay
            in your Google Drive.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDisconnect(false)}>
              Cancel
            </Button>
            <Button variant="destructive" loading={disconnecting} onClick={disconnectDrive}>
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
