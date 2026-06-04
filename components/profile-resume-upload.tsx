'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  RESUME_ACCEPT_ATTR,
  RESUME_MAX_LABEL,
} from '@/lib/profile/resume-constants';
import type { ResumeMeta } from '@/lib/profile/types';

type ProfileResumeUploadProps = {
  initial: ResumeMeta;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProfileResumeUpload({ initial }: ProfileResumeUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [resume, setResume] = useState(initial);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/profile/resume', { method: 'POST', body: form });
        const data = (await res.json()) as { profile?: { resume: ResumeMeta }; error?: string };
        if (!res.ok) throw new Error(data.error ?? 'Upload failed');
        setResume(data.profile?.resume ?? null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setUploading(false);
        setDragOver(false);
      }
    },
    [router]
  );

  const onFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) void uploadFile(file);
  };

  const handleRemove = async () => {
    setError(null);
    setRemoving(true);
    try {
      const res = await fetch('/api/profile/resume', { method: 'DELETE' });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Could not remove resume');
      setResume(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove resume');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {resume ? (
        <div className="flex flex-col gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="break-all text-sm font-medium text-foreground">{resume.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(resume.sizeBytes)} · Updated{' '}
                {new Date(resume.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button type="button" variant="outline" size="sm" className="h-10 w-full" asChild>
              <a href="/api/profile/resume" download={resume.fileName}>
                <Download className="h-4 w-4" />
                Download
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 w-full"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Replace
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 w-full"
              disabled={removing}
              onClick={() => void handleRemove()}
            >
              {removing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            onFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex min-h-[200px] flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border bg-muted/15 hover:border-primary/40 hover:bg-muted/25',
            uploading && 'pointer-events-none opacity-60'
          )}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">
              Drag and drop your resume here
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF or Word · max {RESUME_MAX_LABEL} · or click to browse
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={RESUME_ACCEPT_ATTR}
        className="sr-only"
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
