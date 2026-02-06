/**
 * useSearch Hook
 * Handles search state management with debouncing
 */

import { useState, useEffect, useCallback } from "react";
import { searchService } from "@/services/search.service";
import { SearchParams, SearchResults } from "@/types/search";
import { useDebouncedValue } from "./useDebouncedValue";

export const useSearch = (
  initialQuery = "",
  initialType: "all" | "users" | "posts" | "locations" = "all",
) => {
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<"all" | "users" | "posts" | "locations">(
    initialType,
  );
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);

  const debouncedQuery = useDebouncedValue(query, 300);

  const performSearch = useCallback(
    async (page = 1) => {
      if (!debouncedQuery || debouncedQuery.length < 1) {
        setResults(null);
        setTotalResults(0);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("🔍 Performing search:", {
          query: debouncedQuery,
          type,
          page,
        });
        const response = await searchService.search({
          q: debouncedQuery,
          type,
          page,
          limit: 20,
        });

        console.log("✅ Search response:", response);

        if (!response || !response.data) {
          console.error("❌ Invalid response structure:", response);
          throw new Error("Invalid response from search API");
        }

        setResults(response.data.results);
        setTotalResults(response.data.totalResults);
      } catch (err: any) {
        console.error("❌ Search error:", err);
        console.error("Error response:", err.response);
        const errorMessage =
          err.response?.data?.message || err.message || "Search failed";
        setError(errorMessage);
        setResults(null);
      } finally {
        setLoading(false);
      }
    },
    [debouncedQuery, type],
  );

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  return {
    query,
    setQuery,
    type,
    setType,
    results,
    loading,
    error,
    totalResults,
    refetch: performSearch,
  };
};
