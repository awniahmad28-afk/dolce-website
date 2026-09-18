(function(){
  var wrap = document.getElementById('scrubWrap');
  if (!wrap) return;
  var FRAME_COUNT = 90;
  var frames = new Array(FRAME_COUNT);
  var canvas = document.getElementById('scrubCanvas');
  var ctx = canvas.getContext('2d');
  var bar = document.getElementById('scrubBar');
  var progressEl = document.querySelector('.scrub-progress');
  var currentFrame = -1;

  function frameSrc(i){
    return 'frames/frame-' + String(i).padStart(3, '0') + '.jpg';
  }

  function drawFrame(i){
    i = Math.max(0, Math.min(FRAME_COUNT - 1, i));
    if (i === currentFrame) return;
    var img = frames[i];
    if (!img || !img.complete) return;
    currentFrame = i;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  function onScroll(){
    var rect = wrap.getBoundingClientRect();
    var total = wrap.offsetHeight - window.innerHeight;
    var scrolled = -rect.top;
    var progress = total > 0 ? scrolled / total : 0;
    progress = Math.max(0, Math.min(1, progress));
    drawFrame(Math.round(progress * (FRAME_COUNT - 1)));
    bar.style.width = (progress * 100) + '%';
    // fade the progress indicator out once we've scrolled past the hero
    progressEl.style.opacity = (rect.bottom <= 0 || rect.top >= window.innerHeight) ? 0 : 1;
  }

  for (var i = 0; i < FRAME_COUNT; i++){
    (function(idx){
      var img = new Image();
      img.onload = function(){ if (idx === 0) drawFrame(0); };
      img.src = frameSrc(idx);
      frames[idx] = img;
    })(i);
  }

  window.addEventListener('scroll', onScroll, {passive: true});
  window.addEventListener('resize', onScroll);
  onScroll();
})();
