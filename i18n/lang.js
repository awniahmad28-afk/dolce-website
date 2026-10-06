/* Language picker: in the header, a thin globe with the current language
   (EN / KU / AR) that opens a small card with English, کوردی and العربية;
   on phones, a row of the three at the foot of the fold-out menu.
   Each page has a Kurdish (-ku) and Arabic (-ar) twin next to it. */
(function(){
  var host = document.querySelector('.head-right, .pol-head-right');
  if (!host || host.querySelector('.lang-pick')) return;

  var file = location.pathname.split('/').pop() || 'index.html';
  var m = file.match(/^(.*?)(?:-(ku|ar))?\.html?$/);
  var base = (m && m[1]) || 'index';
  var cur = (m && m[2]) || 'en';
  var langs = [
    { k: 'en', sfx: '',    code: 'EN', name: 'English', lang: 'en' },
    { k: 'ku', sfx: '-ku', code: 'KU', name: 'کوردی',  lang: 'ckb' },
    { k: 'ar', sfx: '-ar', code: 'AR', name: 'العربية', lang: 'ar' }
  ];
  var now = langs.filter(function(l){ return l.k === cur; })[0] || langs[0];
  var label = { en: 'Language', ku: 'زمان', ar: 'اللغة' }[cur];

  var wrap = document.createElement('div');
  wrap.className = 'lang-pick';
  wrap.innerHTML =
    '<button type="button" class="lang-btn" aria-haspopup="true" aria-expanded="false" aria-label="' + label + ': ' + now.name + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3z"/></svg>' +
      '<span>' + now.code + '</span>' +
    '</button>' +
    '<div class="lang-menu">' +
      langs.map(function(l){
        return '<a href="' + base + l.sfx + '.html" lang="' + l.lang + '" hreflang="' + l.lang + '"' +
          (l.k === cur ? ' aria-current="page"' : '') + '>' + l.name + '</a>';
      }).join('') +
    '</div>';
  host.insertBefore(wrap, host.firstChild);

  // phones: the header row is full, so the same choice sits at the foot of
  // the fold-out menu as one quiet row
  var nav = document.querySelector('nav.mainnav, nav.pol-nav');
  if (nav){
    var row = document.createElement('div');
    row.className = 'lang-row';
    row.setAttribute('aria-label', label);
    row.innerHTML = langs.map(function(l){
      return '<a href="' + base + l.sfx + '.html" lang="' + l.lang + '" hreflang="' + l.lang + '"' +
        (l.k === cur ? ' aria-current="page"' : '') + '>' + l.name + '</a>';
    }).join('');
    nav.appendChild(row);
  }

  // a language picked here is remembered, and wins over the browser's
  // language from then on (see the check at the top of the English pages)
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('.lang-menu a, .lang-row a');
    if (!a) return;
    var k = { en: 'en', ckb: 'ku', ar: 'ar' }[a.getAttribute('lang')];
    try { localStorage.setItem('dolce-lang', k); } catch (err) {}
  });

  var btn = wrap.querySelector('.lang-btn');
  function set(open){
    wrap.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  btn.addEventListener('click', function(e){ e.stopPropagation(); set(!wrap.classList.contains('open')); });
  document.addEventListener('click', function(e){ if (!wrap.contains(e.target)) set(false); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && wrap.classList.contains('open')){ set(false); btn.focus(); } });
  window.addEventListener('scroll', function(){ if (wrap.classList.contains('open')) set(false); }, { passive: true });
})();
