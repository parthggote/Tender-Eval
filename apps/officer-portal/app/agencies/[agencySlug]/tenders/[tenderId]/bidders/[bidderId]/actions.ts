'use server';

import { uploadBidderDocument } from '~/lib/internal-api';
import { revalidatePath } from 'next/cache';

export async function uploadBidderDocAction(tenderId: string, bidderId: string, formData: FormData) {
  await uploadBidderDocument(tenderId, bidderId, formData);
  revalidatePath(`/agencies/[agencySlug]/tenders/${tenderId}/bidders/${bidderId}`);
}
