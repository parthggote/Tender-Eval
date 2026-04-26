'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@workspace/ui/components/sonner';
import {
  FileIcon, CpuIcon, PlayIcon, CheckCircle2Icon, ZapIcon,
  ExternalLinkIcon, AlertCircleIcon, RefreshCwIcon,
  PanelRightCloseIcon, PanelRightOpenIcon, UploadIcon,
  CheckIcon, Loader2Icon, Trash2Icon,
} from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Progress } from '@workspace/ui/components/progress';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@workspace/ui/components/sheet';
import {
  getTenderDocuments, getTenderCriteria, getSignedUrl,
  triggerCriteriaExtraction, triggerEvaluation, getJobStatus,
  uploadTenderDocument, deleteTenderDocument,
} from '~/lib/internal-api';
import { cn } from '@workspace/ui/lib/utils';
import { TenderDocumentUpload } from '~/components/tenders/tender-document-upload';
import { SketchEmpty } from '~/components/ui/sketch-empty';
import { TenderSetupDialog } from '~/components/tenders/tender-setup-dialog';
import { TenderManagerSkeleton } from '~/components/tenders/tender-manager-skeleton';
import { templateStore, CriteriaTemplate } from '~/lib/template-store';
import { UploadPipeline } from '~/components/tenders/upload-pipeline';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@workspace/ui/components/alert-dialog';

export type TenderManagerProps = { tender: any; agencySlug: string; initialSetup?: 'upload' | 'template' };

function docStatusLabel(status: string): { label: string; variant: 'secondary' | 'destructive' | 'outline' } {
  switch (status?.toUpperCase()) {
    case 'READY': return { label: 'Ready', variant: 'secondary' };
    case 'PROCESSING': return { label: 'Processing…', variant: 'outline' };
    case 'FAILED': return { label: 'Failed', variant: 'destructive' };
    default: return { label: status ?? 'Unknown', variant: 'outline' };
  }
}

export function TenderManager({ tender, agencySlug, initialSetup }: TenderManagerProps): React.JSX.Element {
  const router = useRouter();
  const tenderId = tender.id;

  const [documents, setDocuments] = React.useState<any[]>([]);
  const [criteria, setCriteria] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [extracting, setExtracting] = React.useState(false);
  const [evaluating, setEvaluating] = React.useState(false);
  const [activeDocUrl, setActiveDocUrl] = React.useState<string | null>(null);
  const [activeDocKey, setActiveDocKey] = React.useState<string | null>(null);
  const [loadingDoc, setLoadingDoc] = React.useState(false);
  const [previewError, setPreviewError] = React.useState(false);
  const [inspectorOpen, setInspectorOpen] = React.useState(true);
  const [previewSheetOpen, setPreviewSheetOpen] = React.useState(false);
  const [previewDocName, setPreviewDocName] = React.useState<string | null>(null);
  const [setupChoice, setSetupChoice] = React.useState<'pending' | 'upload' | 'template' | 'done'>(
    initialSetup ? 'done' : 'pending'
  );
  const [pipeline, setPipeline] = React.useState<{
    status: 'uploading' | 'processing' | 'extracting' | 'done' | 'error';
    progress: number;
    label: string;
    error?: string;
  } | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      const [docs, crit] = await Promise.all([
        getTenderDocuments(tenderId),
        getTenderCriteria(tenderId),
      ]);
      setDocuments(docs);
      setCriteria(crit);
      if (docs.length > 0 || crit.length > 0) setSetupChoice('done');
      if (docs.length > 0 && !activeDocKey) {
        const { url } = await getSignedUrl(docs[0].objectKey);
        setActiveDocUrl(url);
        setActiveDocKey(docs[0].objectKey);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tenderId, activeDocKey]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  // If coming from create-tender with upload intent, auto-trigger file picker after load
  React.useEffect(() => {
    if (initialSetup === 'upload' && !loading) {
      setTimeout(() => {
        const input = document.querySelector<HTMLInputElement>('input[data-upload-trigger]');
        input?.click();
      }, 300);
    }
  }, [initialSetup, loading]);

  const pollJob = (taskId: string, type: 'extract' | 'evaluate') => {
    const interval = setInterval(async () => {
      try {
        const status = await getJobStatus(taskId);
        if (status.status === 'SUCCESS' || status.status === 'FAILURE') {
          clearInterval(interval);
          if (type === 'extract') setExtracting(false); else setEvaluating(false);
          if (status.status === 'SUCCESS') {
            toast.success(type === 'extract' ? 'Criteria extracted.' : 'Evaluation complete.');
          } else {
            toast.error(type === 'extract' ? 'Extraction failed.' : 'Evaluation failed.');
          }
          fetchData();
          router.refresh();
        }
      } catch {
        clearInterval(interval);
        if (type === 'extract') setExtracting(false); else setEvaluating(false);
        toast.error('Something went wrong.');
      }
    }, 2000);
  };

  const handleExtract = async () => {
    setExtracting(true);
    try { const { taskId } = await triggerCriteriaExtraction(tenderId); pollJob(taskId, 'extract'); }
    catch { setExtracting(false); toast.error('Could not start extraction.'); }
  };

  const handleEvaluate = async () => {
    setEvaluating(true);
    try { const { taskId } = await triggerEvaluation(tenderId); pollJob(taskId, 'evaluate'); }
    catch { setEvaluating(false); toast.error('Could not start evaluation.'); }
  };

  const handleSelectDoc = async (doc: any) => {
    setLoadingDoc(true);
    setPreviewError(false);
    setPreviewDocName(doc.originalFilename ?? doc.objectKey);
    try {
      const { url } = await getSignedUrl(doc.objectKey);
      setActiveDocUrl(url);
      setActiveDocKey(doc.objectKey);
      setPreviewSheetOpen(true);
    } catch {
      toast.error('Could not load document preview.');
      setPreviewError(true);
      setPreviewSheetOpen(true);
    } finally {
      setLoadingDoc(false);
    }
  };

  const runUploadPipeline = async (file: File) => {
    // Step 1: Upload
    setPipeline({ status: 'uploading', progress: 10, label: 'Uploading document…' });
    const tick = setInterval(() => setPipeline((p) => p ? { ...p, progress: Math.min(p.progress + 10, 85) } : p), 350);

    let documentId: string;
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('kind', 'TENDER');
      const result = await uploadTenderDocument(tenderId, fd);
      documentId = result.documentId;
      clearInterval(tick);
      setPipeline({ status: 'uploading', progress: 100, label: 'Document uploaded' });
    } catch {
      clearInterval(tick);
      setPipeline({ status: 'error', progress: 0, label: 'Upload failed', error: 'Could not upload document. Please try again.' });
      setTimeout(() => setPipeline(null), 4000);
      return;
    }

    // Step 2: Poll document status until OCR completes (replaces broken SSE)
    setPipeline({ status: 'processing', progress: 10, label: 'Processing document (OCR)…' });
    let ocrProgress = 10;
    const ocrTick = setInterval(() => {
      ocrProgress = Math.min(ocrProgress + 5, 85);
      setPipeline((p) => p ? { ...p, progress: ocrProgress } : p);
    }, 1500);

    const ocrDone = await new Promise<boolean>((resolve) => {
      const poll = setInterval(async () => {
        try {
          const docs = await getTenderDocuments(tenderId);
          const doc = docs.find((d: any) => d.id === documentId);
          if (doc?.status === 'SUCCEEDED') { clearInterval(poll); resolve(true); }
          else if (doc?.status === 'FAILED') { clearInterval(poll); resolve(false); }
        } catch { /* keep polling */ }
      }, 3000);
      // Timeout after 2 minutes
      setTimeout(() => { clearInterval(poll); resolve(true); }, 120_000);
    });

    clearInterval(ocrTick);

    if (!ocrDone) {
      setPipeline({ status: 'error', progress: 0, label: 'Processing failed', error: 'OCR failed. Please try again.' });
      setTimeout(() => setPipeline(null), 4000);
      return;
    }

    setPipeline({ status: 'processing', progress: 100, label: 'Document processed successfully' });
    await fetchData();

    // Step 3: Wait for auto-triggered criteria extraction (chained from OCR in worker)
    setPipeline({ status: 'extracting', progress: 0, label: 'Extracting criteria with AI…' });
    let extractProgress = 0;
    const extractTick = setInterval(() => {
      extractProgress = Math.min(extractProgress + 3, 88);
      setPipeline((p) => p ? { ...p, progress: extractProgress } : p);
    }, 1500);

    // Poll criteria — worker auto-chains extraction after OCR
    await new Promise<void>((resolve) => {
      const poll = setInterval(async () => {
        try {
          const crit = await getTenderCriteria(tenderId);
          if (crit.length > 0) {
            setCriteria(crit);
            clearInterval(poll);
            resolve();
          }
        } catch { /* keep polling */ }
      }, 3000);
      // Timeout after 3 minutes — resolve anyway so UI doesn't hang
      setTimeout(() => { clearInterval(poll); resolve(); }, 180_000);
    });

    clearInterval(extractTick);

    // Done
    const finalCriteria = await getTenderCriteria(tenderId);
    setCriteria(finalCriteria);
    await fetchData();

    if (finalCriteria.length > 0) {
      setPipeline({ status: 'done', progress: 100, label: `${finalCriteria.length} criteria extracted` });
      toast.success(`${finalCriteria.length} criteria extracted successfully.`);
    } else {
      setPipeline({ status: 'done', progress: 100, label: 'Document processed — no criteria found' });
      toast.success('Document processed. Click "Extract criteria" to retry.');
    }
    setTimeout(() => { setPipeline(null); setSetupChoice('done'); }, 2000);
  };

  const handleDeleteDoc = async (docId: string, objectKey: string) => {
    try {
      await deleteTenderDocument(tenderId, docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      if (activeDocKey === objectKey) {
        setActiveDocKey(null);
        setActiveDocUrl(null);
      }
      toast.success('Document removed.');
    } catch {
      toast.error('Could not remove document.');
    }
  };

  const handleRetryPreview = async () => {
    const doc = documents.find((d) => d.objectKey === activeDocKey);
    if (!doc) return;
    setPreviewError(false);
    setLoadingDoc(true);
    try { const { url } = await getSignedUrl(doc.objectKey); setActiveDocUrl(url); }
    catch { setPreviewError(true); toast.error('Could not reload document.'); }
    finally { setLoadingDoc(false); }
  };

  // Loading state — show skeleton
  if (loading) {
    return (
      <div className="relative h-full overflow-hidden">
        <TenderManagerSkeleton />
      </div>
    );
  }

  const showSetupDialog = setupChoice === 'pending' && documents.length === 0 && criteria.length === 0;

  // If coming from create-tender with template intent, show template picker directly
  const showTemplateSetup = initialSetup === 'template' && setupChoice === 'done' && documents.length === 0 && criteria.length === 0 && !loading;

  // Setup dialog state — skeleton behind, dialog on top (only when navigating directly, not from create-tender)
  if (showSetupDialog) {
    return (
      <div className="relative h-full overflow-hidden">
        <TenderManagerSkeleton />
        <TenderSetupDialog
          tenderTitle={tender.title}
          agencySlug={agencySlug}
          onChoose={(choice, template) => {
            if (choice === 'template' && template) {
              setCriteria(template.criteria.map((c) => ({
                id: c.id, tenderId, text: c.text, type: c.type,
                threshold: c.threshold, mandatory: c.mandatory,
                sourcePage: null, confidence: 1,
              })));
              toast.success(`Applied template: ${template.name}`);
              setSetupChoice('done');
            } else {
              setSetupChoice('done');
              setInspectorOpen(true);
              setTimeout(() => {
                const input = document.querySelector<HTMLInputElement>('input[data-upload-trigger]');
                input?.click();
              }, 100);
            }
          }}
        />
      </div>
    );
  }

  // Template setup — coming from create-tender with template intent
  if (showTemplateSetup) {
    return (
      <div className="relative h-full overflow-hidden">
        <TenderManagerSkeleton />
        <TenderSetupDialog
          tenderTitle={tender.title}
          agencySlug={agencySlug}
          initialView="templates"
          onChoose={(choice, template) => {
            if (choice === 'template' && template) {
              setCriteria(template.criteria.map((c) => ({
                id: c.id, tenderId, text: c.text, type: c.type,
                threshold: c.threshold, mandatory: c.mandatory,
                sourcePage: null, confidence: 1,
              })));
              toast.success(`Applied template: ${template.name}`);
            }
          }}
        />
      </div>
    );
  }
  // Normal state — full UI
  return (
    <TooltipProvider>
      <div className="flex h-full overflow-hidden">

        {/* Left: criteria workspace */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Pipeline progress bar — shown during upload/processing/extraction */}
          {pipeline && (
            <div className="border-b bg-background">
              {/* Step indicator */}
              <div className="px-6 py-2.5 flex items-center gap-3">
                {pipeline.status === 'error' ? (
                  <AlertCircleIcon className="size-4 text-destructive shrink-0" />
                ) : pipeline.status === 'done' ? (
                  <CheckIcon className="size-4 text-success shrink-0" />
                ) : (
                  <Loader2Icon className="size-4 text-primary shrink-0 animate-spin" />
                )}
                <span className={`text-sm font-medium ${pipeline.status === 'error' ? 'text-destructive' : pipeline.status === 'done' ? 'text-success' : 'text-foreground'}`}>
                  {pipeline.label}
                </span>
                {/* Step pills */}
                <div className="ml-auto flex items-center gap-1.5">
                  {(['uploading', 'processing', 'extracting'] as const).map((s) => {
                    const stepOrder = ['uploading', 'processing', 'extracting', 'done'];
                    const currentOrder = stepOrder.indexOf(pipeline.status);
                    const thisOrder = stepOrder.indexOf(s);
                    const isDone = currentOrder > thisOrder || pipeline.status === 'done';
                    const isActive = pipeline.status === s;
                    return (
                      <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                        isDone ? 'bg-success/10 text-success' :
                        isActive ? 'bg-primary/10 text-primary' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {s === 'uploading' ? 'Upload' : s === 'processing' ? 'OCR' : 'Extract'}
                      </span>
                    );
                  })}
                </div>
              </div>
              {/* Progress bar */}
              <Progress
                value={pipeline.progress}
                className={`h-0.5 rounded-none ${pipeline.status === 'error' ? '[&>div]:bg-destructive' : pipeline.status === 'done' ? '[&>div]:bg-success' : ''}`}
              />
              {pipeline.error && (
                <div className="px-6 py-2 flex items-center justify-between bg-destructive/5">
                  <p className="text-xs text-destructive">{pipeline.error}</p>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setPipeline(null)}>
                    Dismiss
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center gap-3 px-6 py-3 border-b bg-muted/30 flex-wrap">
            <Button size="sm" onClick={handleExtract} disabled={extracting || evaluating || documents.length === 0}>
              {extracting
                ? <><CpuIcon className="mr-2 size-3.5 animate-spin" />Extracting…</>
                : <><ZapIcon className="mr-2 size-3.5" />1. Extract criteria</>}
            </Button>
            <Button size="sm" variant="outline" onClick={handleEvaluate} disabled={extracting || evaluating || criteria.length === 0}>
              {evaluating
                ? <><PlayIcon className="mr-2 size-3.5 animate-spin" />Evaluating…</>
                : <><CheckCircle2Icon className="mr-2 size-3.5" />2. Run evaluation</>}
            </Button>
            {documents.length === 0 && (
              <p className="text-xs text-muted-foreground">Upload documents to enable extraction.</p>
            )}
            <div className="ml-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8"
                    onClick={() => setInspectorOpen((o) => !o)}
                    aria-label={inspectorOpen ? 'Hide document panel' : 'Show document panel'}
                  >
                    {inspectorOpen ? <PanelRightCloseIcon className="size-4" /> : <PanelRightOpenIcon className="size-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">{inspectorOpen ? 'Hide documents' : 'Show documents'}</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Criteria list */}
          <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Extracted criteria</h2>
              <Badge variant="outline" className="text-xs">
                {criteria.length} {criteria.length === 1 ? 'criterion' : 'criteria'}
              </Badge>
            </div>
            <div className="rounded-lg border overflow-hidden">
              <div className="h-[420px] overflow-y-auto divide-y divide-border">
                {/* Skeleton rows while pipeline is running */}
                {pipeline && pipeline.status !== 'done' && pipeline.status !== 'error' && (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-3 w-8 ml-auto" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className={`h-4 ${i % 2 === 0 ? 'w-3/4' : 'w-5/6'}`} />
                      <div className="flex items-center gap-2 mt-1">
                        <Skeleton className="h-1 w-24 rounded-full" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                    </div>
                  ))
                )}
                {/* Normal criteria rows */}
                {(!pipeline || pipeline.status === 'done') && criteria.map((c) => (
                  <div key={c.id} className="p-4 hover:bg-muted/40 transition-colors">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">{c.type}</Badge>
                        {c.mandatory && <Badge variant="destructive" className="text-xs">Mandatory</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground font-mono shrink-0">p.{c.sourcePage}</span>
                    </div>
                    <p className="text-sm leading-relaxed line-clamp-3">{c.text}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={Math.round(c.confidence * 100)} className="h-1 flex-1 max-w-[120px]" />
                      <span className="text-xs text-muted-foreground tabular-nums">{Math.round(c.confidence * 100)}%</span>
                    </div>
                  </div>
                ))}
                {(!pipeline || pipeline.status === 'done') && criteria.length === 0 && !extracting && (
                  <SketchEmpty variant="search" title="No criteria extracted yet" description="Upload documents and run extraction to get started." />
                )}
                {extracting && (
                  <div className="p-8 space-y-3">
                    <p className="text-sm text-muted-foreground text-center">Extracting criteria from documents…</p>
                    <Progress className="h-1" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: document list */}
        {inspectorOpen && (
          <div className="w-80 xl:w-96 shrink-0 border-l flex flex-col overflow-hidden bg-background">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-sm font-semibold">Documents</h2>
              <TenderDocumentUpload tenderId={tenderId} onUploadStart={runUploadPipeline} />
            </div>
            <div className="p-3 space-y-1.5 overflow-y-auto flex-1">
              {documents.map((doc) => {
                const isActive = doc.objectKey === activeDocKey;
                const { label, variant } = docStatusLabel(doc.status);
                return (
                  <div key={doc.id}
                    className={cn(
                      'group w-full flex items-center gap-3 p-2.5 rounded-md border text-left transition-colors',
                      isActive ? 'bg-accent border-accent-foreground/20' : 'bg-background border-border hover:bg-muted/50'
                    )}
                  >
                    {/* Clickable area */}
                    <button type="button" onClick={() => handleSelectDoc(doc)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <div className={cn('size-7 rounded-md flex items-center justify-center shrink-0',
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      )}>
                        <FileIcon className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{doc.originalFilename ?? doc.objectKey}</p>
                        <Badge variant={variant} className="text-[10px] h-4 mt-0.5">{label}</Badge>
                      </div>
                    </button>

                    {/* Delete button — visible on hover */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          type="button"
                          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground/40"
                          aria-label="Remove document"
                        >
                          <Trash2Icon className="size-3.5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove document?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete <span className="font-medium">{doc.originalFilename ?? 'this document'}</span> and its extracted pages. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDeleteDoc(doc.id, doc.objectKey)}
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                );
              })}
              {documents.length === 0 && (
                <p className="py-6 text-center text-xs text-muted-foreground">No documents uploaded yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Document preview sheet */}
        <Sheet open={previewSheetOpen} onOpenChange={setPreviewSheetOpen}>
          <SheetContent side="right" className="w-[60vw] max-w-4xl p-0 flex flex-col">
            <SheetHeader className="px-5 py-3.5 border-b shrink-0">
              <SheetTitle className="flex items-center gap-2 text-sm font-medium truncate">
                <FileIcon className="size-4 text-muted-foreground shrink-0" />
                {previewDocName ?? 'Document preview'}
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 relative overflow-hidden">
              {loadingDoc && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                  <div className="size-6 rounded-full border-2 border-muted border-t-primary animate-spin" />
                </div>
              )}
              {previewError ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                  <AlertCircleIcon className="size-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Preview unavailable</p>
                  <p className="text-xs text-muted-foreground">The document URL may have expired.</p>
                  <Button size="sm" variant="outline" onClick={handleRetryPreview}>
                    <RefreshCwIcon className="mr-2 size-3.5" /> Retry
                  </Button>
                </div>
              ) : activeDocUrl ? (
                <object data={activeDocUrl} type="application/pdf" className="w-full h-full border-0" aria-label="Document preview">
                  <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                    <FileIcon className="size-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">PDF preview not supported.</p>
                    <a href={activeDocUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline underline-offset-4">
                      Open document
                    </a>
                  </div>
                </object>
              ) : null}
            </div>
          </SheetContent>
        </Sheet>

      </div>
    </TooltipProvider>
  );
}
