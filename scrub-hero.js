(function(){
  var wrap = document.getElementById('scrub');
  var canvas = document.getElementById('scrub-canvas');
  if (!wrap || !canvas) return;
  var ctx = canvas.getContext('2d');
  var bar = document.getElementById('scrub-progress-bar');

  var total = 102;
  var frameW = 1280;
  var frameH = 2276;
  var frames = new Array(total);
  var currentFrame = 0;

  canvas.width = frameW;
  canvas.height = frameH;
  ctx.fillStyle = '#0d0906';
  ctx.fillRect(0, 0, frameW, frameH);

  function frameSrc(i){
    return 'hero-frames/frame-' + String(i).padStart(3, '0') + '.jpg';
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

  function draw(i){
    var img = frames[i - 1];
    if (!img || !img.complete || !img.naturalWidth) return;
    ctx.drawImage(img, 0, 0, frameW, frameH);
    currentFrame = i;
  }

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

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();
