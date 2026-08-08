const PREFIX = "/games/betrayal_sound_effect";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === PREFIX || url.pathname.startsWith(PREFIX + "/")) {
      url.pathname = url.pathname.slice(PREFIX.length) || "/";
      request = new Request(url, request);
    }

    return env.ASSETS.fetch(request);
  },
};
