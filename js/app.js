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
