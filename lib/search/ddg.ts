import { DDGS } from 'duckduckgo-search';

export interface DDGResult {
  title: string;
  url: string;
  snippet: string;
}

export async function searchWeb(
  query: string,
  maxResults: number = 5
): Promise<DDGResult[]> {
  const results: DDGResult[] = [];

  try {
    const ddgs = new DDGS();
    const webResults = await ddgs.text({
      query,
      max_results: Math.min(maxResults, 10),
    });

    for (const result of webResults) {
      results.push({
        title: result.title,
        url: result.href,
        snippet: result.body,
      });
    }

    return results;
  } catch (error) {
    console.error(`DuckDuckGo search failed for query "${query}":`, error);
    return [];
  }
}
