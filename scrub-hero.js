(function(){
  var wrap = document.getElementById('scrub');
  var canvas = document.getElementById('scrub-canvas');
  if (!wrap || !canvas) return;
  var ctx = canvas.getContext('2d');
  var bar = document.getElementById('scrub-progress-bar');
  var sticky = wrap.querySelector('.scrub-sticky');

  var total = 67;
  var nativeW = 2160;
  var nativeH = 3840;
  var frames = new Array(total);
  var currentFrame = 0;
  var cacheBust = '3';

  var desktopQuery = window.matchMedia('(min-width:701px) and (hover:hover) and (pointer:fine)');

  function frameSrc(i){
    return 'hero-frames/frame-' + String(i).padStart(3, '0') + '.jpg?v=' + cacheBust;
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

  function drawMobile(img){
    ctx.drawImage(img, 0, 0, nativeW, nativeH);
  }

  // Full frame, no cropping: a blurred cover-fill backdrop behind it fills
  // whatever space is left on the sides, so the real footage is never cut.
  function drawDesktop(img){
    var cw = canvas.width, ch = canvas.height;
    var iw = img.naturalWidth, ih = img.naturalHeight;

    var coverScale = Math.max(cw / iw, ch / ih);
    var bw = iw * coverScale, bh = ih * coverScale;
    var bx = (cw - bw) / 2, by = (ch - bh) / 2;
    ctx.save();
    ctx.filter = 'blur(50px) brightness(0.55)';
    ctx.drawImage(img, bx, by, bw, bh);
    ctx.restore();

    var containScale = Math.min(cw / iw, ch / ih);
    var widthStretch = 1.7;
    var fw = Math.min(cw, iw * containScale * widthStretch);
    var fh = ih * containScale;
    var fx = (cw - fw) / 2, fy = (ch - fh) / 2;
    ctx.drawImage(img, fx, fy, fw, fh);
  }

  function draw(i){
    var img = frames[i - 1];
    if (!img || !img.complete || !img.naturalWidth) return;
    ctx.fillStyle = '#0d0906';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (desktopQuery.matches){
      drawDesktop(img);
    } else {
      drawMobile(img);
    }
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

  function onScroll(){
    var scrollable = wrap.offsetHeight - window.innerHeight;
    var rect = wrap.getBoundingClientRect();
    var progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;
    var target = Math.min(total, Math.max(1, Math.round(progress * (total - 1)) + 1));
    if (target !== currentFrame){
      var available = nearestLoaded(target);
      if (available) draw(available);
    }
    if (bar) bar.style.width = (progress * 100) + '%';
  }

  var resizeTimer;
  function onResize(){
    applySizing();
    redrawCurrent();
    onScroll();
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function(){
      applySizing();
      redrawCurrent();
    }, 150);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', onResize);
  onScroll();
})();
