'use client';

import * as React from 'react';
import { UploadIcon } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';

export function TenderDocumentUpload({ 
  tenderId, 
  onUploadStart 
}: { 
  tenderId: string;
  onUploadStart?: (file: File) => void;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (onUploadStart) {
      onUploadStart(file);
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf"
        aria-label="Upload PDF document"
      />
      <Button
        size="sm"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadIcon className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
        Upload document
      </Button>
    </>
  );
}
