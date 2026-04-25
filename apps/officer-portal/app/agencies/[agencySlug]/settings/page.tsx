'use client';

import * as React from 'react';
import { toast } from '@workspace/ui/components/sonner';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Separator } from '@workspace/ui/components/separator';
import { PageHeader } from '~/components/layout/page-header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@workspace/ui/components/alert-dialog';

// Settings page is client component so Save/Invite can have real handlers (#S-2, #S-3)
export default function SettingsPage(): React.JSX.Element {
  const [saving, setSaving] = React.useState(false);
  const [inviting, setInviting] = React.useState(false);

  // #S-2: Save changes handler with feedback
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      // TODO: wire to updateAgency API call
      await new Promise((r) => setTimeout(r, 600)); // placeholder
      toast.success('Agency profile updated.');
    } catch {
      toast.error('Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // #S-3: Invite member handler with feedback
  const handleInvite = async () => {
    setInviting(true);
    try {
      // TODO: wire to inviteMember API call
      await new Promise((r) => setTimeout(r, 400)); // placeholder
      toast.success('Invitation sent.');
    } catch {
      toast.error('Could not send invitation. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  return (
    <>
      <PageHeader breadcrumbs={[{ label: 'Settings' }]} />
      {/* #S-5: constrained width, consistent with page layout */}
      <div className="flex flex-1 flex-col overflow-auto">
        <div className="max-w-2xl w-full mx-auto p-6 space-y-10">

          {/* Agency profile */}
          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Agency profile</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Update the display name for this agency.</p>
            </div>
            <Separator />
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Agency name</Label>
                <Input id="name" name="name" className="max-w-sm" placeholder="My Agency" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">
                  Slug
                  <span className="ml-2 text-xs text-muted-foreground font-normal">(read-only)</span>
                </Label>
                <Input id="slug" name="slug" disabled className="max-w-sm font-mono" />
              </div>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </form>
          </section>

          {/* Members — #S-4: note that real data requires API integration */}
          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Members and access</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Control who can access this agency workspace.
              </p>
            </div>
            <Separator />
            <div className="rounded-lg border overflow-hidden divide-y divide-border">
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">Administrator</p>
                  <p className="text-xs text-muted-foreground">Full access to agency settings and audit logs.</p>
                </div>
                <Badge variant="secondary">Owner</Badge>
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-medium">Procurement officer</p>
                  <p className="text-xs text-muted-foreground">Can upload tenders and evaluate bidders.</p>
                </div>
                <Badge variant="outline">Member</Badge>
              </div>
            </div>
            {/* #S-3: invite button with handler */}
            <Button variant="outline" size="sm" disabled={inviting} onClick={handleInvite}>
              {inviting ? 'Sending…' : 'Invite member'}
            </Button>
          </section>

          {/* Danger zone */}
          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-destructive">Danger zone</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Irreversible actions that affect this agency and all its data.
              </p>
            </div>
            <Separator className="border-destructive/20" />
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Archive this agency</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanently archives this agency and all its tenders. This cannot be undone.
                </p>
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
        </div>
      </div>
    </>
  );
}
