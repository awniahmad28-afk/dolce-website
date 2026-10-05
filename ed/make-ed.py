# Builds the ed-*.html editorial test pages from the live pages (re-run after live edits).
import re, html
PAGES=['index','our-story','dermatology','plastic-surgery','wellness']
EM=lambda w:'<em class="ed-em">%s</em>'%w
REPL={
 'all':[('<h2>Start your journey at Dolce</h2>','<h2>Start your journey at %s</h2>'%EM('Dolce')),
        ('<h2>Reserve your consultation</h2>','<h2>Reserve your %s</h2>'%EM('consultation'))],
 'index':[('<br>Care, always.</h2>','<br>Care, %s.</h2>'%EM('always')),
          ('<h2>What patients say</h2>','<h2>What patients %s</h2>'%EM('say')),
          ("as Erbil's leading aesthetic clinic</h2>","as Erbil's %s aesthetic clinic</h2>"%EM('leading'))],
 'our-story':[('>The story of Dolce</h1>','>The story of %s</h1>'%EM('Dolce')),
              ('>From Erbil to What&rsquo;s Next</h2>','>From Erbil to %s</h2>'%EM('What&rsquo;s Next'))],
 'dermatology':[('>What we treat, one by one</h2>','>What we treat, %s</h2>'%EM('one by one')),
                ('>Leave with the Dolce glow</h2>','>Leave with the %s</h2>'%EM('Dolce glow')),
                ('>Smooth, without the routine</h2>','>Smooth, %s</h2>'%EM('without the routine'))],
 'plastic-surgery':[('<h2>Real results</h2>','<h2>Real %s</h2>'%EM('results'))],
 'wellness':[('<h2>What is IV therapy?</h2>','<h2>What is %s?</h2>'%EM('IV therapy')),
             ('<h2>Peptide Treatment</h2>','<h2>Peptide %s</h2>'%EM('Treatment'))],
}
for p in PAGES:
    s=open(p+'.html').read()
    for q in PAGES:
        s=re.sub(r'href="%s\.html(#[^"]*)?"'%re.escape(q), lambda m,q=q:'href="ed-%s.html%s"'%(q,m.group(1) or ''), s)
    for a,b in REPL['all']+REPL[p]:
        assert s.count(a)==1,(p,a); s=s.replace(a,b)
    m=re.search(r'<link rel="stylesheet" href="luxe/luxe\.css\?v=\d+">',s); assert m,p
    s=s.replace(m.group(0), m.group(0)+'\n<link rel="stylesheet" href="ed/editorial.css?v=2">\n<meta name="robots" content="noindex">',1)
    if p=='index':
        i=s.index('  <div class="rev-grid"'); k=s.index('</section>',i)
        block=s[i:k]
        cards=re.findall(r'<q>(.*?)</q>.*?<div class="attr">(.*?)</div>',block,re.S)
        assert len(cards)==3
        figs=''.join('      <figure class="ed-quote%s"><blockquote>%s</blockquote><div class="stars">★★★★★</div><figcaption>%s</figcaption></figure>\n'%(' is-on' if n==0 else '',q,a) for n,(q,a) in enumerate(cards))
        dots=''.join('<button type="button" aria-label="Review %d"%s></button>'%(n+1,' class="is-on"' if n==0 else '') for n in range(len(cards)))
        new='  <div class="ed-quotes" data-ed-quotes aria-roledescription="carousel" aria-label="Google reviews">\n    <div class="ed-stack">\n'+figs+'    </div>\n    <div class="ed-dots">'+dots+'</div>\n  </div>\n'
        s=s[:i]+new+s[k:]
    s=s.replace('</body>','<script src="ed/editorial.js?v=1" defer></script>\n</body>',1)
    open('ed-'+p+'.html','w').write(s)
    print(p,'ok, ed links',len(re.findall(r'href="ed-',s)),'gold words',s.count('class="ed-em"'))
