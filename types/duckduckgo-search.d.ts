declare module 'duckduckgo-search' {
  interface DDGTextResult {
    title: string;
    href: string;
    body: string;
  }

  interface DDGSearch {
    text(query: string, options?: Record<string, unknown>): AsyncIterable<DDGTextResult>;
    logger: {
      warning?: (...args: unknown[]) => void;
      [key: string]: unknown;
    };
  }

  const ddg: DDGSearch;
  export default ddg;
}
