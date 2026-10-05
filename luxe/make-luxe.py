# Builds the luxe-*.html test pages from the real pages (re-run after real-page edits).
import re
PAGES=['index','our-story','dermatology','plastic-surgery','wellness']
INTRO='''<script>/* LUXE TEST: first visit in a session -> the Dolce logo draws itself in gold, then fades
   into the page; later pages -> a soft cream fade-in. */
(function(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var first = false;
  try { first = !sessionStorage.getItem('lx-intro'); sessionStorage.setItem('lx-intro', '1'); } catch (e) {}
  var v = document.createElement('div');
  v.className = 'lx-veil' + (first ? ' lx-intro' : '');
  document.body.appendChild(v);
  function out(){ v.classList.add('lx-out'); setTimeout(function(){ v.remove(); }, 900); }
  if (!first){ requestAnimationFrame(function(){ requestAnimationFrame(out); }); return; }
  var img = new Image(), done = false;
  img.alt = '';
  function go(){ if (done) return; done = true; v.appendChild(img); requestAnimationFrame(function(){ v.classList.add('lx-go'); }); setTimeout(out, 1850); }
  img.onload = go; img.onerror = function(){ done = true; out(); };
  img.src = 'luxe/intro-logo.png';
  setTimeout(function(){ if (!done){ done = true; out(); } }, 1500);
})();
</script>'''
DIV='<div class="lx-divider" aria-hidden="true"><span></span><img src="luxe/mark.png" alt=""><span></span></div>\n'
for p in PAGES:
    s=open(p+'.html').read()
    for q in PAGES:
        s=re.sub(r'href="%s\.html(#[^"]*)?"'%re.escape(q), lambda m,q=q:'href="luxe-%s.html%s"'%(q,m.group(1) or ''), s)
    m=re.search(r'<link rel="stylesheet" href="styles\.css\?v=\d+">',s); assert m,p
    s=s.replace(m.group(0), m.group(0)+'\n<link rel="stylesheet" href="luxe/luxe.css?v=1">\n<meta name="robots" content="noindex">',1)
    assert s.count('<body>')==1,p
    s=s.replace('<body>','<body>\n'+INTRO,1)
    s=s.replace('<section class="cta wrap">',DIV+'<section class="cta wrap">')
    if p=='index':
        for anchor in ['<section class="services wrap"','<section class="pad wrap">']:
            assert s.count(anchor)==1,anchor
            s=s.replace(anchor,DIV+anchor)
    s=s.replace('</body>','<script src="luxe/luxe.js?v=1" defer></script>\n</body>',1)
    open('luxe-'+p+'.html','w').write(s)
    print(p, 'luxe links:', len(re.findall(r'href="luxe-',s)), 'dividers:', s.count('lx-divider"'))
