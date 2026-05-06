'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, UploadIcon, XIcon } from 'lucide-react';
import Image from 'next/image';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';

import { createAgencyAction } from './actions';

type CreateAgencyDialogProps = {
  triggerVariant?: 'default' | 'outline' | 'ghost';
};

export function CreateAgencyDialog({ triggerVariant = 'outline' }: CreateAgencyDialogProps): React.JSX.Element {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setLogoPreview(null);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo must be less than 2MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError(null);
  }

  function clearLogo() {
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get('name') ?? '').trim();
    const slug = String(formData.get('slug') ?? '').trim().toLowerCase();

    if (!name || !slug) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      setError('Slug can only contain lowercase letters, numbers, and hyphens');
      setLoading(false);
      return;
    }

    try {
      // Remove logo from FormData if no file was actually selected
      const logoFile = formData.get('logo') as File | null;
      if (!logoFile || logoFile.size === 0) {
        formData.delete('logo');
      }
      await createAgencyAction(formData);
      setOpen(false);
      setLogoPreview(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agency');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size="sm">
          <PlusIcon className="size-4 mr-2" />
          Create Agency
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Agency Workspace</DialogTitle>
            <DialogDescription>
              Create a new agency workspace to manage tenders and evaluations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Agency Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Central Reserve Police Force"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL identifier) *</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="e.g., crpf"
                pattern="[a-z0-9-]+"
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and hyphens only
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Logo (optional)</Label>
              {/* File input is always in the DOM so FormData includes the file on submit */}
              <Input
                ref={fileInputRef}
                id="logo"
                name="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                disabled={loading}
                className="hidden"
              />
              {logoPreview ? (
                <div className="flex items-center gap-3">
                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden shrink-0">
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={clearLogo}
                    className="p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                    disabled={loading}
                  >
                    <XIcon className="size-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                  >
                    <UploadIcon className="size-4 mr-2" />
                    Upload Logo
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WebP, or SVG (max 2MB)
                  </p>
                </div>
              )}
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Agency'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
