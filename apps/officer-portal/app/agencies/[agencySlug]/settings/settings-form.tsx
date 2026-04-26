'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from '@workspace/ui/components/sonner';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Separator } from '@workspace/ui/components/separator';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@workspace/ui/components/alert-dialog';
import { Building2Icon, UploadIcon, XIcon, CheckIcon } from 'lucide-react';
import type { AgencyWorkspace } from '@workspace/dtos';
import { updateAgency } from '~/lib/internal-api';

export function SettingsForm({ agency }: { agency: AgencyWorkspace }) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(agency.logoUrl ?? null);
  const [logoCleared, setLogoCleared] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be less than 2MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
    setLogoCleared(false);
  }

  function clearLogo() {
    setLogoPreview(null);
    setLogoCleared(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      if (logoCleared) formData.set('clear_logo', 'true');
      await updateAgency(agency.slug, formData);
      toast.success('Agency profile updated.');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Agency profile */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Agency profile</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Update the name and logo for this agency workspace.</p>
        </div>
        <Separator />
        <form onSubmit={handleSave} className="space-y-5">
          {/* Logo */}
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              {/* Preview */}
              <div className="size-16 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {logoPreview ? (
                  <Image src={logoPreview} alt="Agency logo" width={64} height={64} className="object-contain p-1" />
                ) : (
                  <Building2Icon className="size-7 text-muted-foreground/40" aria-hidden="true" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    name="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    disabled={saving}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={saving}>
                    <UploadIcon className="size-3.5 mr-1.5" />
                    {logoPreview ? 'Change logo' : 'Upload logo'}
                  </Button>
                  {logoPreview && (
                    <Button type="button" variant="ghost" size="sm" onClick={clearLogo} disabled={saving}>
                      <XIcon className="size-3.5 mr-1.5" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">PNG, JPG, WebP or SVG · max 2 MB</p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="name">Agency name</Label>
            <Input id="name" name="name" className="max-w-sm" defaultValue={agency.name} placeholder="My Agency" />
          </div>

          {/* Slug (read-only) */}
          <div className="grid gap-2">
            <Label htmlFor="slug">
              Slug
              <span className="ml-2 text-xs text-muted-foreground font-normal">(read-only)</span>
            </Label>
            <Input id="slug" name="slug" disabled className="max-w-sm font-mono" defaultValue={agency.slug} />
          </div>

          <Button type="submit" size="sm" disabled={saving}>
            {saving ? 'Saving…' : (
              <><CheckIcon className="size-3.5 mr-1.5" />Save changes</>
            )}
          </Button>
        </form>
      </section>

      {/* Members */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Members and access</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Control who can access this agency workspace.</p>
        </div>
        <Separator />
        <div className="rounded-lg border overflow-hidden divide-y divide-border">
          {[
            { role: 'Administrator', desc: 'Full access to agency settings and audit logs.', badge: 'Owner' as const },
            { role: 'Procurement officer', desc: 'Can upload tenders and evaluate bidders.', badge: 'Member' as const },
          ].map(({ role, desc, badge }) => (
            <div key={role} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium">{role}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Badge variant={badge === 'Owner' ? 'secondary' : 'outline'}>{badge}</Badge>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm">Invite member</Button>
      </section>

      {/* Danger zone */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-destructive">Danger zone</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Irreversible actions that affect this agency and all its data.</p>
        </div>
        <Separator className="border-destructive/20" />
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Archive this agency</p>
            <p className="text-xs text-muted-foreground mt-0.5">Permanently archives this agency and all its tenders. This cannot be undone.</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="shrink-0">Archive agency</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archive this agency?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently archive this agency and all its tenders, criteria, and reports. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Archive agency
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>
    </>
  );
}
