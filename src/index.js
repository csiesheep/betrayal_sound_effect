const PREFIX = "/betrayal_sound_board";

// Google requires ads.txt at the domain root (not under any path prefix)
// to authorize this site to serve AdSense ads at all - without it, ad
// requests are served but Google withholds actual ad creatives.
const ADS_TXT = "google.com, pub-3643717374169188, DIRECT, f08c47fec0942fa0\n";

// robots.txt and sitemap.xml must live at the host root (crawlers only
// honour robots.txt at the domain root), which is outside the app prefix.
const CANONICAL = "https://games.csiesheep.com" + PREFIX + "/";
const ROBOTS_TXT =
  "User-agent: *\n" +
  "Allow: /\n\n" +
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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
