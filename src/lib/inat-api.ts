export interface Taxon {
  id: number;
  name: string;
  rank: string;
  preferred_common_name?: string;
}

export interface Photo {
  url: string;
  observationUrl: string;
  id: number;
  attribution: string;
}

interface SearchResult {
  type: string;
  record: Taxon;
}

interface SearchResponse {
  results: SearchResult[];
}

export async function searchTaxa(query: string): Promise<Taxon[]> {
  if (!query.trim()) return [];

  const response = await fetch(
    `https://api.inaturalist.org/v1/search?q=${encodeURIComponent(query)}&sources=taxa&per_page=10`
  );
  const data: SearchResponse = await response.json();

  return data.results
    .filter(result => result.type === 'Taxon')
    .map(result => result.record);
}

export async function fetchObservationPhotos(taxonId?: number): Promise<Photo[]> {
  const params = new URLSearchParams({
    quality_grade: 'research,needs_id',
    per_page: '200',
    order: 'desc',
    order_by: 'votes'
  });

  if (taxonId) {
    params.set('taxon_id', taxonId.toString());
  }

  const response = await fetch(
    `https://api.inaturalist.org/v1/observations?${params}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch observations');
  }

  const data = await response.json();
  return data.results
    .filter((obs: any) => obs.photos && obs.photos.length > 0)
    .map((obs: any) => ({
      url: obs.photos[0].url,
      observationUrl: obs.uri,
      id: obs.id,
      attribution: obs.photos[0].attribution
    }));
}
