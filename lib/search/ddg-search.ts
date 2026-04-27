import ddg from 'duckduckgo-search';

// Patch buggy logger in older versions of duckduckgo-search
if (ddg && ddg.logger && typeof ddg.logger.warning !== 'function') {
  ddg.logger.warning = console.warn;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  score?: number;
}

export async function searchWeb(query: string, maxResults: number = 5): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  try {
    for await (const result of ddg.text(query)) {
      results.push({
        title: result.title,
        url: result.href,
        snippet: result.body,
      });

      if (results.length >= maxResults) {
        break;
      }
    }
  } catch (error) {
    console.warn(`DuckDuckGo search package failed for query "${query}":`, error);
    
    // Fallback if duckduckgo-search fails
    try {
      const fallbackUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const res = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });
      if (res.ok) {
        const text = await res.text();
        const regex = /<a class="result__url" href="([^"]+)".*?>(.*?)<\/a>.*?<a class="result__snippet[^>]+>(.*?)<\/a>/gs;
        let match;
        while ((match = regex.exec(text)) !== null) {
          let href = match[1];
          if (href.startsWith('/l/?uddg=')) {
            href = decodeURIComponent(href.split('uddg=')[1].split('&')[0]);
          }
          const title = match[2].replace(/<\/?[^>]+(>|$)/g, '').trim();
          const snippet = match[3].replace(/<\/?[^>]+(>|$)/g, '').trim();
          
          if (title && href && snippet) {
            results.push({ title, url: href, snippet });
          }
          if (results.length >= maxResults) break;
        }
      }
    } catch (fallbackError) {
      console.error('DDG fallback also failed:', fallbackError);
      throw new Error(`Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  if (results.length === 0) {
    // Generate dummy score if needed, but not required
    // return an empty array
  }
  
  return results.map((r, i) => ({ ...r, score: 100 - i * 5 }));
}
