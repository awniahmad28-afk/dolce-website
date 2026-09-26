(function(){
  var wrap = document.getElementById('scrub');
  var canvas = document.getElementById('scrub-canvas');
  if (!wrap || !canvas) return;
  var ctx = canvas.getContext('2d');
  var bar = document.getElementById('scrub-progress-bar');
  var sticky = wrap.querySelector('.scrub-sticky');

  // Which hero footage to show is set by data-hero on <html> in index.html.
  var landscape = document.documentElement.getAttribute('data-hero') === 'landscape';
  var total    = landscape ? 244 : 67;
  var nativeW  = landscape ? 1920 : 2160;
  var nativeH  = landscape ? 1080 : 3840;
  var frameDir = landscape ? 'hero-frames-landscape' : 'hero-frames-portrait';
  var frames = new Array(total);
  var currentFrame = 0;
  var cacheBust = '5';

  var desktopQuery = window.matchMedia('(min-width:701px) and (hover:hover) and (pointer:fine)');

  // On desktop the video is scrubbed by hovering it and using the wheel,
  // independent of page scroll. On mobile, scrubbing stays tied to normal
  // page scroll exactly as before.
  var desktopProgress = 0;

  function frameSrc(i){
    return frameDir + '/frame-' + String(i).padStart(3, '0') + '.jpg?v=' + cacheBust;
  }

  function nearestLoaded(i){
    for (var j = i; j >= 1; j--){
      if (frames[j - 1] && frames[j - 1].complete && frames[j - 1].naturalWidth) return j;
    }
    for (var k = i; k <= total; k++){
      if (frames[k - 1] && frames[k - 1].complete && frames[k - 1].naturalWidth) return k;
    }
    return 0;
  }

  function sizeCanvasMobile(){
    canvas.width = nativeW;
    canvas.height = nativeH;
  }

  function sizeCanvasDesktop(){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = sticky.getBoundingClientRect();
    var w = Math.max(1, Math.round(rect.width * dpr));
    var h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
  }

  function drawCover(img){
    var cw = canvas.width, ch = canvas.height;
    var iw = img.naturalWidth, ih = img.naturalHeight;
    var scale = Math.max(cw / iw, ch / ih);
    var w = iw * scale, h = ih * scale;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  // Portrait footage on a wide screen: full uncropped frame (stretched 2x
  // wide) over a blurred, darkened cover-fill of itself.
  function drawBlurPad(img){
    var cw = canvas.width, ch = canvas.height;
    var iw = img.naturalWidth, ih = img.naturalHeight;
    ctx.fillStyle = '#0d0906';
    ctx.fillRect(0, 0, cw, ch);

    var coverScale = Math.max(cw / iw, ch / ih);
    var bw = iw * coverScale, bh = ih * coverScale;
    ctx.save();
    ctx.filter = 'blur(50px) brightness(0.55)';
    ctx.drawImage(img, (cw - bw) / 2, (ch - bh) / 2, bw, bh);
    ctx.restore();

    var containScale = Math.min(cw / iw, ch / ih);
    var stretched = Math.min(cw, iw * containScale * 2.0);
    var fw = cw - (cw - stretched) * 0.7;  // side bars 30% narrower than at 2x
    var fh = ih * containScale;
    ctx.drawImage(img, (cw - fw) / 2, (ch - fh) / 2, fw, fh);
  }

  function draw(i){
    var img = frames[i - 1];
    if (!img || !img.complete || !img.naturalWidth) return;
    if (!landscape && desktopQuery.matches) drawBlurPad(img);
    else drawCover(img);
    currentFrame = i;
  }

  function redrawCurrent(){
    if (currentFrame > 0) draw(currentFrame);
  }

  function applySizing(){
    if (desktopQuery.matches){
      sizeCanvasDesktop();
    } else {
      sizeCanvasMobile();
    }
  }

  applySizing();

  for (var i = 1; i <= total; i++){
    (function(idx){
      var img = new Image();
      img.src = frameSrc(idx);
      img.onload = function(){
        if (idx === 1 && currentFrame === 0) draw(1);
      };
      frames[idx - 1] = img;
    })(i);
  }

  function updateProgress(progress){
    progress = Math.min(1, Math.max(0, progress));
    var target = Math.min(total, Math.max(1, Math.round(progress * (total - 1)) + 1));
    if (target !== currentFrame){
      var available = nearestLoaded(target);
      if (available) draw(available);
    }
    if (bar) bar.style.width = (progress * 100) + '%';
    return progress;
  }

  // Touch devices: portrait footage fills the screen and scrubs through the
  // tall hero section. Landscape footage is a 16:9 strip pinned at the top
  // while the About section scrolls beneath it; that distance drives it.
  var pinZone = landscape ? (document.querySelector('.pin-zone') || wrap) : wrap;
  function onScrollMobile(){
    var scrollable = landscape
      ? pinZone.offsetHeight - sticky.offsetHeight
      : wrap.offsetHeight - window.innerHeight;
    var rect = pinZone.getBoundingClientRect();
    var progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;
    updateProgress(progress);
  }

  function onWindowScroll(){
    if (!desktopQuery.matches) onScrollMobile();
  }

  // Desktop: wheel input only affects the video while the pointer is over
  // it (the listener is scoped to the sticky element itself). Once the
  // first/last frame is reached, we stop intercepting so the wheel gesture
  // hands off to normal page scroll instead of trapping the user.
  function normalizeDelta(e){
    var d = e.deltaY;
    if (e.deltaMode === 1) d *= 16;
    else if (e.deltaMode === 2) d *= window.innerHeight;
    return d;
  }

  function onWheelDesktop(e){
    if (!desktopQuery.matches) return;
    var d = normalizeDelta(e);
    var atEnd = desktopProgress >= 1 && d > 0;
    var atStart = desktopProgress <= 0 && d < 0;
    if (atEnd || atStart) return;
    e.preventDefault();
    var range = window.innerHeight * 1.5;
    desktopProgress = updateProgress(desktopProgress + d / range);
  }

  sticky.addEventListener('wheel', onWheelDesktop, { passive: false });

  var resizeTimer;
  function onResize(){
    applySizing();
    redrawCurrent();
    if (!desktopQuery.matches) onScrollMobile();
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function(){
      applySizing();
      redrawCurrent();
    }, 150);
  }

  // The progress bar is pinned to the bottom of the screen; show it only
  // while the video itself is on screen.
  var progressEl = bar && bar.parentNode;
  if (progressEl && 'IntersectionObserver' in window){
    new IntersectionObserver(function(entries){
      var e = entries[0];
      progressEl.classList.toggle('is-hidden', !(e.isIntersecting && e.intersectionRatio >= 0.35));
    }, { threshold: [0, 0.35, 0.6, 1] }).observe(sticky);
  }

  window.addEventListener('scroll', onWindowScroll, { passive: true });
  window.addEventListener('resize', onResize);
  if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', onResize);
  onWindowScroll();
})();
