// One-shot SFX player. One HTMLAudioElement per active sound, so multiple
// sounds can play layered at once (per the design doc's "layer sounds
// like a mixer" concept).
const AudioEngine = (function () {
  const active = new Map();

  function play(name, src, onEnd) {
    stop(name);
    const audio = new Audio(src);
    audio.addEventListener('ended', function () {
      active.delete(name);
      if (onEnd) onEnd(name);
    });
    audio.play().catch(function () {
      active.delete(name);
      if (onEnd) onEnd(name);
    });
    active.set(name, audio);
  }

  function stop(name) {
    const audio = active.get(name);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      active.delete(name);
    }
  }

  function isPlaying(name) {
    return active.has(name);
  }

  return { play: play, stop: stop, isPlaying: isPlaying };
})();

// Looping background-music player. Separate from AudioEngine: only one
// track plays at a time, it loops, and it has its own volume so a GM can
// duck the music without touching the SFX layer.
const MusicEngine = (function () {
  let audio = null;
  let currentId = null;
  let volume = 0.5;

  function playTrack(id, src) {
    if (currentId === id && audio) {
      return resume();
    }
    stop();
    const el = new Audio(src);
    el.loop = true;
    el.volume = volume;
    audio = el;
    currentId = id;
    return el.play().catch(function (err) {
      if (audio === el) {
        audio = null;
        currentId = null;
      }
      throw err;
    });
  }

  function resume() {
    return audio ? audio.play() : Promise.reject(new Error('no track loaded'));
  }

  function stop() {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    audio = null;
    currentId = null;
  }

  function setVolume(v) {
    volume = Math.min(1, Math.max(0, v));
    if (audio) audio.volume = volume;
  }

  function getVolume() {
    return volume;
  }

  function getCurrentId() {
    return currentId;
  }

  return {
    playTrack: playTrack,
    stop: stop,
    setVolume: setVolume,
    getVolume: getVolume,
    getCurrentId: getCurrentId,
  };
})();
