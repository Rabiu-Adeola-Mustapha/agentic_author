export function sanitizePrompt(input: string): string {
  const injectionPatterns = [
    /ignore previous instructions/gi,
    /ignore all instructions/gi,
    /you are now/gi,
    /disregard your/gi,
    /act as/gi,
    /system prompt/gi,
    /new instructions/gi,
    /<\/?script[^>]*>/gi,
    /javascript:/gi,
    /[^a-zA-Z0-9\s.,?!'"()[\]{}:;\-_+=*/\\]{6,}/g, // run of >5 special characters
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
