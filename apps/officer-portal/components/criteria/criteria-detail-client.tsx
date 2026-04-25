'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2Icon, AlertCircleIcon, FilterIcon, SaveIcon,
  LayoutTemplateIcon, PencilIcon, Trash2Icon, PlusIcon,
} from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Progress } from '@workspace/ui/components/progress';
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
import { Label } from '@workspace/ui/components/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@workspace/ui/components/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@workspace/ui/components/select';
import { Switch } from '@workspace/ui/components/switch';
import { toast } from '@workspace/ui/components/sonner';
import { CriterionType } from '@workspace/dtos';
import type { Criterion } from '@workspace/dtos';
import { templateStore, TemplateCriterion } from '~/lib/template-store';
import { replaceAgencySlug, routes } from '@workspace/routes';

const TYPE_META: Record<string, { label: string; color: string }> = {
  [CriterionType.FINANCIAL]:     { label: 'Financial',     color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  [CriterionType.TECHNICAL]:     { label: 'Technical',     color: 'bg-violet-500/10 text-violet-600 border-violet-200' },
  [CriterionType.COMPLIANCE]:    { label: 'Compliance',    color: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  [CriterionType.CERTIFICATION]: { label: 'Certification', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' },
};

type EditableCriterion = Criterion & { _dirty?: boolean };

function groupByType(criteria: EditableCriterion[]): Record<string, EditableCriterion[]> {
  return criteria.reduce<Record<string, EditableCriterion[]>>((acc, c) => {
    const key = c.type ?? 'OTHER';
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});
}

export function CriteriaDetailClient({
  agencySlug, tenderId, tenderTitle, initialCriteria,
}: {
  agencySlug: string;
  tenderId: string;
  tenderTitle: string;
  initialCriteria: Criterion[];
}) {
  const router = useRouter();
  const [criteria, setCriteria] = React.useState<EditableCriterion[]>(initialCriteria);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [saveAsTemplateOpen, setSaveAsTemplateOpen] = React.useState(false);
  const [templateName, setTemplateName] = React.useState('');
  const [templateDesc, setTemplateDesc] = React.useState('');

  const avgConfidence = criteria.length
    ? criteria.reduce((s, c) => s + (c.confidence ?? 0), 0) / criteria.length
    : 0;
  const mandatoryCount = criteria.filter((c) => c.mandatory).length;
  const grouped = groupByType(criteria);

  function updateCriterion(id: string, patch: Partial<EditableCriterion>) {
    setCriteria((prev) => prev.map((c) => c.id === id ? { ...c, ...patch, _dirty: true } : c));
  }

  function handleSaveAsTemplate() {
    if (!templateName.trim()) return;
    const tplCriteria: TemplateCriterion[] = criteria.map((c) => ({
      id: crypto.randomUUID(),
      text: c.text,
      type: c.type,
      threshold: c.threshold ?? null,
      mandatory: c.mandatory,
    }));
    const t = templateStore.create(agencySlug, {
      name: templateName.trim(),
      description: templateDesc.trim() || `From tender: ${tenderTitle}`,
      isDefault: templateStore.list(agencySlug).length === 0,
      source: 'ai',
      criteria: tplCriteria,
    });
    setSaveAsTemplateOpen(false);
    setTemplateName(''); setTemplateDesc('');
    toast.success('Saved as template');
    router.push(
      replaceAgencySlug(routes.portal.agencies.agencySlug.templateDetail, agencySlug)
        .replace('[templateId]', t.id)
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 overflow-auto">
      {/* Summary bar */}
      <div className="rounded-xl border border-border bg-card px-5 py-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <FilterIcon className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{criteria.length}</span>
          <span className="text-sm text-muted-foreground">criteria extracted</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <CheckCircle2Icon className="size-4 text-success" />
          <span className="font-semibold">{mandatoryCount}</span>
          <span className="text-muted-foreground">mandatory</span>
        </div>
        {criteria.length > 0 && (
          <div className="flex items-center gap-2 flex-1 min-w-[160px]">
            <span className="text-xs text-muted-foreground shrink-0">Avg. confidence</span>
            <Progress value={avgConfidence * 100} className="h-1.5 flex-1" />
            <span className="text-xs font-mono text-muted-foreground shrink-0">{Math.round(avgConfidence * 100)}%</span>
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setSaveAsTemplateOpen(true)}>
            <LayoutTemplateIcon className="size-3.5" /> Save as template
          </Button>
        </div>
      </div>

      {criteria.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-muted-foreground">No criteria extracted yet for this tender.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
          {/* Scrollable criteria list */}
          <div className="overflow-y-auto divide-y divide-border">
            {Object.entries(grouped).map(([type, items]) => {
              const meta = TYPE_META[type] ?? { label: type, color: 'bg-muted text-muted-foreground border-border' };
              return (
                <React.Fragment key={type}>
                  {/* Sticky type header */}
                  <div className="px-5 py-2.5 bg-muted/30 flex items-center gap-2 sticky top-0 z-10 backdrop-blur-sm border-b border-border">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${meta.color}`}>
                      {meta.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
                  </div>

                  {items.map((c) => {
                    const isEditing = editingId === c.id;
                    return (
                      <div key={c.id} className={`px-5 py-4 transition-colors ${isEditing ? 'bg-muted/20' : 'hover:bg-muted/10'}`}>
                        {isEditing ? (
                          /* Edit mode */
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <Select value={c.type} onValueChange={(v) => updateCriterion(c.id, { type: v as CriterionType })}>
                                <SelectTrigger className="h-7 w-36 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.values(CriterionType).map((t) => (
                                    <SelectItem key={t} value={t} className="text-xs">{t.charAt(0) + t.slice(1).toLowerCase()}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="flex items-center gap-1.5 ml-auto">
                                <Switch
                                  id={`m-${c.id}`}
                                  checked={c.mandatory}
                                  onCheckedChange={(v) => updateCriterion(c.id, { mandatory: v })}
                                  className="scale-75"
                                />
                                <Label htmlFor={`m-${c.id}`} className="text-xs text-muted-foreground cursor-pointer">Mandatory</Label>
                              </div>
                              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setEditingId(null)}>
                                <SaveIcon className="size-3.5" /> Done
                              </Button>
                            </div>
                            <Textarea
                              value={c.text}
                              onChange={(e) => updateCriterion(c.id, { text: e.target.value })}
                              rows={3}
                              className="text-sm resize-none"
                            />
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground shrink-0">Threshold</span>
                              <Input
                                value={c.threshold ?? ''}
                                onChange={(e) => updateCriterion(c.id, { threshold: e.target.value || null })}
                                placeholder="e.g. ≥ ₹10 Cr"
                                className="h-7 text-xs font-mono"
                              />
                            </div>
                          </div>
                        ) : (
                          /* View mode */
                          <div className="flex items-start gap-4">
                            <div className="mt-0.5 shrink-0">
                              {c.mandatory
                                ? <CheckCircle2Icon className="size-4 text-success" />
                                : <AlertCircleIcon className="size-4 text-muted-foreground/30" />}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <p className="text-sm leading-relaxed">{c.text}</p>
                              {c.threshold && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-muted-foreground">Threshold:</span>
                                  <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{c.threshold}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="size-6" onClick={() => setEditingId(c.id)}>
                                  <PencilIcon className="size-3 text-muted-foreground" />
                                </Button>
                              </div>
                              <Badge variant={c.mandatory ? 'default' : 'secondary'} className="text-xs">
                                {c.mandatory ? 'Mandatory' : 'Optional'}
                              </Badge>
                              {c.confidence != null && (
                                <div className="flex items-center gap-1.5 w-24">
                                  <Progress value={c.confidence * 100} className="h-1 flex-1" />
                                  <span className="text-xs font-mono text-muted-foreground w-8 text-right">
                                    {Math.round(c.confidence * 100)}%
                                  </span>
                                </div>
                              )}
                              {c.sourcePage != null && (
                                <span className="text-xs text-muted-foreground">p.{c.sourcePage}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Save as template dialog */}
      <Dialog open={saveAsTemplateOpen} onOpenChange={setSaveAsTemplateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save as template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Save these {criteria.length} criteria as a reusable template for future tenders.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="tpl-name">Template name</Label>
              <Input
                id="tpl-name"
                placeholder={`e.g. ${tenderTitle} Template`}
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tpl-desc">Description <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                id="tpl-desc"
                placeholder="Brief description"
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveAsTemplateOpen(false)}>Cancel — use once</Button>
            <Button onClick={handleSaveAsTemplate} disabled={!templateName.trim()}>
              <LayoutTemplateIcon className="size-3.5 mr-1.5" /> Save template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
