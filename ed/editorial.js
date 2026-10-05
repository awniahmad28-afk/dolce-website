/* EDITORIAL TEST: reviews show one large quote at a time and fade to the
   next every 7 s; dots pick one, hover/touch pauses, swipe on phones. */
(function(){
  var box = document.querySelector('[data-ed-quotes]'); if (!box) return;
  var quotes = [].slice.call(box.querySelectorAll('.ed-quote'));
  var dots = [].slice.call(box.querySelectorAll('.ed-dots button'));
  var cur = 0, timer = null, paused = false;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function show(i){
    cur = (i + quotes.length) % quotes.length;
    quotes.forEach(function(q, k){ q.classList.toggle('is-on', k === cur); q.setAttribute('aria-hidden', k === cur ? 'false' : 'true'); });
    dots.forEach(function(d, k){ d.classList.toggle('is-on', k === cur); d.setAttribute('aria-current', k === cur ? 'true' : 'false'); });
  }
  function next(){ if (!paused && !document.hidden) show(cur + 1); }
  function start(){ if (!still){ clearInterval(timer); timer = setInterval(next, 7000); } }
  dots.forEach(function(d, k){ d.addEventListener('click', function(){ show(k); start(); }); });
  box.addEventListener('mouseenter', function(){ paused = true; });
  box.addEventListener('mouseleave', function(){ paused = false; });
  box.addEventListener('focusin', function(){ paused = true; });
  box.addEventListener('focusout', function(){ paused = false; });
  var tx = null;
  box.addEventListener('touchstart', function(e){ tx = e.touches[0].clientX; paused = true; }, { passive: true });
  box.addEventListener('touchend', function(e){
    paused = false;
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 40){ show(cur + (dx < 0 ? 1 : -1)); start(); }
  });
  show(0); start();
})();
