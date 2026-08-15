"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Download,
  Tag,
  Folder,
  Archive,
  X,
  CheckSquare,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface BulkActionsProps {
  selectedIds: string[];
  onDeselectAll: () => void;
  onDelete: (ids: string[]) => void;
  onDownload: (ids: string[]) => void;
  onTag: (ids: string[]) => void;
  onMove: (ids: string[]) => void;
  onArchive: (ids: string[]) => void;
  className?: string;
}

export function BulkActions({
  selectedIds,
  onDeselectAll,
  onDelete,
  onDownload,
  onTag,
  onMove,
  onArchive,
  className,
}: BulkActionsProps) {
  const [showActions, setShowActions] = useState(true);

  if (selectedIds.length === 0) return null;

  const handleAction = (action: (ids: string[]) => void) => {
    action(selectedIds);
    onDeselectAll();
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50",
        "bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700",
        "p-4 flex items-center gap-3",
        className
      )}
    >
      <div className="flex items-center gap-2 mr-2">
        <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <span className="font-medium text-gray-900 dark:text-white">
          {selectedIds.length} selected
        </span>
      </div>

      <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAction(onDownload)}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Download
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAction(onTag)}
          leftIcon={<Tag className="w-4 h-4" />}
        >
          Tag
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAction(onMove)}
          leftIcon={<Folder className="w-4 h-4" />}
        >
          Move
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAction(onArchive)}
          leftIcon={<Archive className="w-4 h-4" />}
        >
          Archive
        </Button>

        <div className="border-l border-gray-200 dark:border-gray-700 pl-3">
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleAction(onDelete)}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Delete
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDeselectAll}
          leftIcon={<X className="w-4 h-4" />}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

// Multi-select checkbox component
interface MultiSelectCheckboxProps {
  isSelected: boolean;
  onToggle: () => void;
  indeterminate?: boolean;
  className?: string;
}

export function MultiSelectCheckbox({
  isSelected,
  onToggle,
  indeterminate,
  className,
}: MultiSelectCheckboxProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-5 h-5 border-2 rounded flex items-center justify-center transition-colors",
        isSelected || indeterminate
          ? "bg-blue-600 border-blue-600 text-white"
          : "border-gray-300 dark:border-gray-600 hover:border-blue-500",
        className
      )}
      aria-checked={isSelected}
      role="checkbox"
    >
      {indeterminate ? (
        <div className="w-3 h-0.5 bg-white" />
      ) : isSelected ? (
        <CheckSquare className="w-4 h-4" />
      ) : (
        <Square className="w-4 h-4 opacity-0" />
      )}
    </button>
  );
}

// Select all checkbox
interface SelectAllCheckboxProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function SelectAllCheckbox({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
}: SelectAllCheckboxProps) {
  const allSelected = selectedCount === totalCount && totalCount > 0;
  const someSelected = selectedCount > 0 && selectedCount < totalCount;

  const handleToggle = () => {
    if (allSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  };

  return (
    <MultiSelectCheckbox
      isSelected={allSelected}
      indeterminate={someSelected}
      onToggle={handleToggle}
    />
  );
}



