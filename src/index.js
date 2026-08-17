const PREFIX = "/betrayal_sound_board";

// Root-level files (ads.txt, robots.txt, sitemap.xml) now live on the
// games.csiesheep.com HUB Worker, which owns "/". This Worker is attached to
// the subdomain by the Route  games.csiesheep.com/betrayal_sound_board/*  and
// only handles its own prefix. See the "Deploy a repo under a csiesheep.com
// subdomain" runbook.

// Search Console verifies this URL-prefix property by fetching this exact
// .html path. Served directly (not via env.ASSETS.fetch) because Cloudflare's
// static-asset handler 308-redirects .html requests to their extensionless
// equivalent, and that redirect happens *after* the prefix has already been
// stripped below - sending Google to a bare, unprefixed URL that 404s.
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

    // "/" and the bare prefix both normalise to the prefixed root. In
    // production "/" is served by the hub, not here (this Worker only receives
    // /betrayal_sound_board/*), but keeping it makes the *.workers.dev URL
    // usable for testing.
    if (url.pathname === "/" || url.pathname === PREFIX) {
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
