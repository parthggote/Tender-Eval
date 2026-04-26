'use server';

import { createHmac } from 'crypto';
import { z } from 'zod';
import { dedupedAuth } from '@workspace/auth';
import {
  AgencyWorkspaceSchema,
  TenderSummarySchema,
  BidderSchema,
  EvaluationRunSchema,
  CriterionEvaluationSchema,
  DocumentSchema,
  JobStatusSchema,
  SignedUrlSchema,
  ReportExportDtoSchema,
  CriterionSchema,
  ReviewCaseSchema,
  AuditEntrySchema
} from '@workspace/dtos';
import type {
  AgencyWorkspace,
  AuditEntry,
  Bidder,
  Criterion,
  ReviewCase,
  TenderSummary,
  EvaluationRun,
  CriterionEvaluation,
  Document,
  JobStatus,
  SignedUrl,
  ReportExportDto
} from '@workspace/dtos';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_INTERNAL_API_URL || 'http://localhost:8000'}/api/v1`;

async function fetchInternal<T>(
  path: string,
  options: RequestInit = {},
  schema?: z.ZodType<T>
): Promise<T> {
  const session = await dedupedAuth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  // Header security context (shared secret with backend)
  const timestamp = Date.now().toString();
  const signature = createHmac('sha256', process.env.AUTH_SECRET || 'dev-secret')
    .update(`${session.user.id}.${timestamp}`)
    .digest('hex');

  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      'X-User-Id': session.user.id,
      'X-User-Timestamp': timestamp,
      'X-User-Signature': signature
    }
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Internal API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  if (schema) {
    return schema.parse(data);
  }
  return data as T;
}

export async function getAgenciesForCurrentUser(): Promise<AgencyWorkspace[]> {
  return fetchInternal('/agencies', {}, z.array(AgencyWorkspaceSchema));
}

export async function getTendersForAgency(agencySlug: string): Promise<TenderSummary[]> {
  return fetchInternal(`/agencies/${agencySlug}/tenders`, {}, z.array(TenderSummarySchema));
}

export async function createTender(agencySlug: string, data: { title: string, reference?: string, description?: string }): Promise<TenderSummary> {
  return fetchInternal(`/agencies/${agencySlug}/tenders`, {
    method: 'POST',
    body: JSON.stringify(data)
  }, TenderSummarySchema);
}

export async function getTender(tenderId: string): Promise<TenderSummary> {
  return fetchInternal(`/tenders/${tenderId}`, {}, TenderSummarySchema);
}

export async function getTenderDocuments(tenderId: string): Promise<Document[]> {
  return fetchInternal(`/tenders/${tenderId}/documents`, {}, z.array(DocumentSchema));
}

export async function getTendersBidders(tenderId: string): Promise<Bidder[]> {
  return fetchInternal(`/tenders/${tenderId}/bidders`, {}, z.array(BidderSchema));
}

export async function createBidder(tenderId: string, name: string): Promise<Bidder> {
  return fetchInternal(`/tenders/${tenderId}/bidders`, {
    method: 'POST',
    body: JSON.stringify({ name })
  }, BidderSchema);
}

export async function getBidderDocuments(tenderId: string, bidderId: string): Promise<Document[]> {
  return fetchInternal(`/tenders/${tenderId}/bidders/${bidderId}/documents`, {}, z.array(DocumentSchema));
}

export async function getTenderCriteria(tenderId: string): Promise<Criterion[]> {
  return fetchInternal(`/tenders/${tenderId}/criteria`, {}, z.array(CriterionSchema));
}

export async function triggerCriteriaExtraction(tenderId: string): Promise<{ extractionRunId: string, taskId: string }> {
  return fetchInternal(`/tenders/${tenderId}/criteria/extract`, { method: 'POST' });
}

export async function updateCriterion(tenderId: string, criterionId: string, data: any): Promise<Criterion> {
  return fetchInternal(`/tenders/${tenderId}/criteria/${criterionId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }, CriterionSchema);
}

export async function deleteCriterion(tenderId: string, criterionId: string): Promise<void> {
  await fetchInternal(`/tenders/${tenderId}/criteria/${criterionId}`, { method: 'DELETE' });
}

export async function triggerEvaluation(tenderId: string): Promise<{ evaluation_run_id: string, taskId: string }> {
  return fetchInternal(`/tenders/${tenderId}/evaluate`, { method: 'POST' });
}

export async function getEvaluationRuns(tenderId: string): Promise<EvaluationRun[]> {
  return fetchInternal(`/tenders/${tenderId}/evaluation-runs`, {}, z.array(EvaluationRunSchema));
}

export async function getEvaluationResults(tenderId: string, runId: string): Promise<CriterionEvaluation[]> {
  return fetchInternal(`/tenders/${tenderId}/evaluation-runs/${runId}/results`, {}, z.array(CriterionEvaluationSchema));
}

export async function getReviewQueue(agencySlug: string): Promise<ReviewCase[]> {
  return fetchInternal(`/agencies/${agencySlug}/review-queue`, {}, z.array(ReviewCaseSchema));
}

export async function decideReviewCase(caseId: string, decision: any): Promise<void> {
  await fetchInternal(`/review-cases/${caseId}/decision`, {
    method: 'POST',
    body: JSON.stringify(decision)
  });
}

export async function getAuditLogs(agencySlug: string): Promise<AuditEntry[]> {
  return fetchInternal(`/agencies/${agencySlug}/audit-log`, {}, z.array(AuditEntrySchema));
}

export async function exportReport(tenderId: string): Promise<ReportExportDto> {
  return fetchInternal(`/tenders/${tenderId}/reports/export`, { method: 'POST' }, ReportExportDtoSchema);
}

export async function getReports(agencySlug: string): Promise<ReportExportDto[]> {
  return fetchInternal(`/agencies/${agencySlug}/reports`, {}, z.array(ReportExportDtoSchema));
}

export async function getJobStatus(taskId: string): Promise<JobStatus> {
  return fetchInternal(`/jobs/${taskId}`, {}, JobStatusSchema);
}

export async function getSignedUrl(objectKey: string): Promise<SignedUrl> {
  return fetchInternal(`/documents/${encodeURIComponent(objectKey)}/signed-url`, {}, SignedUrlSchema);
}

export async function uploadTenderDocument(tenderId: string, formData: FormData): Promise<{ documentId: string; objectKey: string }> {
  console.log(`[internal-api] Uploading tender document for ${tenderId}`);
  const session = await dedupedAuth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const timestamp = Date.now().toString();
  const signature = createHmac('sha256', process.env.AUTH_SECRET || 'dev-secret')
    .update(`${session.user.id}.${timestamp}`)
    .digest('hex');

  const url = `${API_BASE_URL}/tenders/${tenderId}/documents`;
  console.log(`[internal-api] Fetching ${url}`);
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      'X-User-Id': session.user.id,
      'X-User-Timestamp': timestamp,
      'X-User-Signature': signature
    }
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[internal-api] Upload failed (${response.status}): ${text}`);
    throw new Error(`Upload failed: ${text}`);
  }
  console.log(`[internal-api] Upload successful`);
  return response.json() as Promise<{ documentId: string; objectKey: string }>;
}



export async function uploadBidderDocument(tenderId: string, bidderId: string, formData: FormData): Promise<void> {
  const session = await dedupedAuth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const timestamp = Date.now().toString();
  const signature = createHmac('sha256', process.env.AUTH_SECRET || 'dev-secret')
    .update(`${session.user.id}.${timestamp}`)
    .digest('hex');

  const response = await fetch(`${API_BASE_URL}/tenders/${tenderId}/bidders/${bidderId}/documents`, {
    method: 'POST',
    body: formData,
    headers: {
      'X-User-Id': session.user.id,
      'X-User-Timestamp': timestamp,
      'X-User-Signature': signature
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload failed: ${text}`);
  }
}

export async function updateAgency(agencySlug: string, formData: FormData): Promise<AgencyWorkspace> {
  const session = await dedupedAuth();
  if (!session?.user?.id) throw new Error('Not authenticated');

  const timestamp = Date.now().toString();
  const signature = createHmac('sha256', process.env.AUTH_SECRET || 'dev-secret')
    .update(`${session.user.id}.${timestamp}`)
    .digest('hex');

  const response = await fetch(`${API_BASE_URL}/agencies/${agencySlug}`, {
    method: 'PATCH',
    headers: {
      'X-User-Id': session.user.id,
      'X-User-Timestamp': timestamp,
      'X-User-Signature': signature,
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Failed to update agency');
  }
  return AgencyWorkspaceSchema.parse(await response.json());
}
