"use client";

import { useState, useCallback, useMemo } from "react";
import { Search, Filter, X, Calendar, Tag, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { debounce } from "@/lib/utils/performance";
import { cn } from "@/lib/utils/cn";

interface SearchFilters {
  query: string;
  category?: string;
  year?: number;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  isTaxRelevant?: boolean;
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  categories?: string[];
  availableTags?: string[];
  availableYears?: number[];
  className?: string;
}

export function AdvancedSearch({
  onSearch,
  categories = [],
  availableTags = [],
  availableYears = [],
  className,
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((searchFilters: SearchFilters) => {
        onSearch(searchFilters);
      }, 300),
    [onSearch]
  );

  const updateFilters = useCallback(
    (updates: Partial<SearchFilters>) => {
      const newFilters = { ...filters, ...updates };
      setFilters(newFilters);
      debouncedSearch(newFilters);
    },
    [filters, debouncedSearch]
  );

  const handleQueryChange = (query: string) => {
    updateFilters({ query });
  };

  const handleCategoryChange = (category: string) => {
    updateFilters({ category: category || undefined });
  };

  const handleYearChange = (year: string) => {
    updateFilters({ year: year ? parseInt(year) : undefined });
  };

  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    updateFilters({ tags: newTags.length > 0 ? newTags : undefined });
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = { query: filters.query };
    setFilters(clearedFilters);
    setSelectedTags([]);
    onSearch(clearedFilters);
  };

  const hasActiveFilters =
    filters.category ||
    filters.year ||
    filters.tags?.length ||
    filters.isTaxRelevant;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search documents, tags, notes..."
          value={filters.query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {filters.query && (
          <button
            onClick={() => handleQueryChange("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          leftIcon={<Filter className="w-4 h-4" />}
        >
          Filters
          {hasActiveFilters && (
            <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
              {[
                filters.category ? 1 : 0,
                filters.year ? 1 : 0,
                filters.tags?.length || 0,
                filters.isTaxRelevant ? 1 : 0,
              ].reduce((a, b) => a + b, 0)}
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear All
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4 border border-gray-200 dark:border-gray-700">
          {/* Category Filter */}
          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={filters.category || ""}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Year Filter */}
          {availableYears.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Year
              </label>
              <select
                value={filters.year || ""}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm transition-colors",
                      selectedTags.includes(tag)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    )}
                  >
                    <Tag className="w-3 h-3 inline mr-1" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tax Relevant Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="tax-relevant"
              checked={filters.isTaxRelevant || false}
              onChange={(e) =>
                updateFilters({ isTaxRelevant: e.target.checked || undefined })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="tax-relevant"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Tax Relevant Only
            </label>
          </div>
        </div>
      )}
    </div>
  );
}



