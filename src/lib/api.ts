const OPENOPUS_API_BASE = 'https://api.openopus.org';

export async function searchOperas(query: string) {
  const response = await fetch(
    `${OPENOPUS_API_BASE}/omnisearch/${encodeURIComponent(query)}/opera.json`
  );
  if (!response.ok) {
    throw new Error('Failed to search operas');
  }
  const data = await response.json();
  return data.results || [];
}

export async function getOperaDetails(composerId: string, workId: string) {
  const response = await fetch(
    `${OPENOPUS_API_BASE}/work/detail/${composerId}/${workId}.json`
  );
  if (!response.ok) {
    throw new Error('Failed to get opera details');
  }
  const data = await response.json();
  return data.work || null;
}

export async function getComposerDetails(composerId: string) {
  const response = await fetch(
    `${OPENOPUS_API_BASE}/composer/detail/${composerId}.json`
  );
  if (!response.ok) {
    throw new Error('Failed to get composer details');
  }
  const data = await response.json();
  return data.composer || null;
}

export async function getPopularOperas() {
  // Get popular composers
  const composersResponse = await fetch(
    `${OPENOPUS_API_BASE}/composer/list/pop.json`
  );
  if (!composersResponse.ok) {
    throw new Error('Failed to get popular composers');
  }
  const composersData = await composersResponse.json();
  const composers = composersData.composers || [];

  // Fetch all works for each composer
  let allWorks: any[] = [];
  for (const composer of composers) {
    const worksResponse = await fetch(
      `${OPENOPUS_API_BASE}/work/list/composer/${composer.id}/all.json`
    );
    if (!worksResponse.ok) continue;
    const worksData = await worksResponse.json();
    if (worksData.works) {
      // Attach composer info to each work for mapping
      allWorks.push(...worksData.works.map((work: any) => ({ ...work, composer })));
    }
  }
  return allWorks;
} 