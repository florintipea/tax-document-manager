"use client";

import { LucideIcon, Upload } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  illustration?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  illustration,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {illustration ? (
        <div className="mb-6">{illustration}</div>
      ) : Icon ? (
        <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
          <Icon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
        </div>
      ) : null}

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6">
        {description}
      </p>

      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function EmptyDocuments({ onUpload }: { onUpload?: () => void }) {
  return (
    <EmptyState
      icon={Upload}
      title="No documents yet"
      description="Upload your first tax document to get started. We'll help you organize and analyze it with AI."
      action={
        onUpload
          ? {
              label: "Upload Document",
              onClick: onUpload,
            }
          : undefined
      }
    />
  );
}

export function EmptySearch() {
  return (
    <EmptyState
      title="No results found"
      description="Try adjusting your search terms or filters to find what you're looking for."
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      title="All caught up!"
      description="You don't have any notifications right now."
    />
  );
}
