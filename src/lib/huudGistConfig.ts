import type { GistSection } from '@/types/huudGist';
import { gistSectionIcon } from '@/lib/huudGistSections';
import { GIST_SECTION_LABELS } from '@/types/huudGist';

export function buildGistSectionList(  apiSections: Array<{ id: string; label: string; description?: string | null }>,
): GistSection[] {
  const raw =
    apiSections.length > 0
      ? apiSections
      : Object.entries(GIST_SECTION_LABELS).map(([id, label]) => ({
          id,
          label,
          description: null as string | null,
        }));

  const seen = new Set<string>();
  const items: GistSection[] = [];

  for (const s of raw) {
    if (s.id === 'all' || seen.has(s.id)) continue;
    seen.add(s.id);
    items.push({
      id: s.id,
      label: s.label,
      icon: gistSectionIcon(s.id),
      description: s.description,
    });
  }

  return [{ id: 'all', label: 'All', icon: gistSectionIcon('all') }, ...items];
}

export function postableSections(sections: GistSection[]): GistSection[] {
  return sections.filter((s) => s.id !== 'all');
}

export function defaultPostSection(sections: GistSection[]): string {
  return postableSections(sections)[0]?.id ?? 'local_gist';
}
