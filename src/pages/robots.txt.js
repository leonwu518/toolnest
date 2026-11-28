import { SITE, absoluteUrl } from '../lib/site.js';

export const prerender = true;

export function GET() {
  return new Response(
    `# ToolWild robots.txt — Google / Bing / Baidu\nUser-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl('/sitemap.xml')}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
}
