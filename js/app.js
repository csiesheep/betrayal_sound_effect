// Renders the soundboard from data/catalog.json (the planned entity
// list per category) cross-referenced against data/sounds.json (what's
// actually been sourced). Entries with a matching sound get a custom
// icon + real playback; everything else shows the "needs art" dashed
// placeholder from the approved design. Category tabs + search filter
// which sound buttons are visible; nothing is re-rendered on filter.
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
    'Burning Figure': 'i-burning-figure',
    'Cassette Player': 'i-cassette-player',
    'Clown Room': 'i-clown-room',
    'Creaking Door': 'i-creaking-door',
    'Dark and Stormy Night': 'i-dark-and-stormy-night',
    'Eerie Mirror': 'i-eerie-mirror',
    'Flickering Lights': 'i-flickering-lights',
    'Forbidden Knowledge': 'i-forbidden-knowledge',
    'Funeral': 'i-funeral',
    'Hanged Men': 'i-hanged-men',
    'Impossible Architecture': 'i-impossible-architecture',
    "Jonah's Turn": 'i-jonahs-turn',
    'Lab of Organs': 'i-lab-of-organs',
    'Meat Moss': 'i-meat-moss',
    'Mysterious Fluid': 'i-mysterious-fluid',
    'Phone Call': 'i-phone-call',
    'Poor Yorick': 'i-poor-yorick',
    'Radio Broadcast': 'i-radio-broadcast',
    'Say Cheese': 'i-say-cheese',
    'Secret Elevator': 'i-secret-elevator',
    'Severed Hand': 'i-severed-hand',
    'Spiders!': 'i-spiders',
    'Taxidermy': 'i-taxidermy',
    'Technical Difficulties': 'i-technical-difficulties',
    'The Deepest Closet': 'i-the-deepest-closet',
    'The Flowering': 'i-the-flowering',
    'The House Is Hungry': 'i-the-house-is-hungry',
    'The Oldest House': 'i-the-oldest-house',
    'The Stars at Night': 'i-the-stars-at-night',
    'Tiny Ghost': 'i-tiny-ghost',
    'Wandering Ghost': 'i-wandering-ghost',
    'Armor': 'i-armor',
    'Book': 'i-book',
    'Dagger': 'i-dagger',
    'Dog': 'i-dog',
    'Holy Symbol': 'i-holy-symbol',
    'Idol': 'i-idol',
    'Mask': 'i-mask',
    'Ring': 'i-ring',
    'Skull': 'i-omen-skull',
    'Armory': 'i-armory',
    'Basement Landing': 'i-basement-landing',
    'Bloody Room': 'i-bloody-room',
    'Catacombs': 'i-catacombs',
    'Chapel': 'i-chapel',
    'Charred Room': 'i-charred-room',
    'Chasm': 'i-chasm',
    'Collapsed Room': 'i-collapsed-room',
    'Conservatory': 'i-conservatory',
    'Cramped Passageway': 'i-cramped-passageway',
    'Crawlspace': 'i-crawlspace',
    'Dining Room': 'i-dining-room',
    'Entrance Hall': 'i-entrance-hall',
    'Furnace Room': 'i-furnace-room',
    'Gallery': 'i-gallery',
    'Game Room': 'i-game-room',
    'Graveyard': 'i-graveyard',
    'Ground Floor Staircase': 'i-ground-floor-staircase',
    'Guest Quarters': 'i-guest-quarters',
    'Gymnasium': 'i-gymnasium',
    'Hallway': 'i-hallway',
    'Junk Room': 'i-junk-room',
    'Kitchen': 'i-kitchen',
    'Laboratory': 'i-laboratory',
    'Larder': 'i-larder',
    'Laundry Chute': 'i-laundry-chute',
    'Library': 'i-library',
    'Mystic Elevator': 'i-mystic-elevator',
    'Nursery': 'i-nursery',
    'Observatory': 'i-observatory',
    'Operating Theatre': 'i-operating-theatre',
    'Organ Room': 'i-organ-room',
    'Panic Room': 'i-panic-room',
    'Primary Bedroom': 'i-primary-bedroom',
    'Ritual Room': 'i-ritual-room',
    'Salon': 'i-salon',
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
  const tabsEl = document.getElementById('category-tabs');
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  const noResults = document.getElementById('no-results');
  const noResultsTerm = document.getElementById('no-results-term');

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  // ---------- Category panels (always rendered; tabs + search toggle visibility) ----------

  const panels = [];

  catalog.categories.forEach(function (cat) {
    const sourcedCount = cat.entries.filter(function (name) { return byTag.has(name); }).length;

    const panel = document.createElement('section');
    panel.className = 'cat-panel';
    panel.setAttribute('data-cat-id', cat.id);

    const head = document.createElement('div');
    head.className = 'cat-head';
    head.innerHTML =
      '<svg class="cat-icon"><use href="#' + (cat.icon || 'i-placeholder') + '"></use></svg>' +
      '<span class="cat-name">' + escapeHtml(cat.name) + '</span>' +
      '<span class="cat-count">' + sourcedCount + ' of ' + cat.entries.length + ' sourced</span>';
    panel.appendChild(head);

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
          (sourced ? '<span class="waveform"><span></span><span></span><span></span><span></span><span></span></span>' : '') +
          '<span class="label">' + escapeHtml(name) +
            (sourced ? '' : '<span class="needs-art sr-only">needs art</span>') +
          '</span>' +
        '</span>';

      if (sourced) {
        btn.addEventListener('click', function () {
          const playing = btn.classList.toggle('is-playing');
          if (playing) {
            AudioEngine.play(name, sound.file, function () {
              btn.classList.remove('is-playing');
            });
          } else {
            AudioEngine.stop(name);
          }
        });
      }

      grid.appendChild(btn);
    });

    panel.appendChild(grid);
    container.appendChild(panel);
    panels.push(panel);
  });

  // ---------- Category tabs ----------

  let activeTab = 'all';

  const tabDefs = [{ id: 'all', name: 'All' }].concat(
    catalog.categories.map(function (c) { return { id: c.id, name: c.name }; })
  );

  tabDefs.forEach(function (t) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tab-btn';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('data-tab-id', t.id);
    btn.textContent = t.name;
    if (t.id === 'all') btn.classList.add('is-active');
    btn.addEventListener('click', function () {
      activeTab = t.id;
      tabsEl.querySelectorAll('.tab-btn').forEach(function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-tab-id') === t.id);
      });
      applyFilters();
    });
    tabsEl.appendChild(btn);
  });

  // ---------- Search ----------

  function applyFilters() {
    const term = searchInput.value.trim().toLowerCase();
    let anyVisible = false;

    panels.forEach(function (panel) {
      const catId = panel.getAttribute('data-cat-id');
      const tabMatches = activeTab === 'all' || activeTab === catId;
      let panelHasVisible = false;

      panel.querySelectorAll('.sound-btn').forEach(function (btn) {
        if (!tabMatches) {
          btn.hidden = true;
          return;
        }
        const name = btn.getAttribute('data-name').toLowerCase();
        const match = !term || name.indexOf(term) !== -1;
        btn.hidden = !match;
        if (match) panelHasVisible = true;
      });

      panel.hidden = !tabMatches || !panelHasVisible;
      if (!panel.hidden) anyVisible = true;
    });

    noResults.hidden = anyVisible;
    if (!anyVisible && noResultsTerm) noResultsTerm.textContent = searchInput.value.trim();
  }

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      searchClear.hidden = !searchInput.value;
      applyFilters();
    });
  }

  if (searchClear) {
    searchClear.addEventListener('click', function () {
      searchInput.value = '';
      searchClear.hidden = true;
      applyFilters();
      searchInput.focus();
    });
  }

  applyFilters();
})();

// Background music panel: fetches data/music.json, renders the track
// list + now-playing bar, and prints on-page credits for each track
// (title, artist, license, source link) per the sourcing terms.
(async function () {
  const tracksRes = await fetch('data/music.json');
  const tracks = await tracksRes.json();

  const trackList = document.getElementById('music-tracks');
  const player = document.getElementById('music-player');
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
    player.classList.add('is-active');
    nowEl.textContent = track.title;
  }

  function hidePlayer() {
    player.classList.remove('is-active');
    setActiveButton(null);
  }

  tracks.forEach(function (track) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'track-btn';
    btn.setAttribute('data-id', track.id);
    btn.innerHTML =
      '<span class="vinyl" aria-hidden="true">𝄞</span>' +
      '<span class="track-info">' +
        '<span class="track-title">' +
          '<span class="track-title-track">' +
            '<span class="track-title-copy">' + escapeHtml(track.title) + '</span>' +
            '<span class="track-title-copy" aria-hidden="true">' + escapeHtml(track.title) + '</span>' +
          '</span>' +
        '</span>' +
        '<span class="track-artist">' + escapeHtml(track.artist) + '</span>' +
      '</span>' +
      '<span class="waveform track-waveform" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></span>' +
      '<span class="loop-badge">Loop</span>';
    btn.addEventListener('click', function () {
      // Click again on the already-loaded track stops it; only one
      // track can ever be loaded in MusicEngine at a time, so playing
      // a different track always auto-stops whatever was playing.
      if (MusicEngine.getCurrentId() === track.id) {
        MusicEngine.stop();
        hidePlayer();
        return;
      }
      MusicEngine.playTrack(track.id, track.file).then(function () {
        setActiveButton(track.id);
        showPlayer(track);
      }).catch(function () {
        hidePlayer();
      });
    });

    // On hover, loop the title within the button's own clipped viewport
    // if it's too long to fit; titles that already fit stay still.
    const titleOuter = btn.querySelector('.track-title');
    const titleTrack = btn.querySelector('.track-title-track');
    const titleCopy = titleTrack.querySelector('.track-title-copy');
    btn.addEventListener('mouseenter', function () {
      const overflow = titleCopy.scrollWidth - titleOuter.clientWidth;
      if (overflow > 0) {
        const duration = Math.max(3, titleCopy.scrollWidth / 40);
        titleTrack.style.setProperty('--marquee-duration', duration + 's');
        titleTrack.classList.add('is-looping');
      }
    });
    btn.addEventListener('mouseleave', function () {
      titleTrack.classList.remove('is-looping');
    });

    trackList.appendChild(btn);
  });

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
