'use client';

import * as React from 'react';
import {
  UploadIcon, LayoutTemplateIcon, SparklesIcon,
  ArrowLeftIcon, SearchIcon, CheckCircle2Icon, StarIcon,
} from 'lucide-react';
import { Input } from '@workspace/ui/components/input';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { templateStore, CriteriaTemplate } from '~/lib/template-store';
import { TYPE_COLORS } from '~/components/ui/criteria-card';

type TenderSetupDialogProps = {
  tenderTitle: string;
  agencySlug: string;
  onChoose: (choice: 'upload' | 'template', template?: CriteriaTemplate) => void;
};

export function TenderSetupDialog({ tenderTitle, agencySlug, onChoose }: TenderSetupDialogProps) {
  const [view, setView] = React.useState<'choice' | 'templates'>('choice');
  const [templates, setTemplates] = React.useState<CriteriaTemplate[]>([]);
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (view === 'templates') {
      setTemplates(templateStore.list(agencySlug));
    }
  }, [view, agencySlug]);

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase()) ||
    t.description.toLowerCase().includes(query.toLowerCase())
  );

  const selectedTemplate = templates.find((t) => t.id === selected) ?? null;

  if (view === 'templates') {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
        <div className="w-full max-w-xl mx-4 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">

          {/* Header */}
          <div className="px-6 py-5 border-b border-border flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setView('choice'); setSelected(null); setQuery(''); }}
              className="size-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors shrink-0"
            >
              <ArrowLeftIcon className="size-4 text-muted-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold">Choose a template</h2>
              <p className="text-xs text-muted-foreground truncate">for {tenderTitle}</p>
            </div>
          </div>

          {/* Search */}
          <div className="px-6 py-3 border-b border-border">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search templates…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Template list */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filtered.length === 0 ? (
              <div className="px-6 py-10 text-center space-y-2">
                <LayoutTemplateIcon className="size-8 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {templates.length === 0 ? 'No templates saved yet.' : 'No templates match your search.'}
                </p>
                {templates.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Go to Templates in the sidebar to create one.
                  </p>
                )}
              </div>
            ) : (
              filtered.map((t) => {
                const isSelected = selected === t.id;
                const typeCounts = t.criteria.reduce<Record<string, number>>((acc, c) => {
                  acc[c.type] = (acc[c.type] ?? 0) + 1;
                  return acc;
                }, {});
                const mandatoryCount = t.criteria.filter((c) => c.mandatory).length;

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelected(isSelected ? null : t.id)}
                    className={`w-full flex items-start gap-4 px-6 py-4 text-left transition-colors ${
                      isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/40'
                    }`}
                  >
                    {/* Selection indicator */}
                    <div className={`mt-0.5 size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'border-primary bg-primary' : 'border-border'
                    }`}>
                      {isSelected && <CheckCircle2Icon className="size-3 text-primary-foreground" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{t.name}</span>
                        {t.isDefault && <StarIcon className="size-3 text-primary shrink-0" />}
                        <Badge variant="outline" className="text-xs capitalize ml-auto shrink-0">{t.source}</Badge>
                      </div>
                      {t.description && (
                        <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{t.criteria.length} criteria</span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2Icon className="size-3 text-success" />
                          {mandatoryCount} mandatory
                        </span>
                      </div>
                      {Object.keys(typeCounts).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(typeCounts).map(([type, count]) => (
                            <span key={type} className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[type] ?? 'bg-muted text-muted-foreground'}`}>
                              {type.charAt(0) + type.slice(1).toLowerCase()} · {count}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {selected ? `1 template selected` : 'Select a template to continue'}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setView('choice')}>Back</Button>
              <Button
                size="sm"
                disabled={!selected}
                onClick={() => selectedTemplate && onChoose('template', selectedTemplate)}
              >
                Apply template
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default choice view
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-7 pt-7 pb-5 text-center space-y-2">
          <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <SparklesIcon className="size-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight">Set up criteria extraction</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            How would you like to extract evaluation criteria for{' '}
            <span className="font-medium text-foreground">{tenderTitle}</span>?
          </p>
        </div>

        {/* Options */}
        <div className="px-7 pb-7 grid sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onChoose('upload')}
            className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-background p-5 text-left hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm transition-all"
          >
            <div className="size-10 rounded-lg bg-muted flex items-center justify-center border border-border group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
              <UploadIcon className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">Upload documents</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Upload tender PDFs and let AI extract criteria automatically.
              </p>
            </div>
            <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              AI extraction →
            </span>
          </button>

          <button
            type="button"
            onClick={() => setView('templates')}
            className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-background p-5 text-left hover:border-violet-400/40 hover:bg-violet-500/5 hover:shadow-sm transition-all"
          >
            <div className="size-10 rounded-lg bg-muted flex items-center justify-center border border-border group-hover:bg-violet-500/10 group-hover:border-violet-400/20 transition-colors">
              <LayoutTemplateIcon className="size-5 text-muted-foreground group-hover:text-violet-600 transition-colors" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">Use a template</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Apply a saved criteria template — no document upload required.
              </p>
            </div>
            <span className="text-xs font-medium text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity">
              Browse templates →
            </span>
          </button>
        </div>

        <div className="px-7 pb-6 text-center">
          <p className="text-xs text-muted-foreground">
            You can always add documents or switch templates later.
          </p>
        </div>
      </div>
    </div>
  );
}
