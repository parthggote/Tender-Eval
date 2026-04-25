'use client';

import * as React from 'react';
import { UploadIcon } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { uploadBidderDocAction } from './actions';

export function BidderDocumentUpload({ tenderId, bidderId }: { tenderId: string, bidderId: string }) {
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('kind', 'BIDDER_SUBMISSION');

    try {
      setUploading(true);
      await uploadBidderDocAction(tenderId, bidderId, formData);
    } catch (error) {
      console.error(error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf"
        disabled={uploading}
      />
      <Button
        size="sm"
        variant="outline"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadIcon className={`mr-2 h-4 w-4 ${uploading ? 'animate-spin' : ''}`} />
        {uploading ? 'Uploading...' : 'Upload Document'}
      </Button>
    </div>
  );
}
