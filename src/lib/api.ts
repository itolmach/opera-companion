import { Composer, Opera } from '@/types';

const OPENOPUS_API_BASE = 'https://api.openopus.org';

// Define a more specific type for the items returned by omnisearch if possible
// For now, we assume a structure and select fields relevant to our Opera type
interface OmniSearchResultItem {
  id: string;
  title: string;
  composer: { name: string; id: string; }; // Assuming structure from API
  // Add other fields that might come from omnisearch
}

export async function searchOperas(query: string): Promise<Opera[]> {
  const response = await fetch(
    `${OPENOPUS_API_BASE}/omnisearch/${encodeURIComponent(query)}/opera.json`
  );
  if (!response.ok) {
    throw new Error('Failed to search operas');
  }
  const data = await response.json();
  return (data.results || []).map((item: OmniSearchResultItem): Opera => ({
    id: item.id, 
    title: item.title,
    composer: item.composer.name,
  }));
}

interface WorkDetail {
  id: string;
  title: string;
  composer: Composer; // Assuming the detail endpoint gives full composer info
  subtitle?: string;
  description?: string;
  premiere?: { venue?: string }; // Simplified, adjust based on actual API structure
  year?: string;
  genre?: string;
  epoch?: string;
}

export async function getOperaDetails(composerId: string, workId: string): Promise<Opera | null> {
  const response = await fetch(
    `${OPENOPUS_API_BASE}/work/detail/${composerId}/${workId}.json`
  );
  if (!response.ok) {
    throw new Error('Failed to get opera details');
  }
  const data: { work: WorkDetail | null } = await response.json();
  if (!data.work) return null;

  const workData = data.work;
  return {
    id: workData.id, 
    title: workData.title,
    composer: workData.composer.name,
    synopsis: workData.subtitle || workData.description, 
    firstPerformance: workData.premiere && workData.year ? { date: workData.year, place: workData.premiere.venue || 'Unknown venue' } : undefined,
    genre: workData.genre,
    epoch: workData.epoch,
    imageUrl: workData.composer.portrait || '/images/placeholder.jpg',
    composerInfo: workData.composer,
  };
}

export async function getComposerDetails(composerId: string): Promise<Composer | null> {
  const response = await fetch(
    `${OPENOPUS_API_BASE}/composer/detail/${composerId}.json`
  );
  if (!response.ok) {
    throw new Error('Failed to get composer details');
  }
  const data = await response.json();
  return data.composer || null;
}

// Define a more specific type for items from work/list/composer API
interface WorkListItem {
  id: string;
  title: string;
  genre?: string;
  epoch?: string;
  // other fields from this specific API endpoint
}

export async function getPopularOperas(): Promise<Opera[]> {
  const composersResponse = await fetch(
    `${OPENOPUS_API_BASE}/composer/list/pop.json`
  );
  if (!composersResponse.ok) {
    throw new Error('Failed to get popular composers');
  }
  const composersData = await composersResponse.json();
  const composers: Composer[] = composersData.composers || [];

  const allWorks: Opera[] = [];
  for (const composer of composers) {
    const worksResponse = await fetch(
      `${OPENOPUS_API_BASE}/work/list/composer/${composer.id}/all.json`
    );
    if (!worksResponse.ok) continue;
    const worksData: { works: WorkListItem[] | null } = await worksResponse.json();
    if (worksData.works) {
      const composerOperas: Opera[] = worksData.works.map((work: WorkListItem): Opera => ({
        id: `${composer.id}-${work.id}`, 
        title: work.title,
        composer: composer.name,
        genre: work.genre,
        epoch: work.epoch,
        composerInfo: composer,
        imageUrl: composer.portrait || '/images/placeholder.jpg',
      }));
      allWorks.push(...composerOperas);
    }
  }
  return allWorks;
} 