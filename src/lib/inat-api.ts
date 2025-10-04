export interface Taxon {
	id: number;
	name: string;
	rank: string;
	preferred_common_name?: string;
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
