/* Polished: soft reveals for the salon's own pieces, and (on .pol-x pages)
   a gold dot in the header that follows the section being read.
   (Runs after luxe/luxe.js.) */
(function(){
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- soft reveals ---------- */
  if (!still && 'IntersectionObserver' in window){
    var picked = [];
    document.querySelectorAll('.pol-about-copy > p, .pol-about-photo, .pol-card, .pol-m-item, .pol-quotes, .pol-book-actions, .pol-map, .pol-divider').forEach(function(el){
      if (el.classList.contains('lx-reveal')) return;
      // the piece fades as one, so anything inside it is shown straight away
      el.querySelectorAll('.lx-reveal').forEach(function(c){ c.classList.add('lx-in'); });
      el.classList.add('lx-reveal'); picked.push(el);
    });
    var io = new IntersectionObserver(function(entries){
      var shown = entries.filter(function(e){ return e.isIntersecting; }).map(function(e){ return e.target; });
      shown.forEach(function(el, i){
        el.style.transitionDelay = Math.min(i * 90, 450) + 'ms';
        el.classList.add('lx-in');
        io.unobserve(el);
        setTimeout(function(){ el.style.transitionDelay = ''; }, 1800);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    picked.forEach(function(el){ io.observe(el); });
    var pending = false;
    window.addEventListener('scroll', function(){
      if (pending) return; pending = true;
      setTimeout(function(){
        pending = false;
        var limit = window.innerHeight * 0.92;
        picked.forEach(function(el){
          if (!el.classList.contains('lx-in') && el.getBoundingClientRect().top < limit){ el.classList.add('lx-in'); io.unobserve(el); }
        });
      }, 120);
    }, { passive: true });
  }

  /* ---------- header: gold dot under the current section ---------- */
  var nav = document.querySelector('.pol-nav');
  if (!nav || !document.body.classList.contains('pol-x')) return;
  var links = [].slice.call(nav.querySelectorAll('a[href^="#"]')).filter(function(a){
    return a.getAttribute('href').length > 1 && !a.classList.contains('pol-book-btn');
  });
  var targets = links.map(function(a){ return document.querySelector(a.getAttribute('href')); });
  var dot = document.createElement('span');
  dot.className = 'pol-nav-dot';
  dot.setAttribute('aria-hidden', 'true');
  nav.appendChild(dot);
  var current = -1;
  function place(){
    var line = window.innerHeight * 0.35, idx = -1;
    targets.forEach(function(t, i){
      if (!t) return;
      var r = t.getBoundingClientRect();
      if (r.top <= line && r.bottom > line) idx = i;
    });
    if (idx !== current){
      current = idx;
      links.forEach(function(a, i){ a.classList.toggle('is-current', i === idx); });
    }
    if (idx < 0){ dot.classList.remove('is-on'); return; }
    var a = links[idx];
    dot.style.left = (a.offsetLeft + a.offsetWidth / 2) + 'px';
    dot.classList.add('is-on');
  }
  var queued = false;
  window.addEventListener('scroll', function(){
    if (queued) return; queued = true;
    requestAnimationFrame(function(){ queued = false; place(); });
  }, { passive: true });
  window.addEventListener('resize', place);
  place();
})();
