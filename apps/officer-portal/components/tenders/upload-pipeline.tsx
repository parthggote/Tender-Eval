'use client';

import * as React from 'react';
import {
  UploadIcon, ScanIcon, CpuIcon, CheckCircle2Icon,
  XCircleIcon, Loader2Icon, FileIcon, FileTextIcon,
} from 'lucide-react';
import { Progress } from '@workspace/ui/components/progress';
import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import { uploadTenderDocument, triggerCriteriaExtraction, getJobStatus } from '~/lib/internal-api';
import { toast } from '@workspace/ui/components/sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PipelineStatus = 'idle' | 'uploading' | 'processing' | 'extracting' | 'done' | 'error';

type StepState = 'pending' | 'active' | 'done' | 'error';

type StepInfo = {
  id: PipelineStatus;
  label: string;
  icon: React.ElementType;
};

const STEPS: StepInfo[] = [
  { id: 'uploading',  label: 'Upload document',     icon: UploadIcon },
  { id: 'processing', label: 'OCR & text extraction', icon: ScanIcon },
  { id: 'extracting', label: 'Extract criteria',    icon: CpuIcon },
  { id: 'done',       label: 'Criteria ready',      icon: CheckCircle2Icon },
];

function getStepState(stepId: PipelineStatus, current: PipelineStatus, hasError: boolean): StepState {
  const order: PipelineStatus[] = ['uploading', 'processing', 'extracting', 'done'];
  const stepIdx = order.indexOf(stepId);
  const curIdx  = order.indexOf(current);

  if (hasError && current === stepId) return 'error';
  if (curIdx > stepIdx || current === 'done') return 'done';
  if (current === stepId) return 'active';
  return 'pending';
}

// ─── Sub-message log ──────────────────────────────────────────────────────────

type LogEntry = { id: number; text: string };

function useLog() {
  const [entries, setEntries] = React.useState<LogEntry[]>([]);
  const counter = React.useRef(0);
  const add = React.useCallback((text: string) => {
    setEntries((prev) => [...prev.slice(-6), { id: ++counter.current, text }]);
  }, []);
  const clear = React.useCallback(() => setEntries([]), []);
  return { entries, add, clear };
}

// ─── Component ────────────────────────────────────────────────────────────────

type UploadPipelineProps = {
  tenderId: string;
  onComplete: () => void;
};

export function UploadPipeline({ tenderId, onComplete }: UploadPipelineProps) {
  const [status, setStatus]               = React.useState<PipelineStatus>('idle');
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [ocrProgress, setOcrProgress]     = React.useState(0);
  const [errorMsg, setErrorMsg]           = React.useState<string | null>(null);
  const [fileName, setFileName]           = React.useState<string | null>(null);
  const [pageCount, setPageCount]         = React.useState<number | null>(null);
  const [criteriaCount, setCriteriaCount] = React.useState<number | null>(null);
  const log = useLog();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const esRef = React.useRef<EventSource | null>(null);

  // Cleanup SSE on unmount
  React.useEffect(() => () => { esRef.current?.close(); }, []);

  async function handleFile(file: File) {
    setFileName(file.name);
    setErrorMsg(null);
    setPageCount(null);
    setCriteriaCount(null);
    log.clear();

    // ── Step 1: Upload ──────────────────────────────────────────────────────
    setStatus('uploading');
    setUploadProgress(0);
    log.add('Preparing file for upload…');

    const progressInterval = setInterval(() => {
      setUploadProgress((p) => (p < 80 ? p + 15 : p));
    }, 300);

    let documentId: string;
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', 'TENDER');
      log.add(`Uploading ${file.name} (${(file.size / 1024).toFixed(0)} KB)…`);
      const result = await uploadTenderDocument(tenderId, formData);
      documentId = result.documentId;
      clearInterval(progressInterval);
      setUploadProgress(100);
      log.add('File uploaded successfully.');
    } catch {
      clearInterval(progressInterval);
      setStatus('error');
      setErrorMsg('Upload failed. Please try again.');
      return;
    }

    // ── Step 2: OCR via SSE ─────────────────────────────────────────────────
    setStatus('processing');
    setOcrProgress(5);
    log.add('Connecting to processing pipeline…');

    await new Promise<void>((resolve, reject) => {
      const es = new EventSource(
        `/api/tenders/${tenderId}/documents/${documentId}/status-stream`
      );
      esRef.current = es;

      es.addEventListener('step_update', (e) => {
        const data = JSON.parse(e.data) as {
          step: string; message: string; progress: number; pageCount?: number;
        };
        log.add(data.message);
        setOcrProgress(data.progress);
        if (data.pageCount !== undefined) setPageCount(data.pageCount);
      });

      es.addEventListener('done', (e) => {
        const data = JSON.parse(e.data) as { pageCount: number; ocrConfidence?: number };
        setPageCount(data.pageCount);
        setOcrProgress(100);
        log.add(`OCR complete — ${data.pageCount} page(s) extracted.`);
        es.close();
        esRef.current = null;
        resolve();
      });

      es.addEventListener('error', (e) => {
        const msg = e instanceof MessageEvent
          ? (JSON.parse(e.data) as { message: string }).message
          : 'Processing error.';
        log.add(`Error: ${msg}`);
        es.close();
        esRef.current = null;
        reject(new Error(msg));
      });

      // Fallback timeout
      setTimeout(() => {
        if (esRef.current) {
          es.close();
          esRef.current = null;
          resolve(); // proceed anyway
        }
      }, 90_000);
    }).catch((err: Error) => {
      setStatus('error');
      setErrorMsg(err.message || 'OCR processing failed.');
    });

    if (status === 'error') return;

    // ── Step 3: Extract criteria ────────────────────────────────────────────
    setStatus('extracting');
    log.add('Starting AI criteria extraction…');

    let taskId: string;
    try {
      const result = await triggerCriteriaExtraction(tenderId);
      taskId = result.taskId;
      log.add('Extraction task queued, waiting for AI…');
    } catch {
      setStatus('error');
      setErrorMsg('Could not start criteria extraction.');
      return;
    }

    const extractionOk = await new Promise<boolean>((resolve) => {
      const poll = setInterval(async () => {
        try {
          const job = await getJobStatus(taskId);
          if (job.status === 'SUCCESS') {
            clearInterval(poll);
            const count = (job.result as { criteriaCount?: number } | null)?.criteriaCount;
            if (count !== undefined) setCriteriaCount(count);
            resolve(true);
          } else if (job.status === 'FAILURE') {
            clearInterval(poll);
            resolve(false);
          } else {
            log.add(`AI processing… (${job.status.toLowerCase()})`);
          }
        } catch {
          clearInterval(poll);
          resolve(false);
        }
      }, 2500);
      setTimeout(() => { clearInterval(poll); resolve(true); }, 120_000);
    });

    if (!extractionOk) {
      setStatus('error');
      setErrorMsg('Criteria extraction failed. Please try again.');
      return;
    }

    // ── Done ────────────────────────────────────────────────────────────────
    setStatus('done');
    log.add('All steps complete.');
    toast.success('Criteria extracted successfully.');
    setTimeout(() => onComplete(), 1400);
  }

  const isRunning = status !== 'idle' && status !== 'done' && status !== 'error';
  const hasError  = status === 'error';

  return (
    <div className="flex flex-col h-full items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">

        {/* Drop zone */}
        {status === 'idle' && (
          <div
            className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-10 text-center space-y-4 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
          >
            <div className="size-14 rounded-xl bg-muted flex items-center justify-center mx-auto border border-border group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
              <UploadIcon className="size-7 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div>
              <p className="text-sm font-semibold">Drop your tender document here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse — PDF only</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>
        )}

        {/* Pipeline steps */}
        {status !== 'idle' && (
          <div className="space-y-1">
            {/* File badge */}
            {fileName && (
              <div className="flex items-center gap-2 px-1 mb-5 p-2.5 rounded-lg bg-muted/40 border border-border">
                <FileTextIcon className="size-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium truncate flex-1">{fileName}</span>
                {pageCount !== null && (
                  <span className="text-xs text-muted-foreground shrink-0">{pageCount}p</span>
                )}
              </div>
            )}

            {STEPS.map((step, i) => {
              const state = getStepState(step.id, status, hasError);
              const isActive = state === 'active';
              const isDone   = state === 'done';
              const isError  = state === 'error';

              return (
                <div key={step.id}>
                  <div className="flex items-start gap-3 py-2.5">
                    {/* Indicator */}
                    <div className={cn(
                      'size-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300',
                      isDone  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400' :
                      isActive ? 'bg-primary/10 border-primary text-primary' :
                      isError  ? 'bg-destructive/10 border-destructive text-destructive' :
                      'bg-muted border-border text-muted-foreground'
                    )}>
                      {isDone ? (
                        <CheckCircle2Icon className="size-4" />
                      ) : isActive ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : isError ? (
                        <XCircleIcon className="size-4" />
                      ) : (
                        <step.icon className="size-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn(
                          'text-sm font-medium',
                          isDone  ? 'text-emerald-600 dark:text-emerald-400' :
                          isActive ? 'text-foreground' :
                          isError  ? 'text-destructive' :
                          'text-muted-foreground'
                        )}>
                          {step.label}
                        </p>
                        {/* Inline metadata */}
                        {isDone && step.id === 'processing' && pageCount !== null && (
                          <span className="text-xs text-muted-foreground">{pageCount} pages</span>
                        )}
                        {isDone && step.id === 'extracting' && criteriaCount !== null && (
                          <span className="text-xs text-muted-foreground">{criteriaCount} criteria</span>
                        )}
                      </div>

                      {/* Upload progress bar */}
                      {isActive && step.id === 'uploading' && (
                        <Progress value={uploadProgress} className="h-1 mt-2 max-w-[220px]" />
                      )}

                      {/* OCR progress bar */}
                      {isActive && step.id === 'processing' && (
                        <Progress value={ocrProgress} className="h-1 mt-2 max-w-[220px]" />
                      )}

                      {/* Error message */}
                      {isError && errorMsg && (
                        <p className="text-xs text-destructive mt-0.5">{errorMsg}</p>
                      )}
                    </div>
                  </div>

                  {/* Connector */}
                  {i < STEPS.length - 1 && (
                    <div className={cn(
                      'ml-[15px] w-0.5 h-3 transition-colors duration-300',
                      isDone ? 'bg-emerald-500/40' : 'bg-border'
                    )} />
                  )}
                </div>
              );
            })}

            {/* Live log */}
            {isRunning && log.entries.length > 0 && (
              <div className="mt-4 rounded-lg bg-muted/30 border border-border p-3 space-y-1 font-mono">
                {log.entries.map((e) => (
                  <p key={e.id} className="text-[11px] text-muted-foreground leading-relaxed truncate">
                    <span className="text-primary/60 mr-1.5">›</span>{e.text}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Retry */}
        {status === 'error' && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              setStatus('idle');
              setFileName(null);
              setErrorMsg(null);
              setUploadProgress(0);
              setOcrProgress(0);
              log.clear();
            }}
          >
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
