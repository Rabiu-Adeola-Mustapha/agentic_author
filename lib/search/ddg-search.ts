import { search, SafeSearchType } from 'duck-duck-scrape';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  score?: number;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function searchWeb(query: string, maxResults: number = 5, retries: number = 3): Promise<SearchResult[]> {
  // Initial jitter: wait 1-3s before every request to appear more human-like
  await sleep(1000 + Math.random() * 2000);

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
      
      console.warn(`DDG Search failed for "${query}" (Attempt ${i + 1}/${retries}). RateLimit: ${isRateLimit}`);

      // If we hit the datacenter block, fallback to Wikipedia API which does not block Vercel/Trigger.dev IPs
      if (isRateLimit) {
        console.log(`[Search] Falling back to Wikipedia API for query: "${query}"`);
        try {
          const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json`;
          const wikiRes = await fetch(wikiUrl, {
            headers: {
              'User-Agent': 'AgenticAuthorBot/1.0 (https://agenticauthor.vercel.app; info@agenticauthor.com)'
            }
          });
          const wikiData = await wikiRes.json();
          
          if (wikiData?.query?.search) {
            return wikiData.query.search.slice(0, maxResults).map((r: any, index: number) => ({
              title: `Wikipedia: ${r.title}`,
              url: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title)}`,
              // Wikipedia snippets contain HTML tags like <span class="searchmatch">, so we strip them
              snippet: r.snippet.replace(/<[^>]*>?/gm, ''),
              score: 100 - index * 5,
            }));
          }
        } catch (wikiError) {
          console.error(`[Search] Wikipedia fallback also failed:`, wikiError);
        }
      }

      if (i < retries) {
        const waitTime = (i + 1) * 3000;
        await sleep(waitTime);
        continue;
      }

      return [];
    }
  }
  return [];
}
