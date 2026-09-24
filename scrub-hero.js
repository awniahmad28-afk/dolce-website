(function(){
  var wrap = document.getElementById('scrub');
  var canvas = document.getElementById('scrub-canvas');
  if (!wrap || !canvas) return;
  var ctx = canvas.getContext('2d');
  var bar = document.getElementById('scrub-progress-bar');
  var sticky = wrap.querySelector('.scrub-sticky');

  var total = 244;
  var nativeW = 1920;
  var nativeH = 1080;
  var frames = new Array(total);
  var currentFrame = 0;
  var cacheBust = '4';

  var desktopQuery = window.matchMedia('(min-width:701px) and (hover:hover) and (pointer:fine)');
  var frameDir = 'hero-frames';

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

  function draw(i){
    var img = frames[i - 1];
    if (!img || !img.complete || !img.naturalWidth) return;
    drawCover(img);
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

  // On touch devices the hero is a 16:9 strip pinned at the top while the
  // About section scrolls beneath it; that scroll distance drives the frames.
  var pinZone = document.querySelector('.pin-zone') || wrap;
  function onScrollMobile(){
    var scrollable = pinZone.offsetHeight - sticky.offsetHeight;
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

  window.addEventListener('scroll', onWindowScroll, { passive: true });
  window.addEventListener('resize', onResize);
  if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', onResize);
  onWindowScroll();
})();
