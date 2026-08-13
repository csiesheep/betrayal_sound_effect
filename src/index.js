const PREFIX = "/betrayal_sound_board";

// Google requires ads.txt at the domain root (not under any path prefix)
// to authorize this site to serve AdSense ads at all - without it, ad
// requests are served but Google withholds actual ad creatives.
const ADS_TXT = "google.com, pub-3643717374169188, DIRECT, f08c47fec0942fa0\n";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/ads.txt") {
      return new Response(ADS_TXT, {
        headers: { "content-type": "text/plain; charset=utf-8" },
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
