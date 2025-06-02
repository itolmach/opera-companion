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
  // First get popular composers
  const composersResponse = await fetch(
    `${OPENOPUS_API_BASE}/composer/list/pop.json`
  );
  if (!composersResponse.ok) {
    throw new Error('Failed to get popular composers');
  }
  const composersData = await composersResponse.json();
  
  // Then get their most popular works
  const works: any[] = [];
  for (const composer of composersData.composers || []) {
    const worksResponse = await fetch(
      `${OPENOPUS_API_BASE}/work/list/composer/${composer.id}/pop.json`
    );
    if (!worksResponse.ok) continue;
    const worksData = await worksResponse.json();
    if (worksData.works) {
      works.push(...worksData.works.filter((work: any) => 
        work.genre?.toLowerCase().includes('opera') || 
        work.title?.toLowerCase().includes('opera')
      ));
    }
  }
  
  return works;
} 