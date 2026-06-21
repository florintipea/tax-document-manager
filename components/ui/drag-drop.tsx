"use client";

import { useState, useCallback, DragEvent, ChangeEvent } from "react";
import { Upload, File, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./button";

interface DragDropProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
  inputId?: string;
}

export function DragDrop({
  onFilesSelected,
  accept,
  maxFiles,
  maxSize,
  className,
  disabled,
  inputId = "file-upload",
}: DragDropProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFiles = useCallback(
    (files: File[]): File[] => {
      const validFiles: File[] = [];
      const errors: string[] = [];

      if (maxFiles && files.length > maxFiles) {
        errors.push(`Maximum ${maxFiles} file(s) allowed`);
      }

      files.forEach((file) => {
        if (maxSize && file.size > maxSize * 1024 * 1024) {
          errors.push(`${file.name} exceeds ${maxSize}MB limit`);
          return;
        }

        if (accept) {
          const acceptedTypes = accept.split(",").map((t) => t.trim());
          const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
          const fileType = file.type;

          const isAccepted =
            acceptedTypes.some(
              (type) =>
                type === fileType ||
                type === fileExtension ||
                (type.endsWith("/*") &&
                  fileType.startsWith(type.slice(0, -1)))
            );

          if (!isAccepted) {
            errors.push(`${file.name} is not an accepted file type`);
            return;
          }
        }

        validFiles.push(file);
      });

      if (errors.length > 0) {
        setError(errors.join(", "));
        setTimeout(() => setError(null), 5000);
      }

      return validFiles;
    },
    [accept, maxFiles, maxSize]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      const validFiles = validateFiles(fileArray);

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
        setError(null);
      }
    },
    [onFilesSelected, validateFiles]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      handleFiles(files);
    },
    [disabled, handleFiles]
  );

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [handleFiles]
  );

  return (
    <div className={cn("w-full", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-all",
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "hover:border-blue-400 dark:hover:border-blue-500"
        )}
      >
        <input
          type="file"
          id={inputId}
          className="hidden"
          accept={accept}
          multiple={!maxFiles || maxFiles > 1}
          onChange={handleFileInput}
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center text-center">
          <div
            className={cn(
              "p-4 rounded-full mb-4",
              isDragging
                ? "bg-blue-100 dark:bg-blue-900/40"
                : "bg-gray-100 dark:bg-gray-700"
            )}
          >
            {isDragging ? (
              <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-bounce" />
            ) : (
              <File className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            )}
          </div>

          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {isDragging
              ? "Drop files here"
              : "Drag and drop files here, or click to browse"}
          </p>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            {accept && `Accepted: ${accept}`}
            {maxSize && ` • Max size: ${maxSize}MB`}
            {maxFiles && ` • Max files: ${maxFiles}`}
          </p>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              document.getElementById(inputId)?.click();
            }}
            disabled={disabled}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Select Files
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <X className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}



