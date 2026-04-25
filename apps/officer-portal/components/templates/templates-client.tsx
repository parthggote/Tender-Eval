'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutTemplateIcon, PlusIcon, UploadIcon, StarIcon,
  Trash2Icon, ArrowRightIcon, SparklesIcon, Loader2Icon,
} from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@workspace/ui/components/dialog';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Textarea } from '@workspace/ui/components/textarea';
import { toast } from '@workspace/ui/components/sonner';
import { templateStore, CriteriaTemplate, TemplateCriterion } from '~/lib/template-store';
import { CriterionType } from '@workspace/dtos';
import { replaceAgencySlug, routes } from '@workspace/routes';
import { SketchEmpty } from '~/components/ui/sketch-empty';
import { CriteriaCard } from '~/components/ui/criteria-card';
import {
  createTender, uploadTenderDocument, triggerCriteriaExtraction,
  getJobStatus, getTenderCriteria,
} from '~/lib/internal-api';

type CreateMode = 'manual' | 'upload' | null;

export function TemplatesClient({ agencySlug }: { agencySlug: string }) {
  const router = useRouter();
  const [templates, setTemplates] = React.useState<CriteriaTemplate[]>([]);
  const [createMode, setCreateMode] = React.useState<CreateMode>(null);

  // Form state
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [criteriaText, setCriteriaText] = React.useState('');

  React.useEffect(() => {
    setTemplates(templateStore.list(agencySlug));
  }, [agencySlug]);

  function refresh() {
    setTemplates(templateStore.list(agencySlug));
  }

  function handleSetDefault(id: string) {
    templateStore.setDefault(agencySlug, id);
    refresh();
  }

  function handleDelete(id: string) {
    templateStore.delete(agencySlug, id);
    refresh();
  }

  function handleCreateManual() {
    if (!name.trim()) return;
    // Parse criteria from textarea (one per line)
    const lines = criteriaText.split('\n').filter((l) => l.trim());
    const criteria: TemplateCriterion[] = lines.map((line, i) => ({
      id: crypto.randomUUID(),
      text: line.trim(),
      type: CriterionType.COMPLIANCE,
      threshold: null,
      mandatory: true,
    }));
    const t = templateStore.create(agencySlug, {
      name: name.trim(),
      description: description.trim(),
      isDefault: templates.length === 0,
      source: 'manual',
      criteria,
    });
    setCreateMode(null);
    setName(''); setDescription(''); setCriteriaText('');
    refresh();
    router.push(
      replaceAgencySlug(routes.portal.agencies.agencySlug.templateDetail, agencySlug)
        .replace('[templateId]', t.id)
    );
  }

  const [extracting, setExtracting] = React.useState(false);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !name.trim()) return;
    setExtracting(true);

    (async () => {
      try {
        // 1. Create a temporary tender to host the document
        const tender = await createTender(agencySlug, {
          title: `[Template] ${name.trim()}`,
          description: 'Temporary tender for template extraction',
        });

        // 2. Upload the document
        const formData = new FormData();
        formData.append('file', file);
        await uploadTenderDocument(tender.id, formData);

        // 3. Trigger extraction
        const { taskId } = await triggerCriteriaExtraction(tender.id);

        // 4. Poll for completion
        await new Promise<void>((resolve, reject) => {
          const interval = setInterval(async () => {
            try {
              const status = await getJobStatus(taskId);
              if (status.status === 'SUCCESS') { clearInterval(interval); resolve(); }
              else if (status.status === 'FAILURE') { clearInterval(interval); reject(new Error('Extraction failed')); }
            } catch (err) { clearInterval(interval); reject(err); }
          }, 2000);
        });

        // 5. Fetch extracted criteria
        const extracted = await getTenderCriteria(tender.id);
        const tplCriteria: TemplateCriterion[] = extracted.map((c) => ({
          id: crypto.randomUUID(),
          text: c.text,
          type: c.type,
          threshold: c.threshold ?? null,
          mandatory: c.mandatory,
        }));

        // 6. Save as template
        const t = templateStore.create(agencySlug, {
          name: name.trim(),
          description: `Extracted from ${file.name}`,
          isDefault: templates.length === 0,
          source: 'upload',
          criteria: tplCriteria,
        });

        setCreateMode(null);
        setName(''); setDescription('');
        refresh();
        toast.success(`Extracted ${tplCriteria.length} criteria from document`);
        router.push(
          replaceAgencySlug(routes.portal.agencies.agencySlug.templateDetail, agencySlug)
            .replace('[templateId]', t.id)
        );
      } catch (err) {
        toast.error('Could not extract criteria from document. Please try again.');
      } finally {
        setExtracting(false);
      }
    })();
  }

  const defaultTemplate = templates.find((t) => t.isDefault);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 overflow-auto">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Criteria templates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Reusable evaluation criteria sets. Set a default to pre-fill new tenders.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setCreateMode('upload')}>
            <UploadIcon className="size-3.5" /> Upload doc
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setCreateMode('manual')}>
            <PlusIcon className="size-3.5" /> Create template
          </Button>
        </div>
      </div>

      {/* Default template callout */}
      {defaultTemplate && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3">
          <StarIcon className="size-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Default template: <span className="text-primary">{defaultTemplate.name}</span></p>
            <p className="text-xs text-muted-foreground mt-0.5">Applied automatically when AI extraction is not available.</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1 shrink-0">
            <Link href={replaceAgencySlug(routes.portal.agencies.agencySlug.templateDetail, agencySlug).replace('[templateId]', defaultTemplate.id)}>
              Edit <ArrowRightIcon className="size-3" />
            </Link>
          </Button>
        </div>
      )}

      {/* No AI extraction notice when no templates */}
      {templates.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 px-5 py-6 flex flex-col items-center gap-3 text-center">
          <SparklesIcon className="size-8 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium">No templates yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Without a template, tenders will use AI criteria extraction only.
              Create a template to reuse criteria across multiple tenders.
            </p>
          </div>
          <div className="flex gap-2 mt-1">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setCreateMode('upload')}>
              <UploadIcon className="size-3.5" /> Upload doc
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => setCreateMode('manual')}>
              <PlusIcon className="size-3.5" /> Create template
            </Button>
          </div>
        </div>
      )}

      {/* Template grid */}
      {templates.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => {
            const typeCounts = t.criteria.reduce<Record<string, number>>((acc, c) => {
              acc[c.type] = (acc[c.type] ?? 0) + 1;
              return acc;
            }, {});
            const mandatoryCount = t.criteria.filter((c) => c.mandatory).length;
            const detailUrl = replaceAgencySlug(routes.portal.agencies.agencySlug.templateDetail, agencySlug)
              .replace('[templateId]', t.id);

            return (
              <CriteriaCard
                key={t.id}
                icon={<LayoutTemplateIcon className="size-4 text-muted-foreground" />}
                title={t.name}
                subtitle={t.description || 'No description'}
                titleBadge={t.isDefault ? <StarIcon className="size-3 text-primary shrink-0" /> : undefined}
                criteriaCount={t.criteria.length}
                mandatoryCount={mandatoryCount}
                typeCounts={typeCounts}
                sourceBadge={t.source}
                date={t.createdAt}
                footerLeft={
                  !t.isDefault ? (
                    <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => handleSetDefault(t.id)}>
                      <StarIcon className="size-3" /> Set default
                    </Button>
                  ) : undefined
                }
                footerRight={
                  <div className="flex items-center gap-2 ml-auto">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(t.id)}>
                      <Trash2Icon className="size-3" />
                    </Button>
                    <Button asChild variant="outline" size="sm" className="gap-1.5">
                      <a href={detailUrl}>Edit <ArrowRightIcon className="size-3.5" /></a>
                    </Button>
                  </div>
                }
              />
            );
          })}
        </div>
      )}

      {/* Create manual dialog */}
      <Dialog open={createMode === 'manual'} onOpenChange={(o) => !o && setCreateMode(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create criteria template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-name">Template name</Label>
              <Input id="tpl-name" placeholder="e.g. Standard IT Procurement" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tpl-desc">Description <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="tpl-desc" placeholder="Brief description of this template" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tpl-criteria">Criteria <span className="text-muted-foreground">(one per line)</span></Label>
              <Textarea
                id="tpl-criteria"
                placeholder={"Vendor must have ISO 27001 certification\nMinimum 5 years of experience\nFinancial turnover > ₹10 Cr"}
                rows={6}
                value={criteriaText}
                onChange={(e) => setCriteriaText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">You can edit types, thresholds, and mandatory flags after creation.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateMode(null)}>Cancel</Button>
            <Button onClick={handleCreateManual} disabled={!name.trim()}>Create template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload dialog */}
      <Dialog open={createMode === 'upload'} onOpenChange={(o) => !o && !extracting && setCreateMode(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create template from document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="upl-name">Template name</Label>
              <Input id="upl-name" placeholder="e.g. Consultant Agreement Template" value={name} onChange={(e) => setName(e.target.value)} disabled={extracting} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="upl-file">Upload document</Label>
              <div className="rounded-lg border-2 border-dashed border-border p-6 text-center space-y-2">
                {extracting ? (
                  <>
                    <Loader2Icon className="size-8 text-primary/60 mx-auto animate-spin" />
                    <p className="text-sm font-medium">Extracting criteria…</p>
                    <p className="text-xs text-muted-foreground">This may take up to 30 seconds</p>
                  </>
                ) : (
                  <>
                    <UploadIcon className="size-8 text-muted-foreground/40 mx-auto" />
                    <p className="text-sm text-muted-foreground">PDF, DOCX, or TXT</p>
                    <input
                      id="upl-file"
                      type="file"
                      accept=".pdf,.docx,.txt"
                      className="hidden"
                      onChange={handleUpload}
                    />
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('upl-file')?.click()} disabled={!name.trim()}>
                      Choose file
                    </Button>
                    {!name.trim() && <p className="text-xs text-muted-foreground">Enter a name first</p>}
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">AI will extract criteria automatically. You can review and edit before saving.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateMode(null)} disabled={extracting}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
