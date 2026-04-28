import { search, SafeSearchType } from 'duck-duck-scrape';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  score?: number;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function searchWeb(query: string, maxResults: number = 5, retries: number = 2): Promise<SearchResult[]> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await search(query, {
        safeSearch: SafeSearchType.MODERATE,
      });

      const results = response.results.slice(0, maxResults).map((r: any, index: number) => ({
        title: r.title,
        url: r.url,
        snippet: r.description,
        score: 100 - index * 5,
      }));

      return results;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isRateLimit = errorMsg.includes('anomaly') || errorMsg.includes('too quickly');
      
      if (i < retries && isRateLimit) {
        const waitTime = (i + 1) * 2000; // 2s, 4s backoff
        console.warn(`DDG Rate limit hit for "${query}". Retrying in ${waitTime}ms... (Attempt ${i + 1}/${retries})`);
        await sleep(waitTime);
        continue;
      }

      console.warn(
        `Web search failed for query "${query}":`,
        errorMsg
      );
      return [];
    }
  }
  return [];
}
