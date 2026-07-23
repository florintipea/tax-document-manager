"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { DragDrop } from "@/components/ui/drag-drop";
import { AdvancedSearch } from "@/components/search/advanced-search";
import { BulkActions, SelectAllCheckbox, MultiSelectCheckbox } from "@/components/documents/bulk-actions";
import { EmptyDocuments } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { FileText, Upload, Trash2, Download, Eye, Camera, RefreshCw, ClipboardCheck } from "lucide-react";
import toast from "react-hot-toast";
import type { Document, DocumentCategory } from "@/lib/types";
import { openDocumentFile, downloadDocumentFile } from "@/lib/utils/document-client";
import { uploadLimits } from "@/lib/utils/documents";
import { CameraScanner } from "@/components/documents/camera-scanner";
import {
  DuplicateUploadDialog,
  type DuplicateUploadItem,
} from "@/components/documents/duplicate-upload-dialog";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { useI18n } from "@/lib/i18n/provider";

export default function DocumentsPage() {
  const { status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [showCamera, setShowCamera] = useState(false);
  const [duplicateDialog, setDuplicateDialog] = useState<DuplicateUploadItem[] | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
    enabled: status === "authenticated",
  });

  const categories: DocumentCategory[] = categoriesData?.categories || [];
  const categoryNames = useMemo(
    () => categories.map((category) => category.name),
    [categories]
  );

  const categoryIdByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const category of categories) {
      map.set(category.name, category.id);
    }
    return map;
  }, [categories]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["documents", filters, categories],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.year) params.append("year", String(filters.year));
      if (filters.category) {
        const categoryId = categoryIdByName.get(filters.category);
        if (categoryId) params.append("categoryId", categoryId);
      }
      if (filters.isTaxRelevant) params.append("isTaxRelevant", "true");
      if (filters.query) params.append("search", filters.query);

      const response = await fetch(`/api/documents?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch documents");
      return response.json();
    },
    enabled: status === "authenticated",
  });

  const documents: Document[] = data?.documents || [];

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const responses = await Promise.all(
        ids.map((id) =>
          fetch(`/api/documents/${id}`, { method: "DELETE" })
        )
      );
      const errors = responses.filter((r) => !r.ok);
      if (errors.length > 0) throw new Error("Failed to delete some documents");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setSelectedIds([]);
      toast.success(t("documents.deleteSuccess"));
    },
    onError: () => {
      toast.error(t("documents.deleteFailed"));
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        const doc = documents.find((d) => d.id === id);
        if (doc?.fileUrl) {
          downloadDocumentFile(doc.fileUrl, doc.originalName || doc.name);
        }
      }
    },
    onSuccess: () => {
      toast.success(t("documents.downloadStarted"));
    },
    onError: () => {
      toast.error(t("documents.downloadFailed"));
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      const uploaded = data?.documents || [];
      const taxRelevantCount = uploaded.filter((d: Document) => d.isTaxRelevant).length;

      if (data?.skippedFiles?.length) {
        toast.error(`Skipped ${data.skippedFiles.length} file(s): ${data.skippedFiles.join(", ")}`);
      }

      if (data?.contentDuplicates?.length) {
        setDuplicateDialog(data.contentDuplicates);
      }

      if (uploaded.length === 1 && uploaded[0]?.category?.name && !data?.contentDuplicates?.length) {
        toast.success(
          t("documents.uploadSuccessWithCategory")
            .replace("{count}", "1")
            .replace("{category}", uploaded[0].category.name)
        );
      } else if (taxRelevantCount > 0 && !data?.contentDuplicates?.length) {
        toast.success(
          t("documents.uploadSuccessTaxRelevant")
            .replace("{count}", String(uploaded.length))
            .replace("{taxCount}", String(taxRelevantCount))
        );
      } else if (uploaded.length > 0 && !data?.contentDuplicates?.length) {
        toast.success(t("documents.uploadSuccess"));
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("documents.uploadFailed"));
    },
  });

  const reanalyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/documents/reanalyze", { method: "POST" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Reanalyze failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success(t("documents.recategorizeSuccess"));
    },
    onError: () => {
      toast.error(t("documents.recategorizeFailed"));
    },
  });

  const removeDuplicateUploadsMutation = useMutation({
    mutationFn: async (documentIds: string[]) => {
      const responses = await Promise.all(
        documentIds.map((id) => fetch(`/api/documents/${id}`, { method: "DELETE" }))
      );
      const errors = responses.filter((response) => !response.ok);
      if (errors.length > 0) {
        throw new Error("Failed to remove duplicate upload");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setDuplicateDialog(null);
      toast.success(t("documents.duplicateRemoved"));
    },
    onError: () => {
      toast.error(t("documents.duplicateRemoveFailed"));
    },
  });

  const handleFilesSelected = (files: File[]) => {
    if (files.length === 0) return;
    uploadMutation.mutate(files);
  };

  const handleKeepBothDuplicates = () => {
    setDuplicateDialog(null);
    toast.success(t("documents.duplicateKeptBoth"));
  };

  const handleRemoveDuplicateUploads = () => {
    if (!duplicateDialog) return;
    const ids = duplicateDialog.map((duplicate) => duplicate.newDocument.id);
    removeDuplicateUploadsMutation.mutate(ids);
  };

  const handleDelete = (ids: string[]) => {
    const message = t("documents.deleteConfirm").replace("{count}", String(ids.length));
    if (confirm(message)) {
      deleteMutation.mutate(ids);
    }
  };

  const handleDownload = (ids: string[]) => {
    downloadMutation.mutate(ids);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(documents.map((d) => d.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading variant="spinner" size="lg" text={t("common.loading")} />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t("documents.title")}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t("documents.manage")}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {documents.length > 0 && (
                <Button
                  variant="outline"
                  leftIcon={<ClipboardCheck className="w-5 h-5" />}
                  onClick={() => {
                    const year =
                      filters.year ||
                      documents[0]?.year ||
                      new Date().getFullYear() - 1;
                    router.push(`/steuererklaerung?year=${year}&step=preview`);
                  }}
                >
                  {t("documents.assignToTax")}
                </Button>
              )}
              {documents.length > 0 && (
                <Button
                  variant="outline"
                  leftIcon={<RefreshCw className="w-5 h-5" />}
                  onClick={() => reanalyzeMutation.mutate()}
                  isLoading={reanalyzeMutation.isPending}
                >
                  {t("documents.recategorize")}
                </Button>
              )}
              <Button
                variant="outline"
                leftIcon={<Camera className="w-5 h-5" />}
                onClick={() => setShowCamera(true)}
              >
                {t("documents.scan")}
              </Button>
              <Button
                variant="primary"
                leftIcon={<Upload className="w-5 h-5" />}
                onClick={() => {
                  document.getElementById("documents-header-upload")?.click();
                }}
              >
                {t("common.upload")}
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <AdvancedSearch
              onSearch={setFilters}
              categories={categoryNames}
              availableTags={["tax-deductible", "business", "personal"]}
              availableYears={[2026, 2025, 2024, 2023, 2022, 2021]}
            />
          </div>

          <div className="mb-6">
            <DragDrop
              onFilesSelected={handleFilesSelected}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              maxSize={uploadLimits.maxFileSizeMB}
              maxFiles={10}
              inputId="documents-drag-upload"
              disabled={uploadMutation.isPending}
            />
          </div>

          {isLoading ? (
            <SkeletonList items={5} />
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400">
                {t("documents.loadFailed")}
              </p>
            </div>
          ) : documents.length === 0 ? (
            <EmptyDocuments
              onUpload={() => document.getElementById("documents-header-upload")?.click()}
            />
          ) : (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
                  <SelectAllCheckbox
                    selectedCount={selectedIds.length}
                    totalCount={documents.length}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedIds.length > 0
                      ? `${selectedIds.length} ${t("documents.selected")}`
                      : `${documents.length} ${t("documents.documentCount")}`}
                  </span>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <MultiSelectCheckbox
                          isSelected={selectedIds.includes(doc.id)}
                          onToggle={() => toggleSelect(doc.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {doc.name}
                            </h3>
                            {doc.category?.name ? (
                              <span
                                className="px-2 py-0.5 text-xs rounded text-white"
                                style={{
                                  backgroundColor: doc.category.color || "#6B7280",
                                }}
                              >
                                {doc.category.name}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                                {t("documents.uncategorized")}
                              </span>
                            )}
                            {doc.isTaxRelevant && (
                              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                                {t("documents.taxRelevant")}
                              </span>
                            )}
                            {doc.aiConfidence && doc.aiConfidence > 0.5 && (
                              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded">
                                {t("documents.aiAnalyzed")}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                            <span>
                              {t("documents.year")}: {doc.year}
                            </span>
                            <span>{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                            <span>{new Date(doc.date).toLocaleDateString()}</span>
                            {doc.taxCategory && (
                              <span>
                                {t("documents.taxType")}: {doc.taxCategory}
                              </span>
                            )}
                          </div>
                          {doc.tags.length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {doc.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            title={t("documents.assignToTax")}
                            onClick={() =>
                              router.push(
                                `/steuererklaerung?year=${doc.year}&step=preview`
                              )
                            }
                          >
                            <ClipboardCheck className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDocumentFile(doc.fileUrl)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload([doc.id])}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete([doc.id])}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedIds.length > 0 && (
                <BulkActions
                  selectedIds={selectedIds}
                  onDeselectAll={handleDeselectAll}
                  onDelete={handleDelete}
                  onDownload={handleDownload}
                  onTag={() => toast("Tag feature coming soon", { icon: "ℹ️" })}
                  onMove={() => toast("Move feature coming soon", { icon: "ℹ️" })}
                  onArchive={() => toast("Archive feature coming soon", { icon: "ℹ️" })}
                />
              )}
            </>
          )}
        </div>

        {duplicateDialog && (
          <DuplicateUploadDialog
            duplicates={duplicateDialog}
            onKeepBoth={handleKeepBothDuplicates}
            onRemoveNew={handleRemoveDuplicateUploads}
            isRemoving={removeDuplicateUploadsMutation.isPending}
            labels={{
              title: t("documents.duplicateTitle"),
              description: t("documents.duplicateDescriptionAfterUpload"),
              newUploadLabel: t("documents.duplicateNewUpload"),
              existingLabel: t("documents.duplicateExisting"),
              uploadedOn: t("documents.duplicateUploadedOn"),
              category: t("documents.category"),
              keepBoth: t("documents.keepBoth"),
              removeNew: t("documents.removeNewUpload"),
              sameFile: t("documents.duplicateSameFile"),
              sameContent: t("documents.duplicateSameContent"),
              similarContent: t("documents.duplicateSimilarContent"),
            }}
          />
        )}

        {showCamera && (
          <CameraScanner
            onCapture={(file) => {
              handleFilesSelected([file]);
              setShowCamera(false);
            }}
            onClose={() => setShowCamera(false)}
          />
        )}

        <input
          id="documents-header-upload"
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
              handleFilesSelected(files);
            }
          }}
        />
      </div>
    </AuthenticatedLayout>
  );
}
