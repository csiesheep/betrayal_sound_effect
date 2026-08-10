// Renders the soundboard from data/catalog.json (the planned entity
// list per category) cross-referenced against data/sounds.json (what's
// actually been sourced). Entries with a matching sound get a custom
// icon + real playback; everything else shows the "needs art" dashed
// placeholder from the approved design.
(async function () {
  const ICONS = {
    'Flashlight': 'i-flashlight',
    'Chainsaw': 'i-chainsaw',
    'Zombie': 'i-skull',
    'Ghost': 'i-ghost',
    'Crossbow': 'i-crossbow',
    'Dynamite': 'i-dynamite',
    'Gun': 'i-gun',
    'Machete': 'i-machete',
    "Angel's Feather": 'i-angels-feather',
    'Brooch': 'i-brooch',
    'Creepy Doll': 'i-creepy-doll',
    'First Aid Kit': 'i-first-aid-kit',
    'Headphones': 'i-headphones',
    'Leather Jacket': 'i-leather-jacket',
    'Lucky Coin': 'i-lucky-coin',
    'Magic Camera': 'i-magic-camera',
    'Map': 'i-map',
    'Mirror': 'i-mirror',
    'Mystical Stopwatch': 'i-mystical-stopwatch',
    'Necklace of Teeth': 'i-necklace-of-teeth',
    "Rabbit's Foot": 'i-rabbits-foot',
    'Skeleton Key': 'i-skeleton-key',
    'Strange Amulet': 'i-strange-amulet',
    'Strange Medicine': 'i-strange-medicine',
    'A Bite!': 'i-a-bite',
    'A Cry for Help': 'i-a-cry-for-help',
    'A Full Table': 'i-a-full-table',
    'A Moment of Hope': 'i-a-moment-of-hope',
    'A Secret Passage': 'i-a-secret-passage',
    'A Splash of Crimson': 'i-a-splash-of-crimson',
    'A Vial of Dust': 'i-a-vial-of-dust',
    'An Eerie Feeling': 'i-an-eerie-feeling',
    'Bat Out of Hell': 'i-bat-out-of-hell',
    'Behind You!': 'i-behind-you',
    'Brain Food': 'i-brain-food',
  };

  const [catalogRes, soundsRes] = await Promise.all([
    fetch('data/catalog.json'),
    fetch('data/sounds.json'),
  ]);
  const catalog = await catalogRes.json();
  const sounds = await soundsRes.json();

  const byTag = new Map();
  sounds.forEach(function (s) { byTag.set(s.tag, s); });

  const container = document.getElementById('categories');
  const chips = document.getElementById('chips');
  const mixerEmpty = document.getElementById('mixer-empty');

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function refreshEmpty() {
    const hasChips = chips.querySelector('.chip');
    if (mixerEmpty) mixerEmpty.style.display = hasChips ? 'none' : 'block';
  }

  function removeChip(name) {
    const chip = chips.querySelector('[data-chip="' + CSS.escape(name) + '"]');
    if (chip) chip.remove();
    const btn = container.querySelector('.sound-btn[data-name="' + CSS.escape(name) + '"]');
    if (btn) btn.classList.remove('is-playing');
    AudioEngine.stop(name);
    refreshEmpty();
  }

  function addChip(name) {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.setAttribute('data-chip', name);
    chip.innerHTML = escapeHtml(name) +
      '<button type="button" aria-label="Stop ' + escapeHtml(name) + '"><svg><use href="#i-close"></use></svg></button>';
    chip.querySelector('button').addEventListener('click', function () { removeChip(name); });
    chips.appendChild(chip);
    refreshEmpty();
  }

  catalog.categories.forEach(function (cat, idx) {
    const sourcedCount = cat.entries.filter(function (name) { return byTag.has(name); }).length;

    const details = document.createElement('details');
    details.className = 'category';
    if (idx === 0) details.open = true;

    const summary = document.createElement('summary');
    summary.className = 'cat-head';
    summary.innerHTML =
      '<svg class="cat-icon"><use href="#' + (cat.icon || 'i-placeholder') + '"></use></svg>' +
      '<span class="cat-name">' + escapeHtml(cat.name) + '</span>' +
      '<span class="cat-count">' + sourcedCount + ' of ' + cat.entries.length + ' sourced</span>' +
      '<span class="cat-spacer"></span>' +
      '<svg class="chevron"><use href="#i-chevron"></use></svg>';
    details.appendChild(summary);

    const body = document.createElement('div');
    body.className = 'cat-body';
    const grid = document.createElement('div');
    grid.className = 'grid';

    cat.entries.forEach(function (name) {
      const sound = byTag.get(name);
      const sourced = !!sound;
      const iconId = sourced ? (ICONS[name] || cat.icon || 'i-placeholder') : 'i-placeholder';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sound-btn';
      btn.setAttribute('data-sourced', sourced ? 'true' : 'false');
      btn.setAttribute('data-name', name);
      if (!sourced) btn.disabled = true;

      btn.innerHTML =
        '<span class="tile">' +
          '<svg><use href="#' + iconId + '"></use></svg>' +
          (sourced ? '<span class="play-badge"><svg><use href="#i-play"></use></svg></span>' : '') +
        '</span>' +
        '<span class="label">' + escapeHtml(name) +
          (sourced ? '' : '<span class="needs-art">needs art</span>') +
        '</span>';

      if (sourced) {
        btn.addEventListener('click', function () {
          const playing = btn.classList.toggle('is-playing');
          if (playing) {
            AudioEngine.play(name, sound.file, function () {
              btn.classList.remove('is-playing');
              removeChip(name);
            });
            addChip(name);
          } else {
            removeChip(name);
          }
        });
      }

      grid.appendChild(btn);
    });

    body.appendChild(grid);
    details.appendChild(body);
    container.appendChild(details);
  });

  refreshEmpty();
})();

// Background music panel: fetches data/music.json, renders the track
// list + now-playing bar, and prints on-page credits for each track
// (title, artist, license, source link) per the sourcing terms.
(async function () {
  const tracksRes = await fetch('data/music.json');
  const tracks = await tracksRes.json();

  const trackList = document.getElementById('music-tracks');
  const player = document.getElementById('music-player');
  const toggleBtn = document.getElementById('music-toggle');
  const stopBtn = document.getElementById('music-stop');
  const nowEl = document.getElementById('music-now');
  const volumeInput = document.getElementById('music-volume');
  const creditsList = document.getElementById('music-credits');
  if (!trackList) return;

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function setActiveButton(id) {
    trackList.querySelectorAll('.track-btn').forEach(function (btn) {
      btn.classList.toggle('is-playing', btn.getAttribute('data-id') === id);
    });
  }

  function showPlayer(track) {
    player.hidden = false;
    nowEl.textContent = track.title;
    toggleBtn.classList.remove('is-paused');
    toggleBtn.setAttribute('aria-label', 'Pause');
  }

  function hidePlayer() {
    player.hidden = true;
    setActiveButton(null);
  }

  tracks.forEach(function (track) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'track-btn';
    btn.setAttribute('data-id', track.id);
    btn.innerHTML =
      '<svg class="track-icon"><use href="#i-play"></use></svg>' +
      '<span class="track-info">' +
        '<span class="track-title">' + escapeHtml(track.title) + '</span>' +
        '<span class="track-artist">' + escapeHtml(track.artist) + '</span>' +
      '</span>';
    btn.addEventListener('click', function () {
      MusicEngine.playTrack(track.id, track.file).then(function () {
        setActiveButton(track.id);
        showPlayer(track);
      }).catch(function () {
        hidePlayer();
      });
    });
    trackList.appendChild(btn);
  });

  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      if (MusicEngine.isPaused()) {
        MusicEngine.resume().catch(function () {});
        toggleBtn.classList.remove('is-paused');
        toggleBtn.setAttribute('aria-label', 'Pause');
      } else {
        MusicEngine.pause();
        toggleBtn.classList.add('is-paused');
        toggleBtn.setAttribute('aria-label', 'Play');
      }
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', function () {
      MusicEngine.stop();
      hidePlayer();
    });
  }

  if (volumeInput) {
    volumeInput.value = MusicEngine.getVolume();
    volumeInput.addEventListener('input', function () {
      MusicEngine.setVolume(parseFloat(volumeInput.value));
    });
  }

  if (creditsList) {
    tracks.forEach(function (track) {
      const li = document.createElement('li');
      li.innerHTML =
        '<span class="credit-title">' + escapeHtml(track.title) + '</span>' +
        ' — ' + escapeHtml(track.artist) +
        ' · ' + escapeHtml(track.license) +
        ' · <a href="' + escapeHtml(track.source_url) + '" target="_blank" rel="noopener noreferrer">source</a>';
      creditsList.appendChild(li);
    });
  }
})();
