import * as React from 'react';
import Link from 'next/link';
import { getTendersForAgency, getTenderCriteria } from '~/lib/internal-api';
import { FileTextIcon, ArrowRightIcon } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { PageHeader } from '~/components/layout/page-header';
import { SketchEmpty } from '~/components/ui/sketch-empty';
import { CriteriaCard } from '~/components/ui/criteria-card';
import { replaceAgencySlug, replaceTenderId, routes } from '@workspace/routes';
export default async function CriteriaPage({
  params,
}: {
  params: Promise<{ agencySlug: string }>;
}): Promise<React.JSX.Element> {
  const { agencySlug } = await params;
  const tenders = await getTendersForAgency(agencySlug);

  return (
    <>
      <PageHeader breadcrumbs={[{ label: 'Criteria' }]} />
      <div className="flex flex-1 flex-col gap-6 p-6 overflow-auto">
        <div>
          <h1 className="text-lg font-semibold">Criteria</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Extracted evaluation criteria templates, one per tender.
          </p>
        </div>

        {tenders.length === 0 ? (
          <SketchEmpty
            variant="search"
            title="No criteria yet"
            description="Create a tender and run extraction to see criteria here."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tenders.map(async (tender) => {
              const criteria = await getTenderCriteria(tender.id);
              const mandatoryCount = criteria.filter((c) => c.mandatory).length;
              const avgConfidence = criteria.length
                ? criteria.reduce((s, c) => s + (c.confidence ?? 0), 0) / criteria.length * 100
                : undefined;
              const typeCounts = criteria.reduce<Record<string, number>>((acc, c) => {
                acc[c.type] = (acc[c.type] ?? 0) + 1;
                return acc;
              }, {});
              const href = replaceTenderId(
                replaceAgencySlug(routes.portal.agencies.agencySlug.criteriaDetail, agencySlug),
                tender.id
              );

              return (
                <CriteriaCard
                  key={tender.id}
                  icon={<FileTextIcon className="size-4 text-muted-foreground" />}
                  title={tender.title}
                  subtitle={`${tender.id.split('-')[0].toUpperCase()}${tender.reference ? ` · ${tender.reference}` : ''}`}
                  criteriaCount={criteria.length}
                  mandatoryCount={mandatoryCount}
                  typeCounts={typeCounts}
                  avgConfidence={avgConfidence}
                  sourceBadge="AI extracted"
                  date={tender.createdAt}
                  footerRight={
                    <Button asChild variant="outline" size="sm" className="gap-1.5 flex-1">
                      <Link href={href}>
                        View criteria <ArrowRightIcon className="size-3.5" />
                      </Link>
                    </Button>
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
