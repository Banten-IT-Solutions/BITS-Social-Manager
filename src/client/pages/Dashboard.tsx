import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderOpen, Pencil, Trash2, ChevronRight, Calendar, LayoutGrid } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../lib/api';
import type { Project } from '../lib/types';
import {
  Button, Input, Textarea, FormField, Alert,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge,
} from '../components/ui';

// Helper to format date
const formatDate = (timestamp: number) => {
  // Timestamp is already in seconds from SQLite unixepoch()
  const d = new Date(timestamp * 1000);
  if (isNaN(d.getTime())) return 'Recently';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const projectSchema = z.object({
  name: z.string().min(1, 'Name required').max(200),
  description: z.string().max(1000).optional(),
});
type ProjectForm = z.infer<typeof projectSchema>;

/**
 * Primary CTA styling shared by page headers: violet accent, pill shape,
 * glow shadow, 44px touch target, full-width on mobile.
 */
const HEADER_CTA =
  'min-h-[44px] w-full shrink-0 rounded-full bg-violet-600 text-white shadow-lg shadow-violet-600/20 transition-all hover:bg-violet-500 active:scale-95 focus-visible:ring-2 focus-visible:ring-violet-300 motion-reduce:transition-none motion-reduce:active:scale-100 sm:w-auto';

/** Decorative violet tile behind header icons (matches project card icon tiles). */
const HEADER_ICON_TILE =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-violet-500/20 bg-gradient-to-br from-violet-500/20 to-violet-600/10';

function ProjectModal({ open, onClose, project, onSave }: {
  open: boolean;
  onClose: () => void;
  project?: Project | null;
  onSave: (p: Project) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: project?.name ?? '', description: project?.description ?? '' },
  });

  useEffect(() => {
    reset({ name: project?.name ?? '', description: project?.description ?? '' });
    setError(null);
  }, [project, open, reset]);

  const onSubmit = async (data: ProjectForm) => {
    setError(null);
    try {
      let res: { project: Project };
      if (project) {
        res = await api.projects.update(project.id, data);
      } else {
        res = await api.projects.create(data);
      }
      onSave(res.project);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save project');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project ? 'Edit project' : 'New project'}</DialogTitle>
          <DialogDescription>
            {project ? 'Update project details.' : 'Create a container for your social accounts.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <Alert variant="destructive">{error}</Alert>}
          <FormField label="Project name" error={errors.name?.message} required>
            <Input placeholder="e.g. Banten IT Solutions" {...register('name')} />
          </FormField>
          <FormField label="Description" error={errors.description?.message}>
            <Textarea placeholder="Optional description..." rows={3} {...register('description')} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{project ? 'Save changes' : 'Create project'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteModal({ open, onClose, project, onDeleted }: {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  onDeleted: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!project) return;
    setLoading(true);
    setError(null);
    try {
      await api.projects.delete(project.id);
      onDeleted(project.id);
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
          <DialogTitle>Delete project</DialogTitle>
          <DialogDescription>
            This will permanently delete <strong className="text-zinc-200">{project?.name}</strong> and all its social accounts.
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

export function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [accountCounts, setAccountCounts] = useState<Record<string, number>>({});

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.projects.list();
      setProjects(res.projects);
      
      // Fetch account counts for each project
      const counts: Record<string, number> = {};
      await Promise.all(
        res.projects.map(async (project) => {
          try {
            const accountsRes = await api.accounts.list(project.id);
            counts[project.id] = accountsRes.accounts.length;
          } catch {
            counts[project.id] = 0;
          }
        })
      );
      setAccountCounts(counts);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleSave = (p: Project) => {
    setProjects(prev => {
      const idx = prev.findIndex(x => x.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = p;
        return next;
      }
      return [p, ...prev];
    });
  };

  const handleDeleted = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
        {/* Subtle violet glow for depth */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-transparent" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className={HEADER_ICON_TILE} aria-hidden="true">
              <LayoutGrid className="h-5 w-5 text-violet-400" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Projects</h1>
                {!loading && (
                  <Badge variant="secondary" className="shrink-0">
                    {projects.length} {projects.length === 1 ? 'project' : 'projects'}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-zinc-400">Manage your social media projects</p>
            </div>
          </div>

          <Button onClick={() => setShowCreate(true)} className={HEADER_CTA}>
            <span
              aria-hidden="true"
              className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/20"
            >
              <Plus className="h-3.5 w-3.5" />
            </span>
            New project
          </Button>
        </div>
      </header>

      {error && <Alert variant="destructive">{error}</Alert>}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-lg border border-zinc-800 bg-zinc-900/30 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <FolderOpen className="h-10 w-10 text-zinc-700" />
          <p className="text-sm text-zinc-500">No projects yet</p>
          <Button variant="outline" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create first project
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/80 hover:shadow-lg hover:shadow-violet-500/10"
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative p-5 space-y-4">
                {/* Header with icon and actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Folder icon */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/20 flex items-center justify-center group-hover:from-violet-500/30 group-hover:to-violet-600/20 transition-all">
                      <FolderOpen className="h-5 w-5 text-violet-400" />
                    </div>
                    
                    {/* Title and description */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-zinc-100 truncate group-hover:text-white transition-colors">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions - show on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-zinc-800"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditProject(project);
                      }}
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-zinc-800 hover:text-red-400"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteProject(project);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Stats and meta */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    {/* Account count badge */}
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500/60" />
                      <span>{accountCounts[project.id] ?? 0} {accountCounts[project.id] === 1 ? 'account' : 'accounts'}</span>
                    </div>
                    
                    {/* Updated date */}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(project.updatedAt)}</span>
                    </div>
                  </div>
                  
                  {/* Arrow indicator */}
                  <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <ProjectModal
        open={showCreate || !!editProject}
        onClose={() => { setShowCreate(false); setEditProject(null); }}
        project={editProject}
        onSave={handleSave}
      />
      <DeleteModal
        open={!!deleteProject}
        onClose={() => setDeleteProject(null)}
        project={deleteProject}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
