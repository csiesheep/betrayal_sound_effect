// One-shot SFX player. One HTMLAudioElement per active sound, so multiple
// sounds can play layered at once (per the design doc's "layer sounds
// like a mixer" concept). Every element is routed through a shared Web
// Audio graph (masterGain -> analyser -> destination) so there's one
// master volume control and one place to read live levels for the VU
// meter, without changing how individual sounds are triggered.
const AudioEngine = (function () {
  const active = new Map();
  let ctx = null;
  let masterGain = null;
  let analyser = null;
  let freqData = null;

  function ensureGraph() {
    if (ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    ctx = new Ctx();
    masterGain = ctx.createGain();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.6;
    masterGain.connect(analyser);
    analyser.connect(ctx.destination);
    freqData = new Uint8Array(analyser.frequencyBinCount);
  }

  function play(name, src, onEnd) {
    stop(name);
    ensureGraph();
    if (ctx.state === 'suspended') ctx.resume();
    const audio = new Audio(src);
    try {
      ctx.createMediaElementSource(audio).connect(masterGain);
    } catch (e) {
      // Routing into the shared graph is best-effort (e.g. VU meter);
      // playback itself doesn't depend on it succeeding.
    }
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

  function stopAll() {
    Array.from(active.keys()).forEach(stop);
  }

  function isPlaying(name) {
    return active.has(name);
  }

  function hasActive() {
    return active.size > 0;
  }

  function setVolume(v) {
    ensureGraph();
    masterGain.gain.value = Math.min(1, Math.max(0, v));
  }

  function getVolume() {
    return masterGain ? masterGain.gain.value : 1;
  }

  // Buckets the analyser's frequency data into `n` averaged levels
  // (0..1 each) for a simple bar-style VU meter.
  function getLevels(n) {
    if (!analyser) return new Array(n).fill(0);
    analyser.getByteFrequencyData(freqData);
    const bucketSize = Math.max(1, Math.floor(freqData.length / n));
    const levels = [];
    for (let i = 0; i < n; i++) {
      let sum = 0;
      const start = i * bucketSize;
      for (let j = 0; j < bucketSize; j++) sum += freqData[start + j] || 0;
      levels.push(sum / bucketSize / 255);
    }
    return levels;
  }

  return {
    play: play,
    stop: stop,
    stopAll: stopAll,
    isPlaying: isPlaying,
    hasActive: hasActive,
    setVolume: setVolume,
    getVolume: getVolume,
    getLevels: getLevels,
  };
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
