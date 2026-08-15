'use client';

import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface DuplicateUploadItem {
  fileName: string;
  matchType: 'file' | 'content' | 'text';
  similarity?: number;
  newDocument: {
    id: string;
    name: string;
    originalName: string;
  };
  existingDocument: {
    id: string;
    name: string;
    originalName: string;
    fileSize: number;
    createdAt: Date | string;
    category?: { name: string } | null;
  };
}

interface DuplicateUploadDialogProps {
  duplicates: DuplicateUploadItem[];
  onKeepBoth: () => void;
  onRemoveNew: () => void;
  isRemoving?: boolean;
  labels: {
    title: string;
    description: string;
    newUploadLabel: string;
    existingLabel: string;
    uploadedOn: string;
    category: string;
    keepBoth: string;
    removeNew: string;
    sameFile: string;
    sameContent: string;
    similarContent: string;
  };
}

export function DuplicateUploadDialog({
  duplicates,
  onKeepBoth,
  onRemoveNew,
  isRemoving = false,
  labels,
}: DuplicateUploadDialogProps) {
  const matchLabel = (matchType: DuplicateUploadItem['matchType'], similarity?: number) => {
    if (matchType === 'file') return labels.sameFile;
    if (matchType === 'content') return labels.sameContent;
    return labels.similarContent.replace(
      '{percent}',
      String(Math.round((similarity || 0) * 100))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label={labels.keepBoth}
        onClick={onKeepBoth}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="duplicate-upload-title"
        className="relative w-full max-w-lg rounded-lg bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-start gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h2
              id="duplicate-upload-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              {labels.title}
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {labels.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onKeepBoth}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto p-6 space-y-3">
          {duplicates.map((duplicate) => (
            <div
              key={duplicate.newDocument.id}
              className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4"
            >
              <p className="font-medium text-gray-900 dark:text-white">
                {duplicate.fileName}
              </p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                {matchLabel(duplicate.matchType, duplicate.similarity)}
              </p>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>
                  {labels.newUploadLabel}:{' '}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {duplicate.newDocument.originalName || duplicate.newDocument.name}
                  </span>
                </p>
                <p>
                  {labels.existingLabel}:{' '}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {duplicate.existingDocument.originalName || duplicate.existingDocument.name}
                  </span>
                </p>
                <p>
                  {labels.uploadedOn}:{' '}
                  {new Date(duplicate.existingDocument.createdAt).toLocaleDateString()}
                </p>
                {duplicate.existingDocument.category?.name && (
                  <p>
                    {labels.category}: {duplicate.existingDocument.category.name}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onRemoveNew} isLoading={isRemoving}>
            {labels.removeNew}
          </Button>
          <Button variant="primary" onClick={onKeepBoth}>
            {labels.keepBoth}
          </Button>
        </div>
      </div>
    </div>
  );
}
