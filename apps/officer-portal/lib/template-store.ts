'use client';

import { CriterionType } from '@workspace/dtos';

export type TemplateCriterion = {
  id: string;
  text: string;
  type: CriterionType;
  threshold: string | null;
  mandatory: boolean;
};

export type CriteriaTemplate = {
  id: string;
  name: string;
  description: string;
  agencySlug: string;
  isDefault: boolean;
  source: 'manual' | 'ai' | 'upload';
  createdAt: string;
  criteria: TemplateCriterion[];
};

const STORAGE_KEY = 'tendereval:criteria-templates';

function load(agencySlug: string): CriteriaTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: CriteriaTemplate[] = raw ? JSON.parse(raw) : [];
    return all.filter((t) => t.agencySlug === agencySlug);
  } catch {
    return [];
  }
}

function saveAll(templates: CriteriaTemplate[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Merge with templates from other agencies
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: CriteriaTemplate[] = raw ? JSON.parse(raw) : [];
    const otherAgencies = all.filter((t) => !templates.some((n) => n.agencySlug === t.agencySlug));
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...otherAgencies, ...templates]));
  } catch {}
}

export const templateStore = {
  list(agencySlug: string): CriteriaTemplate[] {
    return load(agencySlug);
  },

  get(agencySlug: string, id: string): CriteriaTemplate | null {
    return load(agencySlug).find((t) => t.id === id) ?? null;
  },

  getDefault(agencySlug: string): CriteriaTemplate | null {
    return load(agencySlug).find((t) => t.isDefault) ?? null;
  },

  save(template: CriteriaTemplate): void {
    const all = load(template.agencySlug).filter((t) => t.id !== template.id);
    saveAll([...all, template]);
  },

  setDefault(agencySlug: string, id: string): void {
    const all = load(agencySlug).map((t) => ({ ...t, isDefault: t.id === id }));
    saveAll(all);
  },

  delete(agencySlug: string, id: string): void {
    const all = load(agencySlug).filter((t) => t.id !== id);
    saveAll(all);
  },

  create(agencySlug: string, data: Omit<CriteriaTemplate, 'id' | 'createdAt' | 'agencySlug'>): CriteriaTemplate {
    const template: CriteriaTemplate = {
      ...data,
      id: crypto.randomUUID(),
      agencySlug,
      createdAt: new Date().toISOString(),
    };
    const all = load(agencySlug);
    saveAll([...all, template]);
    return template;
  },
};
