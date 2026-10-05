/* Soft reveals and page-to-page fades.
   (The first-visit opening and the arrival fade run from a tiny inline
   script at the top of <body>, so they start before anything paints.) */
(function(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  /* ---------- soft reveals ---------- */
  var SKIP = 'header, footer, .scrub-wrap, .film-runway, .scrub-progress, .lx-veil, .app-soon';
  var STICKY = '.about-v2-photo, .story-photo, .ivB-stage, .ivB, .dx-tabs, .psx-hero';
  var REVEAL = [
    'main h1', 'main h2', 'main h3', 'section h2', 'section h3', 'section h4',
    '.eyebrow', '.lede', '.dx-lede', '.psx-lede', '.psx-rule',
    '.story-text > *', '.about-v2-copy > *', '.banner-copy > *', '.closing > *', '.cta > *',
    '.service-tile', '.rev-card', '.family-item', '.idx-cols > div', '.ivB-row',
    '.psx-col li', '.psx-g', '.dx-media', '.dx-faq details', '.duo-photos > *', '.full-photo',
    '.page-banner .phone-mock', '.lx-divider'
  ].join(',');
  var picked = [];
  document.querySelectorAll(REVEAL).forEach(function(el){
    if (el.closest(SKIP) || el.closest(STICKY) || el.matches(STICKY)) return;
    for (var p = el.parentElement; p; p = p.parentElement) if (p.classList.contains('lx-reveal')) return;
    el.classList.add('lx-reveal'); picked.push(el);
  });
  var io = new IntersectionObserver(function(entries){
    var shown = entries.filter(function(e){ return e.isIntersecting; }).map(function(e){ return e.target; });
    shown.sort(function(a, b){ return a.compareDocumentPosition(b) & 4 ? -1 : 1; });
    shown.forEach(function(el, i){
      el.style.transitionDelay = Math.min(i * 90, 450) + 'ms';
      el.classList.add('lx-in');
      io.unobserve(el);
      setTimeout(function(){ el.style.transitionDelay = ''; }, 1800);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  picked.forEach(function(el){ io.observe(el); });
  // Safety net: a fast fling can skip past items; anything already above the
  // bottom of the screen is revealed straight away.
  var pending = false;
  function sweep(){
    pending = false;
    var limit = window.innerHeight * 0.92;
    picked.forEach(function(el){
      if (el.classList.contains('lx-in')) return;
      if (el.getBoundingClientRect().top < limit){ el.classList.add('lx-in'); io.unobserve(el); }
    });
  }
  window.addEventListener('scroll', function(){ if (!pending){ pending = true; setTimeout(sweep, 120); } }, { passive: true });

  /* ---------- page-to-page fade ---------- */
  document.addEventListener('click', function(e){
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return;   // in-page anchor
    if (!/\.html?$|\/$/.test(url.pathname)) return;
    e.preventDefault();
    var v = document.createElement('div');
    v.className = 'lx-veil lx-leave';
    document.body.appendChild(v);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ v.classList.add('lx-on'); }); });
    setTimeout(function(){ location.href = url.href; }, 380);
  });
  // coming back with the browser's back button: drop any leftover veil
  window.addEventListener('pageshow', function(e){
    if (e.persisted) document.querySelectorAll('.lx-veil').forEach(function(v){ v.remove(); });
  });
})();
