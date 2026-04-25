'use client';

import * as React from 'react';
import {
  PlusIcon, Trash2Icon, StarIcon, SaveIcon,
  CheckCircle2Icon, AlertCircleIcon, ChevronDownIcon,
} from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Input } from '@workspace/ui/components/input';
import { Textarea } from '@workspace/ui/components/textarea';
import { Switch } from '@workspace/ui/components/switch';
import { Label } from '@workspace/ui/components/label';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { templateStore, CriteriaTemplate, TemplateCriterion } from '~/lib/template-store';
import { CriterionType } from '@workspace/dtos';
import { SketchEmpty } from '~/components/ui/sketch-empty';
import { toast } from '@workspace/ui/components/sonner';

const TYPE_META: Record<string, { label: string; pill: string; dot: string }> = {
  [CriterionType.FINANCIAL]:     { label: 'Financial',     pill: 'bg-blue-500/10 text-blue-600 border-blue-200/60',    dot: 'bg-blue-500' },
  [CriterionType.TECHNICAL]:     { label: 'Technical',     pill: 'bg-violet-500/10 text-violet-600 border-violet-200/60', dot: 'bg-violet-500' },
  [CriterionType.COMPLIANCE]:    { label: 'Compliance',    pill: 'bg-amber-500/10 text-amber-600 border-amber-200/60',  dot: 'bg-amber-500' },
  [CriterionType.CERTIFICATION]: { label: 'Certification', pill: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/60', dot: 'bg-emerald-500' },
};

function TypePill({ type, onChange }: { type: CriterionType; onChange: (t: CriterionType) => void }) {
  const meta = TYPE_META[type] ?? { label: type, pill: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground' };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${meta.pill}`}
        >
          <span className={`size-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
          <ChevronDownIcon className="size-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {Object.values(CriterionType).map((t) => {
          const m = TYPE_META[t];
          return (
            <DropdownMenuItem key={t} onClick={() => onChange(t)} className="gap-2">
              <span className={`size-2 rounded-full ${m.dot}`} />
              <span className={`text-xs font-medium ${m.pill.split(' ')[1]}`}>{m.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TemplateDetailClient({ agencySlug, templateId }: { agencySlug: string; templateId: string }) {
  const [template, setTemplate] = React.useState<CriteriaTemplate | null>(null);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [criteria, setCriteria] = React.useState<TemplateCriterion[]>([]);
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    const t = templateStore.get(agencySlug, templateId);
    if (t) { setTemplate(t); setName(t.name); setDescription(t.description); setCriteria(t.criteria); }
  }, [agencySlug, templateId]);

  function mark() { setDirty(true); }

  function updateCriterion(id: string, patch: Partial<TemplateCriterion>) {
    setCriteria((prev) => prev.map((c) => c.id === id ? { ...c, ...patch } : c));
    mark();
  }

  function addCriterion() {
    setCriteria((prev) => [...prev, { id: crypto.randomUUID(), text: '', type: CriterionType.COMPLIANCE, threshold: null, mandatory: true }]);
    mark();
  }

  function removeCriterion(id: string) {
    setCriteria((prev) => prev.filter((c) => c.id !== id));
    mark();
  }

  function handleSave() {
    if (!template) return;
    templateStore.save({ ...template, name, description, criteria });
    setDirty(false);
    toast.success('Template saved');
  }

  function handleSetDefault() {
    if (!template) return;
    templateStore.setDefault(agencySlug, template.id);
    setTemplate({ ...template, isDefault: true });
    toast.success('Set as default template');
  }

  if (!template) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <SketchEmpty variant="search" title="Template not found" description="This template may have been deleted." />
      </div>
    );
  }

  const mandatoryCount = criteria.filter((c) => c.mandatory).length;

  return (
    <div className="flex flex-1 flex-col gap-4 p-6 overflow-auto">

      {/* ── Settings card ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Template settings</h2>
            {template.isDefault && (
              <Badge variant="outline" className="text-xs gap-1 text-primary border-primary/30">
                <StarIcon className="size-3" /> Default
              </Badge>
            )}
            <Badge variant="outline" className="text-xs capitalize">{template.source}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {!template.isDefault && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSetDefault}>
                <StarIcon className="size-3.5" /> Set as default
              </Button>
            )}
            <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={!dirty}>
              <SaveIcon className="size-3.5" /> Save
            </Button>
          </div>
        </div>
        <div className="px-5 py-4 grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="tpl-name" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</Label>
            <Input id="tpl-name" value={name} onChange={(e) => { setName(e.target.value); mark(); }} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-desc" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</Label>
            <Input id="tpl-desc" value={description} onChange={(e) => { setDescription(e.target.value); mark(); }} placeholder="Optional" className="h-9" />
          </div>
        </div>
      </div>

      {/* ── Criteria card ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-semibold">Criteria</h2>
            <span className="text-xs text-muted-foreground">
              {criteria.length} total · {mandatoryCount} mandatory
            </span>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={addCriterion}>
            <PlusIcon className="size-3.5" /> Add criterion
          </Button>
        </div>

        {criteria.length === 0 ? (
          <div className="px-5 py-10 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-muted-foreground">No criteria yet.</p>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={addCriterion}>
              <PlusIcon className="size-3.5" /> Add criterion
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {criteria.map((c, idx) => (
              <div key={c.id} className="px-5 py-4 space-y-3 hover:bg-muted/10 transition-colors">

                {/* Top row: index + type pill + mandatory toggle + delete */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground tabular-nums w-5 shrink-0 text-right select-none">
                    {idx + 1}
                  </span>
                  <TypePill type={c.type} onChange={(t) => updateCriterion(c.id, { type: t })} />
                  <div className="flex items-center gap-2 ml-auto">
                    <Switch
                      id={`m-${c.id}`}
                      checked={c.mandatory}
                      onCheckedChange={(v) => updateCriterion(c.id, { mandatory: v })}
                    />
                    <Label htmlFor={`m-${c.id}`} className="text-xs text-muted-foreground cursor-pointer select-none">
                      Mandatory
                    </Label>
                    <Button
                      variant="ghost" size="icon"
                      className="size-7 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => removeCriterion(c.id)}
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Criterion text */}
                <Textarea
                  value={c.text}
                  onChange={(e) => updateCriterion(c.id, { text: e.target.value })}
                  placeholder="Describe the criterion…"
                  rows={2}
                  className="text-sm resize-none bg-muted/20 border-muted focus:bg-background transition-colors"
                />

                {/* Threshold */}
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-muted-foreground shrink-0 w-16">Threshold</span>
                  <Input
                    value={c.threshold ?? ''}
                    onChange={(e) => updateCriterion(c.id, { threshold: e.target.value || null })}
                    placeholder="e.g. ≥ ₹10 Cr, ISO 27001, 5 years"
                    className="h-7 text-xs font-mono bg-muted/20 border-muted focus:bg-background transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Sticky save bar ── */}
      {dirty && (
        <div className="sticky bottom-0 rounded-xl border border-border bg-background/95 backdrop-blur-sm px-5 py-3 flex items-center justify-between gap-4 shadow-lg">
          <p className="text-sm text-muted-foreground">Unsaved changes</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              if (template) { setName(template.name); setDescription(template.description); setCriteria(template.criteria); setDirty(false); }
            }}>
              Discard
            </Button>
            <Button size="sm" className="gap-1.5" onClick={handleSave}>
              <SaveIcon className="size-3.5" /> Save template
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
