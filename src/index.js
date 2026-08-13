const PREFIX = "/betrayal_sound_board";

// Google requires ads.txt at the domain root (not under any path prefix)
// to authorize this site to serve AdSense ads at all - without it, ad
// requests are served but Google withholds actual ad creatives.
const ADS_TXT = "google.com, pub-3643717374169188, DIRECT, f08c47fec0942fa0\n";

// robots.txt and sitemap.xml must live at the host root (crawlers only
// honour robots.txt at the domain root), which is outside the app prefix.
const CANONICAL = "https://games.csiesheep.com" + PREFIX + "/";
// Cloudflare's Managed robots.txt is prepended to this response and already
// supplies the crawl rules (User-agent groups + Content-Signal). We only add
// the Sitemap directive so we don't emit a duplicate "User-agent: *" group.
const ROBOTS_TXT =
  "Sitemap: https://games.csiesheep.com/sitemap.xml\n";
const SITEMAP_XML =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  "  <url>\n" +
  "    <loc>" + CANONICAL + "</loc>\n" +
  "    <changefreq>weekly</changefreq>\n" +
  "    <priority>1.0</priority>\n" +
  "  </url>\n" +
  "</urlset>\n";

// Search Console verifies this URL-prefix property by fetching this
// exact .html path. Served directly (not via env.ASSETS.fetch) because
// Cloudflare's static-asset handler 308-redirects .html requests to
// their extensionless equivalent, and that redirect happens *after*
// the prefix has already been stripped below - sending Google to a
// bare, unprefixed URL that 404s.
const SITE_VERIFICATION_PATH = PREFIX + "/googlef3ddb8b7c25dfb0c.html";
const SITE_VERIFICATION_BODY = "google-site-verification: googlef3ddb8b7c25dfb0c.html\n";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === SITE_VERIFICATION_PATH) {
      return new Response(SITE_VERIFICATION_BODY, {
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    if (url.pathname === "/ads.txt") {
      return new Response(ADS_TXT, {
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    if (url.pathname === "/robots.txt") {
      return new Response(ROBOTS_TXT, {
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    if (url.pathname === "/sitemap.xml") {
      return new Response(SITEMAP_XML, {
        headers: { "content-type": "application/xml; charset=utf-8" },
      });
    }

    if (url.pathname === PREFIX) {
      url.pathname = PREFIX + "/";
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname.startsWith(PREFIX + "/")) {
      url.pathname = url.pathname.slice(PREFIX.length) || "/";
      return env.ASSETS.fetch(new Request(url, request));
    }

    return new Response("Not found", { status: 404 });
  },
};
