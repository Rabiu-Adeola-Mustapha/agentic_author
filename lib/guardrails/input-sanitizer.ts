export function sanitizePrompt(input: string): string {
  const injectionPatterns = [
    /ignore (all |previous |prior )?instructions?/gi,
    /you are now/gi,
    /disregard (your|all)/gi,
    /act as (a |an )?/gi,
    /system prompt/gi,
    /<\/?script[^>]*>/gi,
    /javascript:/gi,
  ];

  let clean = input;
  for (const pattern of injectionPatterns) {
    clean = clean.replace(pattern, '');
  }

  return clean.trim().slice(0, 4000);
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
