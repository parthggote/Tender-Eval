import { z } from 'zod';

export enum OfficerRole {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  PROCUREMENT_OFFICER = 'PROCUREMENT_OFFICER',
  REVIEW_OFFICER = 'REVIEW_OFFICER',
  COMMITTEE_MEMBER = 'COMMITTEE_MEMBER',
  AUDITOR = 'AUDITOR'
}

export enum CriterionType {
  FINANCIAL = 'FINANCIAL',
  TECHNICAL = 'TECHNICAL',
  COMPLIANCE = 'COMPLIANCE',
  CERTIFICATION = 'CERTIFICATION'
}

export enum Verdict {
  PASS = 'PASS',
  FAIL = 'FAIL',
  NEEDS_REVIEW = 'NEEDS_REVIEW'
}

export enum ReviewAction {
  ACCEPTED = 'ACCEPTED',
  OVERRIDDEN = 'OVERRIDDEN',
  ESCALATED = 'ESCALATED',
  REQUESTED_CLARIFICATION = 'REQUESTED_CLARIFICATION'
}

export enum ProcessingStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED'
}

export enum DocumentKind {
  TENDER = 'TENDER',
  BIDDER_SUBMISSION = 'BIDDER_SUBMISSION',
  CERTIFICATE = 'CERTIFICATE',
  OTHER = 'OTHER'
}

export enum ConfidenceBand {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export const AgencyWorkspaceSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  logoUrl: z.string().nullable().optional()
});
export type AgencyWorkspace = z.infer<typeof AgencyWorkspaceSchema>;

export const TenderSummarySchema = z.object({
  id: z.string(),
  agencyId: z.string(),
  title: z.string(),
  reference: z.string().nullable().optional(),
  createdAt: z.string()
});
export type TenderSummary = z.infer<typeof TenderSummarySchema>;

export const TenderDetailSchema = TenderSummarySchema.extend({
  description: z.string().nullable().optional(),
  status: z.string().optional()
});
export type TenderDetail = z.infer<typeof TenderDetailSchema>;

export const CriterionDtoSchema = z.object({
  id: z.string(),
  tenderId: z.string(),
  text: z.string(),
  type: z.nativeEnum(CriterionType),
  threshold: z.string().nullable().optional(),
  mandatory: z.boolean(),
  sourcePage: z.number().int().nullable().optional(),
  confidence: z.number().min(0).max(1).nullable().optional()
});
export type CriterionDto = z.infer<typeof CriterionDtoSchema>;

export const BidderDtoSchema = z.object({
  id: z.string(),
  tenderId: z.string(),
  name: z.string(),
  createdAt: z.string()
});
export type BidderDto = z.infer<typeof BidderDtoSchema>;

export const EvidenceDtoSchema = z.object({
  id: z.string(),
  bidderId: z.string(),
  criterionId: z.string(),
  sourceDocumentId: z.string().nullable().optional(),
  pageNumber: z.number().int().nullable().optional(),
  passage: z.string(),
  confidence: z.number().min(0).max(1)
});
export type EvidenceDto = z.infer<typeof EvidenceDtoSchema>;

export const CriterionEvaluationDtoSchema = z.object({
  id: z.string(),
  evaluationRunId: z.string(),
  bidderId: z.string(),
  criterionId: z.string(),
  verdict: z.nativeEnum(Verdict),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  evidenceId: z.string().nullable().optional()
});
export type CriterionEvaluationDto = z.infer<typeof CriterionEvaluationDtoSchema>;

export const ReviewCaseDtoSchema = z.object({
  id: z.string(),
  tenderId: z.string(),
  bidderId: z.string(),
  criterionId: z.string(),
  status: z.string(),
  reason: z.string(),
  dueAt: z.string().nullable().optional(),
  createdAt: z.string()
});
export type ReviewCaseDto = z.infer<typeof ReviewCaseDtoSchema>;

export const AuditEntryDtoSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  actorUserId: z.string().nullable().optional(),
  action: z.string(),
  payload: z.record(z.string(), z.unknown()),
  prevHash: z.string().nullable().optional(),
  hash: z.string()
});
export type AuditEntryDto = z.infer<typeof AuditEntryDtoSchema>;

export const BidderSchema = BidderDtoSchema;
export type Bidder = BidderDto;

export const CriterionSchema = CriterionDtoSchema;
export type Criterion = CriterionDto;

export const ReviewCaseSchema = ReviewCaseDtoSchema;
export type ReviewCase = ReviewCaseDto;

export const AuditEntrySchema = AuditEntryDtoSchema;
export type AuditEntry = AuditEntryDto;

export const ReportExportDtoSchema = z.object({
  id: z.string(),
  tenderId: z.string(),
  status: z.nativeEnum(ProcessingStatus),
  createdAt: z.string(),
  objectKey: z.string().nullable().optional()
});
export type ReportExportDto = z.infer<typeof ReportExportDtoSchema>;

export const EvaluationRunSchema = z.object({
  id: z.string().uuid(),
  tenderId: z.string().uuid(),
  status: z.string(),
  createdAt: z.string(),
  finishedAt: z.string().nullable().optional()
});
export type EvaluationRun = z.infer<typeof EvaluationRunSchema>;

export const CriterionEvaluationSchema = z.object({
  id: z.string().uuid(),
  evaluationRunId: z.string().uuid(),
  bidderId: z.string().uuid(),
  criterionId: z.string().uuid(),
  verdict: z.string(),
  confidence: z.number(),
  reason: z.string(),
  evidenceId: z.string().uuid().nullable().optional(),
  createdAt: z.string()
});
export type CriterionEvaluation = z.infer<typeof CriterionEvaluationSchema>;

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  kind: z.string(),
  status: z.string(),
  objectKey: z.string(),
  originalFilename: z.string().nullable().optional(),
  createdAt: z.string()
});
export type Document = z.infer<typeof DocumentSchema>;

export const JobStatusSchema = z.object({
  taskId: z.string(),
  status: z.string(),
  result: z.any().nullable().optional()
});
export type JobStatus = z.infer<typeof JobStatusSchema>;

export const SignedUrlSchema = z.object({
  url: z.string(),
  expiresAt: z.string()
});
export type SignedUrl = z.infer<typeof SignedUrlSchema>;
