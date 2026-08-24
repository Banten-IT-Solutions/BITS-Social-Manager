import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, ArrowLeft, Pencil, Trash2, Eye, EyeOff, Copy, Check, Users, Search, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../lib/api';
import type { Project, SocialAccount } from '../lib/types';
import { PLATFORMS, type Platform } from '../lib/types';
import { PlatformIcon, PLATFORM_COLORS, PLATFORM_BG } from '../components/PlatformIcon';
import {
  Button, Input, Textarea, CustomSelect, FormField, Alert,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Badge, Separator,
} from '../components/ui';
import { cn } from '../lib/utils';

const ITEMS_PER_PAGE = 10;

/**
 * Build a public profile URL from a platform + account name/handle.
 * Returns null for platforms without a resolvable public URL.
 */
function buildProfileUrl(platform: Platform, accountName: string): string | null {
  const handle = accountName.replace(/^@+/, '').trim();
  if (!handle) return null;
  const encoded = encodeURIComponent(handle);
  switch (platform) {
    case 'Instagram':
      return `https://www.instagram.com/${encoded}`;
    case 'Gmail':
      return `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encoded}`;
    case 'YouTube':
      return `https://www.youtube.com/@${encoded}`;
    case 'Facebook':
      return `https://www.facebook.com/${encoded}`;
    case 'Threads':
      return `https://www.threads.net/@${encoded}`;
    case 'WhatsApp':
      return `https://wa.me/${encoded.replace(/[^0-9]/g, '')}`;
    case 'Telegram':
      return `https://t.me/${encoded}`;
    case 'TikTok':
      return `https://www.tiktok.com/@${encoded}`;
    case 'Shopee':
      return `https://collshp.com/${encoded}`;
    case 'X':
      return `https://x.com/${encoded}`;
    case 'LinkedIn':
      return `https://www.linkedin.com/in/${encoded}`;
    case 'GitHub':
      return `https://github.com/${encoded}`;
    default:
      return null;
  }
}

const accountSchema = z.object({
  platform: z.enum(PLATFORMS),
  accountName: z.string().min(1, 'Account name required').max(200),
  emailHandle: z.string().min(1, 'Email/handle required').max(500),
  password: z.string().min(1, 'Password required').max(1000),
  notes: z.string().max(2000).optional(),
});
const editAccountSchema = accountSchema.extend({ password: z.string().max(1000).optional() });
type AccountForm = z.infer<typeof accountSchema>;
type EditAccountForm = z.infer<typeof editAccountSchema>;

function AccountModal({ open, onClose, account, projectId, onSave }: {
  open: boolean;
  onClose: () => void;
  account?: SocialAccount | null;
  projectId: string;
  onSave: (a: SocialAccount) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!account;

  const resolver = isEdit
    ? zodResolver(editAccountSchema as unknown as typeof accountSchema)
    : zodResolver(accountSchema);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<AccountForm>({
    resolver,
    defaultValues: {
      platform: account?.platform ?? 'Gmail',
      accountName: account?.accountName ?? '',
      emailHandle: account?.emailHandle ?? '',
      password: '',
      notes: account?.notes ?? '',
    },
  });
  const selectedPlatform = watch('platform');

  useEffect(() => {
    reset({
      platform: account?.platform ?? 'Gmail',
      accountName: account?.accountName ?? '',
      emailHandle: account?.emailHandle ?? '',
      password: '',
      notes: account?.notes ?? '',
    });
    setError(null);
  }, [account, open, reset]);

  const onSubmit = async (data: AccountForm) => {
    setError(null);
    try {
      let res: { account: SocialAccount };
      if (isEdit && account) {
        const payload: Partial<AccountForm> = { ...data };
        if (!payload.password) delete payload.password;
        res = await api.accounts.update(account.id, payload);
      } else {
        res = await api.accounts.create({ ...data, projectId });
      }
      onSave(res.account);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save account');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit account' : 'Add social account'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update account details.' : 'Add a new social media account to this project.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <Alert variant="destructive">{error}</Alert>}
          <FormField label="Platform" error={errors.platform?.message} required>
            <CustomSelect
              value={selectedPlatform}
              onChange={(value) => setValue('platform', value as AccountForm['platform'], { shouldValidate: true })}
              options={PLATFORMS.map(p => ({ value: p, label: p }))}
            />
          </FormField>
          <FormField label="Account name" error={errors.accountName?.message} required>
            <Input placeholder="e.g. My Business Account" {...register('accountName')} />
          </FormField>
          <FormField label="Email / Handle" error={errors.emailHandle?.message} required>
            <Input placeholder="user@example.com or @handle" {...register('emailHandle')} />
          </FormField>
          <FormField
            label={isEdit ? 'Password (leave blank to keep)' : 'Password'}
            error={errors.password?.message}
            required={!isEdit}
          >
            <Input type="password" placeholder={isEdit ? 'Leave blank to keep current' : '••••••••'} {...register('password')} />
          </FormField>
          <FormField label="Notes" error={errors.notes?.message}>
            <Textarea placeholder="Optional notes..." rows={2} {...register('notes')} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{isEdit ? 'Save changes' : 'Add account'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PasswordReveal({ accountId }: { accountId: string }) {
  const [show, setShow] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reveal = async () => {
    if (show) { setShow(false); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await api.accounts.get(accountId);
      setPassword(res.account.password ?? null);
      setShow(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reveal password');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!password) return;
    const text = password;
    try {
      // Preferred: async Clipboard API (requires secure context)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback: hidden textarea + legacy execCommand
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore clipboard failure */ }
  };

  if (!show) {
    return (
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', error && 'text-red-400 hover:text-red-300')}
          onClick={reveal}
          disabled={loading}
          title={error ?? 'Show password'}
        >
          {loading ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" /> : <Eye className="h-4 w-4" />}
        </Button>
      );
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <code className="text-xs bg-zinc-800 border border-zinc-700 px-2 py-1 rounded font-mono text-zinc-200 max-w-[140px] truncate select-all">
        {password ?? ''}
      </code>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copy} title="Copy password">
        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-400" onClick={() => setShow(false)} title="Hide password">
        <EyeOff className="h-4 w-4" />
      </Button>
    </div>
  );
}

function DeleteAccountModal({ open, onClose, account, onDeleted }: {
  open: boolean;
  onClose: () => void;
  account: SocialAccount | null;
  onDeleted: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!account) return;
    setLoading(true);
    setError(null);
    try {
      await api.accounts.delete(account.id);
      onDeleted(account.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete account</DialogTitle>
          <DialogDescription>
            Delete <strong className="text-zinc-200">{account?.accountName}</strong> ({account?.platform})?
          </DialogDescription>
        </DialogHeader>
        {error && <Alert variant="destructive">{error}</Alert>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" loading={loading} onClick={handleDelete}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editAccount, setEditAccount] = useState<SocialAccount | null>(null);
  const [deleteAccount, setDeleteAccount] = useState<SocialAccount | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [projRes, accRes] = await Promise.all([
        api.projects.get(id),
        api.accounts.list(id),
      ]);
      setProject(projRes.project);
      setAccounts(accRes.accounts);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = (a: SocialAccount) => {
    setAccounts(prev => {
      const idx = prev.findIndex(x => x.id === a.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = a;
        return next;
      }
      return [a, ...prev];
    });
  };

  const handleDeleted = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  const platforms = [...new Set(accounts.map(a => a.platform))];

  // Filter and search logic
  const filteredAccounts = useMemo(() => {
    let result = accounts;
    
    // Filter by platform
    if (filterPlatform !== 'all') {
      result = result.filter(a => a.platform === filterPlatform);
    }
    
    // Search by account name, email, or platform
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.accountName.toLowerCase().includes(query) ||
        a.emailHandle.toLowerCase().includes(query) ||
        a.platform.toLowerCase().includes(query) ||
        (a.notes?.toLowerCase().includes(query) ?? false)
      );
    }
    
    return result;
  }, [accounts, filterPlatform, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredAccounts.length / ITEMS_PER_PAGE);
  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredAccounts.slice(start, end);
  }, [filteredAccounts, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPlatform, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="h-6 w-48 bg-zinc-800 rounded animate-pulse" />
          ) : (
            <>
              <h1 className="text-xl font-semibold text-zinc-100 truncate">{project?.name}</h1>
              {project?.description && (
                <p className="text-sm text-zinc-500 mt-0.5 line-clamp-1">{project.description}</p>
              )}
            </>
          )}
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add account
        </Button>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Platform filter */}
        {platforms.length > 0 && (
          <CustomSelect
            value={filterPlatform}
            onChange={(value) => setFilterPlatform(value)}
            options={[
              { value: 'all', label: `All Platforms (${accounts.length})` },
              ...platforms.map(p => ({ value: p, label: p }))
            ]}
            className="sm:w-48"
          />
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg border border-zinc-800 bg-zinc-900/30 animate-pulse" />)}
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Users className="h-10 w-10 text-zinc-700" />
          <p className="text-sm text-zinc-500">
            {accounts.length === 0 ? 'No accounts yet' : searchQuery ? 'No accounts found' : 'No accounts match filter'}
          </p>
          {accounts.length === 0 && (
            <Button variant="outline" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add first account
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Accounts list */}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {paginatedAccounts.map((account: SocialAccount) => (
              <div
                key={account.id}
                className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-3 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all"
              >
                {/* Platform icon */}
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg shrink-0', PLATFORM_BG[account.platform as Platform])}>
                  <PlatformIcon
                    platform={account.platform as Platform}
                    className={cn('h-5 w-5', PLATFORM_COLORS[account.platform as Platform])}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-100 truncate">{account.accountName}</span>
                    <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">{account.platform}</Badge>
                  </div>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">{account.emailHandle}</p>
                  {account.notes && <p className="text-[11px] text-zinc-600 truncate mt-0.5">{account.notes}</p>}
                </div>

                {/* Password reveal */}
                <div className="shrink-0">
                  <PasswordReveal accountId={account.id} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {buildProfileUrl(account.platform as Platform, account.accountName) && (
                    <a
                      href={buildProfileUrl(account.platform as Platform, account.accountName) ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Open ${account.platform} profile`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditAccount(account)}
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:text-red-400"
                    onClick={() => setDeleteAccount(account)}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setCurrentPage(page)}
                    className="h-8 w-8"
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      <AccountModal
        open={showAdd || !!editAccount}
        onClose={() => { setShowAdd(false); setEditAccount(null); }}
        account={editAccount}
        projectId={id!}
        onSave={handleSave}
      />
      <DeleteAccountModal
        open={!!deleteAccount}
        onClose={() => setDeleteAccount(null)}
        account={deleteAccount}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
