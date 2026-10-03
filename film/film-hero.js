/* Scroll-scrubbed film hero (test 3). No libraries.
 * Two delivery paths, chosen in the <head> script (window.__film):
 *  - frames-l / frames-p: decoded webp frames on a canvas (phones, non-retina)
 *  - video: the whole mp4 downloaded into memory and scrubbed directly
 *    (hi-DPI laptops), with a measured fallback to frames.
 * Progress comes from page scroll over a tall runway; a rAF loop eases the
 * shown position towards it. The Dolce logo emerges on the curtain over the
 * last 6 frames, tracked to the camera drift. */
(function(){
  var F = window.__film;
  if (!F || F.reduce) return;

  var N = 102, FPS = 30, FILM_END = 0.8, LOGO_FRAMES = 6;
  var runway = document.getElementById('film');
  if (!runway) return;
  var stage = runway.querySelector('.film-stage');
  var video = stage.querySelector('.film-video');
  var canvas = stage.querySelector('.film-canvas');
  var poster = document.getElementById('film-poster');
  var logo = stage.querySelector('.film-logo');
  var cue = stage.querySelector('.film-loading');
  var bar = document.getElementById('scrub-progress-bar');

  var land = F.land;
  var REF_W = land ? 2048 : 1080, REF_H = land ? 1152 : 1920;
  var LOGO = land ? { cx: 1045, cy: 235, w: 420 } : { cx: 495, cy: 725, w: 430 };
  var TRACK = land ? [[0.99526,-0.00323,9.03516,-0.00032,0.99635,37.3306],[0.99347,-1e-05,-1.46028,0.0003,0.99059,45.3597],[0.99451,0.00064,-7.32874,0.00058,0.9907,38.6261],[0.99594,0.00047,-17.3707,0.00189,0.98872,23.6243],[0.9981,0.00071,-14.9993,0.00161,0.99234,4.66336],[1,0,0,0,1,0]] : [[0.95352,0.00134,16.9634,0.00961,0.9366,34.0443],[0.95664,0.00231,16.199,0.00881,0.93962,31.7328],[0.96021,0.00236,13.1021,0.0082,0.94237,30.4296],[0.96427,0.00185,11.0151,0.00827,0.94585,27.11],[0.97163,0.0025,11.2277,0.00875,0.95249,19.6958],[1,0,0,0,1,0]];

  function clamp01(v){ return v < 0 ? 0 : v > 1 ? 1 : v; }

  /* ---------- state ---------- */
  var target = 0, current = -1, raf = null, lastTime = 0;
  var useVideo = F.mode === 'video';
  var hybrid = false;            // frames for motion, video for the sharp still
  var videoReady = false, framesStarted = false;
  var posterRetired = false, scrolled = false;

  /* ---------- scroll -> progress ---------- */
  function readProgress(){
    var travel = runway.offsetHeight - window.innerHeight;
    var p = travel > 0 ? clamp01(-runway.getBoundingClientRect().top / travel) : 0;
    target = clamp01(p / FILM_END);
  }
  function kick(){ if (raf === null) raf = requestAnimationFrame(tick); }
  function onScroll(){ scrolled = true; readProgress(); kick(); }

  function tick(now){
    var dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016; lastTime = now;
    var k = 1 - Math.exp(-7 * dt);
    current = current < 0 ? target : current + (target - current) * k;
    if (Math.abs(target - current) < 0.0004) current = target;
    render(current);
    if (current !== target){ raf = requestAnimationFrame(tick); return; }
    // Settled. Frames: never rest on a crossfade between two frames.
    if (!useVideo || hybrid){
      // snap only to one of the two neighbouring frames, and only if decoded
      var x = current * (N - 1) + 1, lo = Math.floor(x), hi = Math.min(lo + 1, N);
      var n = (x - lo < 0.5 ? (ready[lo] ? lo : ready[hi] ? hi : 0) : (ready[hi] ? hi : ready[lo] ? lo : 0));
      if (n && Math.abs(n - x) > 0.001){ target = (n - 1) / (N - 1); raf = requestAnimationFrame(tick); return; }
    }
    raf = null; lastTime = 0;
    onRest();
  }

  function render(fp){
    var x = fp * (N - 1) + 1;
    if (bar) bar.style.width = (fp * 100) + '%';
    placeLogo(x);
    if (useVideo && !hybrid) seekTo(frameTime(x));
    else { drawFrames(x); if (hybrid) showCanvas(true); }
    if (!posterRetired && scrolled && x > 1.02 && (!useVideo || hybrid) && canvasDrawn) retirePoster();
  }

  function frameTime(x){ // centre of the frame, never past the end
    return Math.min((x - 0.5) / FPS, N / FPS - 0.25 / FPS);
  }

  /* ---------- poster ---------- */
  function retirePoster(){
    if (posterRetired) return;
    posterRetired = true;
    if (useVideo) video.style.visibility = 'visible';
    poster.classList.add('is-retired');
  }

  /* ---------- logo on the curtain ---------- */
  var logoShown = false;
  function placeLogo(x){
    var k = x - (N - LOGO_FRAMES);
    if (k <= 0 || !logo.naturalWidth){
      if (logoShown){ logo.style.opacity = '0'; logoShown = false; }
      return;
    }
    var t = Math.min(k / LOGO_FRAMES, 1), e = t * t * (3 - 2 * t);
    var j = Math.min(Math.max(Math.floor(k), 1), LOGO_FRAMES), f = Math.min(Math.max(k - j, 0), 1);
    var A = TRACK[j - 1], B = TRACK[Math.min(j, LOGO_FRAMES - 1)], m = [];
    for (var i = 0; i < 6; i++) m[i] = A[i] + (B[i] - A[i]) * f;
    var W = stage.clientWidth, H = stage.clientHeight;
    var s = Math.max(W / REF_W, H / REF_H), ox = (W - REF_W * s) / 2, oy = (H - REF_H * s) / 2;
    var w = LOGO.w * (0.94 + 0.06 * e), h = w * logo.naturalHeight / logo.naturalWidth;
    var x0 = LOGO.cx - w / 2, y0 = LOGO.cy - h / 2;
    logo.style.width = w + 'px';
    logo.style.transform = 'matrix(' + [s * m[0], s * m[3], s * m[1], s * m[4],
      s * (m[0] * x0 + m[1] * y0 + m[2]) + ox, s * (m[3] * x0 + m[4] * y0 + m[5]) + oy].join(',') + ')';
    logo.style.opacity = (e * 0.92).toFixed(3);
    var blur = (1 - e) * 10;
    logo.style.filter = blur > 0.3 ? 'blur(' + blur.toFixed(1) + 'px)' : 'none';
    logoShown = true;
  }

  /* ---------- path A: webp frames on a canvas ---------- */
  var ctx = null, imgs = new Array(N + 1), ready = new Array(N + 1), inflight = 0, skeleton = [], skeletonAll = [];
  var canvasDrawn = false, shownX = 0;
  var frameDir = land ? 'film/frames-l/f-' : (F.framesP || 'film/frames-p/f-');
  var MAX_DPR = F.maxDpr || 2;           // test 4: phones draw at their full sharpness (3x)

  function startFrames(){
    if (framesStarted) return;
    framesStarted = true;
    ctx = canvas.getContext('2d', { alpha: false });
    smoothing();
    for (var i = 1; i <= N; i += 6) skeleton.push(i);
    if (skeleton[skeleton.length - 1] !== N) skeleton.push(N);
    skeletonAll = skeleton.slice();
    sizeCanvas();
    pump();
  }
  function nextToLoad(){
    while (skeleton.length){ var s = skeleton.shift(); if (!imgs[s]) return s; }
    var c = Math.round(Math.max(current, 0) * (N - 1) + 1);
    for (var d = 0; d < N; d++){
      if (c - d >= 1 && !imgs[c - d]) return c - d;
      if (c + d <= N && !imgs[c + d]) return c + d;
    }
    return 0;
  }
  function pump(){
    while (inflight < 6){
      var i = nextToLoad(); if (!i) return;
      load(i);
    }
  }
  function load(i){
    var img = new Image();
    img.decoding = 'async';
    try { img.fetchPriority = 'low'; } catch (e) {}
    imgs[i] = img; inflight++;
    img.src = frameDir + String(i).padStart(4, '0') + '.webp';
    img.decode().then(function(){
      ready[i] = true; inflight--; pump();
      var x = Math.max(current, 0) * (N - 1) + 1;
      if (Math.abs(i - x) <= 8 && (!useVideo || hybrid)) drawFrames(x);
      onFirstFrames();
    }, function(){ inflight--; imgs[i] = null; setTimeout(pump, 400); });
  }
  function nearestReady(c, within){
    for (var d = 0; d <= within; d++){
      if (c - d >= 1 && ready[c - d]) return c - d;
      if (c + d <= N && ready[c + d]) return c + d;
    }
    return 0;
  }
  function sizeCanvas(){
    var dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    var w = Math.max(1, Math.round(stage.clientWidth * dpr)), h = Math.max(1, Math.round(stage.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h){ canvas.width = w; canvas.height = h; smoothing(); return true; }
    return false;
  }
  function smoothing(){            // resizing a canvas resets this, so set it again after every resize
    if (ctx && F.smoothHigh){ ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; }
  }
  function cover(img, alpha){
    var cw = canvas.width, ch = canvas.height, iw = img.naturalWidth, ih = img.naturalHeight;
    var s = Math.max(cw / iw, ch / ih), w = iw * s, h = ih * s;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }
  function drawFrames(x){
    if (!ctx) return;
    var base = Math.floor(x), frac = x - base;
    if (ready[base]){
      cover(imgs[base], 1);
      if (frac > 0.001 && base < N && ready[base + 1]) cover(imgs[base + 1], frac);
      ctx.globalAlpha = 1;
    } else {
      var n = nearestReady(Math.round(x), 8);
      if (!n) return;                       // keep the previous picture
      cover(imgs[n], 1);
    }
    shownX = x;
    if (!canvasDrawn){ canvasDrawn = true; canvas.hidden = false; }
  }
  function showCanvas(on){ canvas.style.visibility = on ? 'visible' : 'hidden'; }

  /* ---------- path B: scrub the real video ---------- */
  var lastSeekAt = 0, seekStart = 0, lats = [], firstScrollSeekPending = false;
  function seekTo(t){
    if (!videoReady) return;
    var delta = t - video.currentTime;
    if (Math.abs(delta) < 0.012) return;
    var now = performance.now();
    if (video.seeking && now - lastSeekAt < 500) return;
    lastSeekAt = now; seekStart = now;
    if (scrolled && !posterRetired) firstScrollSeekPending = true;
    if (Math.abs(delta) > 0.3 && video.fastSeek) video.fastSeek(t); else video.currentTime = t;
  }
  function median(a){ var b = a.slice().sort(function(p, q){ return p - q; }); return b[b.length >> 1]; }
  function onSeeked(){
    var lat = performance.now() - seekStart;
    lats.push(lat); if (lats.length > 6) lats.shift();
    if (firstScrollSeekPending){ firstScrollSeekPending = false; retirePoster(); }
    if (!hybrid && (lat > 300 || (lats.length >= 6 && median(lats) > 40))) goHybrid('slow seeks');
    if (hybrid && restSeek){ restSeek = false; showCanvas(false); }
    // keep up with the playhead if the target moved while this seek was in flight
    if (!hybrid) render(current < 0 ? 0 : current);
  }
  var restSeek = false;
  function onRest(){
    if (hybrid && videoReady){
      var x = current * (N - 1) + 1;
      restSeek = true; seekStart = performance.now(); lastSeekAt = seekStart;
      video.currentTime = frameTime(Math.round(x));
    }
  }
  function goHybrid(why){
    if (hybrid) return;
    hybrid = true; F.hybrid = why;
    startFrames();
    if (posterRetired && videoReady) video.style.visibility = 'visible';
  }
  function setupVideo(){
    video.muted = true; video.playsInline = true;
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', function(){ fallback('video error'); });
    video.addEventListener('loadeddata', function(){
      videoReady = true; hideCue();
      if (hybrid) return;
      render(current < 0 ? 0 : current);
    }, { once: true });
    var timer = setTimeout(function(){ if (!videoReady) fallback('no first frame in 8s'); }, 8000);
    function attach(src){ video.src = src; video.load(); }
    if (F.stream){ attach(F.url); return; }
    waitBlob().then(function(blob){ attach(URL.createObjectURL(blob)); }, function(){ clearTimeout(timer); fallback('download failed'); });
  }
  function waitBlob(){
    if (F.blob) return F.blob;
    return new Promise(function(res){
      var iv = setInterval(function(){ if (F.blob){ clearInterval(iv); res(F.blob); } }, 50);
    });
  }
  function fallback(why){
    if (hybrid) return;
    goHybrid(why);
    render(current < 0 ? 0 : current);
  }

  /* ---------- loading cue (only if the film is slow) ---------- */
  var cueTimer = setTimeout(function(){ if (!(videoReady || skeletonDone())) cue.classList.add('is-on'); }, 600);
  function hideCue(){ clearTimeout(cueTimer); cue.classList.remove('is-on'); }
  function skeletonDone(){
    if (!framesStarted || !skeletonAll.length) return false;
    for (var i = 0; i < skeletonAll.length; i++) if (!ready[skeletonAll[i]]) return false;
    return true;
  }
  function onFirstFrames(){ if ((!useVideo || hybrid) && skeletonDone()) hideCue(); }

  /* ---------- in-page anchors: never animate through the hero ---------- */
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    var id = a.getAttribute('href').slice(1);
    var el = id ? document.getElementById(id) : null;
    if (!el) return;
    e.preventDefault();
    var y = el.getBoundingClientRect().top + window.scrollY;
    var heroTop = runway.offsetTop, heroEnd = heroTop + runway.offsetHeight - window.innerHeight;
    var lo = Math.min(window.scrollY, y), hi = Math.max(window.scrollY, y);
    var through = lo < heroEnd && hi > heroTop && Math.abs(y - window.scrollY) > 2;
    window.scrollTo({ top: y, behavior: through ? 'auto' : 'smooth' });
    history.pushState(null, '', '#' + id);
  });

  /* ---------- progress bar only while the film is on screen ---------- */
  var progressEl = bar && bar.parentNode;
  if (progressEl && 'IntersectionObserver' in window){
    new IntersectionObserver(function(entries){
      var en = entries[0];
      progressEl.classList.toggle('is-hidden', !(en.isIntersecting && en.intersectionRatio >= 0.35));
    }, { threshold: [0, 0.35, 0.6, 1] }).observe(stage);
  }

  /* ---------- start ---------- */
  if (logo.complete) placeLogo(1); else logo.addEventListener('load', function(){ render(Math.max(current, 0)); });
  if (useVideo) setupVideo(); else startFrames();

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function(){
    if (ctx && sizeCanvas() && canvasDrawn) drawFrames(shownX || 1);   // repaint in the same task
    readProgress();
    render(Math.max(current, 0));
    kick();
  });
  readProgress();
  current = target;
  render(current);

  // test hook for automated checks
  window.__filmDebug = function(){
    return { mode: useVideo ? (hybrid ? 'hybrid' : 'video') : 'frames', target: target, current: current,
      videoTime: video.currentTime, duration: video.duration, videoReady: videoReady,
      framesReady: ready.filter(Boolean).length, posterRetired: posterRetired, lats: lats.slice(), why: F.hybrid || '' };
  };
})();
