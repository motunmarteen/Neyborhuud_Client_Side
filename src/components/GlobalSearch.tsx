/**
 * Global Search Component
 * Instagram/X-style search with real-time results and smart ranking
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearch } from '@/hooks/useSearch';
import { UserSearchResult } from './search/UserSearchResult';
import { PostSearchResult } from './search/PostSearchResult';
import { LocationSearchResult } from './search/LocationSearchResult';

export const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const { 
    query, 
    setQuery, 
    type, 
    setType, 
    results, 
    loading, 
    error,
    totalResults 
  } = useSearch();

  const tabs = [
    { id: 'all', label: 'All', icon: 'bi-search' },
    { id: 'users', label: 'Users', icon: 'bi-person' },
    { id: 'posts', label: 'Posts', icon: 'bi-file-text' },
    { id: 'locations', label: 'Locations', icon: 'bi-geo-alt' }
  ] as const;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save search to history (localStorage)
  const saveSearchHistory = (searchQuery: string) => {
    if (!searchQuery) return;
    
    try {
      const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      const updated = [searchQuery, ...history.filter((q: string) => q !== searchQuery)].slice(0, 10);
      localStorage.setItem('searchHistory', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (query) {
      saveSearchHistory(query);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-xl text-gray-400 dark:text-text-secondary-dark pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search users, posts, locations..."
          className="w-full pl-10 pr-10 py-3 rounded-full border border-gray-300 dark:border-border-dark focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white dark:bg-surface-dark dark:text-white dark:placeholder-text-secondary-dark"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-gray-100 dark:hover:bg-surface-base-dark rounded-full p-1 transition-colors"
            aria-label="Clear search"
          >
            <i className="bi bi-x-lg text-gray-400 dark:text-text-secondary-dark hover:text-gray-600 dark:hover:text-white" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query && (
        <>
          <div className="absolute top-full mt-2 w-full bg-white dark:bg-surface-dark rounded-2xl shadow-2xl border border-gray-200 dark:border-border-dark max-h-[600px] overflow-hidden z-50">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-border-dark p-2 gap-1 overflow-x-auto">
              {tabs.map((tab) => {
                const count = 
                  tab.id === 'all' 
                    ? totalResults 
                    : results?.[tab.id as keyof typeof results]?.total || 0;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setType(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                      type === tab.id
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-600 dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-surface-base-dark'
                    }`}
                  >
                    <i className={`bi ${tab.icon}`} />
                    <span className="font-medium">{tab.label}</span>
                    {count > 0 && (
                      <span className="text-xs bg-gray-200 dark:bg-surface-base-dark dark:text-text-secondary-dark px-2 py-0.5 rounded-full">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Results Content */}
            <div className="overflow-y-auto max-h-[500px]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3 text-gray-600 dark:text-text-secondary-dark">Searching...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12 px-4">
                  <div className="text-red-600 dark:text-red-400 font-medium">{error}</div>
                  <p className="text-gray-500 dark:text-text-secondary-dark text-sm mt-2">Please try again</p>
                </div>
              ) : totalResults === 0 ? (
                <div className="text-center py-12 px-4">
                  <i className="bi bi-search text-gray-300 dark:text-text-secondary-dark/50 mx-auto mb-3" style={{fontSize: '3rem'}} />
                  <div className="text-gray-500 dark:text-text-secondary-dark font-medium">No results found</div>
                  <p className="text-gray-400 dark:text-text-secondary-dark/70 text-sm mt-1">
                    Try searching for something else
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-border-dark">
                  {/* Users Results */}
                  {(type === 'all' || type === 'users') && 
                    results?.users?.data && 
                    results.users.data.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-text-secondary-dark mb-3 uppercase tracking-wide">
                        Users ({results.users.total})
                      </h3>
                      <div className="space-y-1">
                        {results.users.data
                          .filter(user => user && user._id && user.username)
                          .map((user) => (
                            <UserSearchResult 
                              key={user._id} 
                              user={user} 
                              onClose={handleClose} 
                            />
                          ))
                        }
                      </div>
                      {results.users.hasMore && (
                        <button 
                          className="text-primary text-sm mt-3 hover:underline font-medium"
                          onClick={() => setType('users')}
                        >
                          See all {results.users.total} users →
                        </button>
                      )}
                    </div>
                  )}

                  {/* Posts Results */}
                  {(type === 'all' || type === 'posts') && 
                    results?.posts?.data && 
                    results.posts.data.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-text-secondary-dark mb-3 uppercase tracking-wide">
                        Posts ({results.posts.total})
                      </h3>
                      <div className="space-y-2">
                        {results.posts.data
                          .filter(post => post && post.id)
                          .map((post) => (
                            <PostSearchResult 
                              key={post.id} 
                              post={post} 
                              onClose={handleClose} 
                            />
                          ))
                        }
                      </div>
                      {results.posts.hasMore && (
                        <button 
                          className="text-primary text-sm mt-3 hover:underline font-medium"
                          onClick={() => setType('posts')}
                        >
                          See all {results.posts.total} posts →
                        </button>
                      )}
                    </div>
                  )}

                  {/* Locations Results */}
                  {(type === 'all' || type === 'locations') && 
                    results?.locations?.data && 
                    results.locations.data.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-text-secondary-dark mb-3 uppercase tracking-wide">
                        Locations ({results.locations.total})
                      </h3>
                      <div className="space-y-1">
                        {results.locations.data
                          .filter(location => location && location.city && location.state)
                          .map((location, index) => (
                            <LocationSearchResult 
                              key={`${location.city}-${location.state}-${index}`} 
                              location={location} 
                              onClose={handleClose} 
                            />
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer with total count */}
            {totalResults > 0 && !loading && (
              <div className="border-t border-gray-200 dark:border-border-dark p-3 text-center text-sm text-gray-500 dark:text-text-secondary-dark bg-gray-50 dark:bg-surface-base-dark">
                {totalResults} total result{totalResults !== 1 ? 's' : ''} found for "{query}"
              </div>
            )}
          </div>

          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={handleClose}
            aria-hidden="true"
          />
        </>
      )}
    </div>
  );
};
