// Minimal one-shot SFX player. One HTMLAudioElement per active sound,
// so multiple sounds can play layered at once (per the design doc's
// "layer sounds like a mixer" concept). No bus/gain nodes yet — that's
// the next step once there are enough sounds to need per-category
// volume control.
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
