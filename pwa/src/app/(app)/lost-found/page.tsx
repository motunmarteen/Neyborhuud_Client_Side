'use client';

/**
 * /lost-found — Hyperlocal Lost & Found Hub
 * Built with the NeyborHuud Phase 2 Design Template & AppBrowseLayout.
 */

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, MapPin, Sparkles, ShieldCheck, Tag } from 'lucide-react';
import { AppBrowseLayout } from '@/components/layout/AppBrowseLayout';
import { CreateLostFoundSheet } from '@/components/create/CreateLostFoundSheet';
import { contentService } from '@/services/content.service';
import { useGeolocation } from '@/hooks/useGeolocation';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';
import { Button } from '@/components/ui/Button';
import type { Post } from '@/types/api';

const FILTER_TABS = [
  { id: 'all', label: 'All Items' },
  { id: 'lost', label: '🔴 Lost' },
  { id: 'found', label: '🟢 Found' },
  { id: 'pets', label: '🐾 Pets' },
  { id: 'documents', label: '📄 ID & Docs' },
  { id: 'keys', label: '🔑 Keys' },
  { id: 'electronics', label: '📱 Electronics' },
] as const;

function LostFoundHub() {
  const router = useRouter();
  const { location } = useGeolocation();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchItems() {
      setLoading(true);
      try {
        const res = await contentService.getLocationFeed(
          location?.latitude ?? null,
          location?.longitude ?? null,
          {
            radius: 15000,
            contentType: 'lost_found' as any,
            limit: 30,
          }
        );
        if (!cancelled) {
          setPosts(res.content || []);
        }
      } catch {
        // Fallback or empty
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchItems();
    return () => {
      cancelled = true;
    };
  }, [location?.latitude, location?.longitude]);

  const filtered = posts.filter((p) => {
    const raw = p as any;
    const meta = (raw.metadata as any)?.lostFound || {};
    const kind = meta.kind || (raw.type === 'lost_found' ? 'lost' : '');
    const category = meta.category?.toLowerCase() || '';

    if (activeTab === 'lost' && kind !== 'lost') return false;
    if (activeTab === 'found' && kind !== 'found') return false;
    if (activeTab === 'pets' && !category.includes('pet') && !p.content?.toLowerCase().includes('dog') && !p.content?.toLowerCase().includes('cat')) return false;
    if (activeTab === 'documents' && !category.includes('doc') && !category.includes('id') && !category.includes('card')) return false;
    if (activeTab === 'keys' && !category.includes('key')) return false;
    if (activeTab === 'electronics' && !category.includes('phone') && !category.includes('laptop') && !category.includes('electronic')) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const content = (p.content || '').toLowerCase();
      const title = (raw.title || '').toLowerCase();
      const item = (meta.itemName || '').toLowerCase();
      return content.includes(q) || title.includes(q) || item.includes(q);
    }
    return true;
  });

  return (
    <AppBrowseLayout
      maxWidth="680"
      header={
        <div className="flex flex-col gap-3 pt-2">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="font-heading text-2xl font-black text-[#1D2433]">Lost &amp; Found</h1>
              <p className="text-xs font-medium text-[#5B6478]">
                Find or return missing items with secret proof and Huud pledges
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setSheetOpen(true)}
              className="shrink-0"
            >
              Report Item
            </Button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA3B1]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search missing items, pets, keys, cards..."
              className="w-full rounded-2xl border border-[#DDE3EC] bg-white py-2.5 pl-10 pr-4 text-xs font-semibold text-[#1D2433] placeholder:text-[#9AA3B1] focus:border-[#00B82E] focus:outline-none focus:ring-2 focus:ring-[#00B82E]/20"
            />
          </div>

          {/* Filter Chips */}
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`tap-target inline-flex h-8 shrink-0 items-center rounded-full px-3.5 text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#1D2433] text-white shadow-xs'
                    : 'border border-[#DDE3EC] bg-white text-[#5B6478] hover:bg-[#EEF2F7]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      {loading ? (
        <div className="flex flex-col gap-3 py-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-3xl border border-[#DDE3EC] bg-white p-5 animate-pulse shadow-sm" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <BrowseEmptyState
          icon="search_off"
          title={search ? 'No items matched your search' : 'No items reported in this area'}
          description={
            search
              ? 'Try adjusting your search terms or filter tags.'
              : 'Help your neighborhood! Did you lose or find keys, documents, a pet, or an electronic device?'
          }
          action={
            <Button variant="primary" onClick={() => setSheetOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
              Report Lost or Found Item
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3 pb-8">
          {filtered.map((item) => {
            const lf = (item.metadata as any)?.lostFound || {};
            const isFound = lf.kind === 'found';
            const postId = item.id || item._id;

            return (
              <div
                key={postId}
                onClick={() => router.push(`/lost-found/${postId}`)}
                className="group cursor-pointer rounded-3xl border border-[#DDE3EC] bg-white p-5 shadow-sm transition-all hover:border-[#00B82E]/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide ${
                        isFound
                          ? 'bg-[#E8F7EC] text-[#0E8A3E]'
                          : 'bg-[#FDECEC] text-[#E5484D]'
                      }`}
                    >
                      {isFound ? '🟢 Found Item' : '🔴 Lost Item'}
                    </span>
                    {lf.category && (
                      <span className="rounded-full bg-[#EEF2F7] px-2.5 py-0.5 text-[11px] font-bold text-[#5B6478]">
                        {lf.category}
                      </span>
                    )}
                  </div>

                  {lf.pledge > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF4E5] px-2.5 py-0.5 text-xs font-black text-[#B26200]">
                      <span>🪙</span>
                      {lf.pledge} HC pledge
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <h3 className="font-heading text-base font-extrabold text-[#1D2433] group-hover:text-[#0E8A3E] transition-colors">
                    {lf.itemName || (item as any).title || 'Missing Item'}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs font-medium text-[#5B6478] leading-relaxed">
                    {item.content || item.body || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-3.5 flex items-center justify-between border-t border-[#DDE3EC] pt-3 text-[11px] text-[#9AA3B1]">
                  <div className="flex items-center gap-1 text-[#5B6478]">
                    <MapPin size={13} className="text-[#0E8A3E]" />
                    <span className="font-semibold truncate max-w-[200px]">
                      {lf.lastSeenPlace || item.location?.neighborhood || item.location?.lga || 'Your Huud'}
                    </span>
                  </div>

                  <span className="font-extrabold text-[#00B82E] group-hover:underline">
                    View Details →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Creation Modal */}
      <CreateLostFoundSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </AppBrowseLayout>
  );
}

export default function LostFoundPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-[#EEF2F7] animate-pulse" />}>
      <LostFoundHub />
    </Suspense>
  );
}
