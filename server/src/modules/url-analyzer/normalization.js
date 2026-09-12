/**
 * URL Normalization
 * Owner: Asad
 * TODO: Implement full URL normalization logic
 * - Decode percent encoding
 * - Remove default ports
 * - Normalize protocol
 * - Handle punycode domains
 */
export function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    return {
      original: url,
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      pathname: parsed.pathname,
      search: parsed.search,
      hash: parsed.hash,
      normalized: parsed.href,
    };
  } catch {
    return {
      original: url,
      protocol: null,
      hostname: null,
      pathname: null,
      search: null,
      hash: null,
      normalized: url,
      parseError: true,
    };
  }
}
