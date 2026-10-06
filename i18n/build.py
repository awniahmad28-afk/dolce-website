"""Build the Kurdish (Sorani) and Arabic pages from the English ones.

    python3 i18n/build.py            # writes index-ku.html, index-ar.html, ...

Wording comes from i18n/tr.py (keyed by the units i18n/extract.py finds).
Pages are written next to the English ones, so every image, video and
script path keeps working unchanged.
"""
import json, os, re, sys
from bs4 import BeautifulSoup, NavigableString, Tag

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
os.chdir(ROOT)
from extract import PAGES, walk, key_of, ATTRS  # noqa: E402
from tr import T, EXTRA, JS  # noqa: E402

LANGS = {
    'ckb': {'suffix': 'ku', 'name': 'کوردی', 'col': 0, 'locale': 'ckb_IQ'},
    'ar':  {'suffix': 'ar', 'name': 'العربية', 'col': 1, 'locale': 'ar_IQ'},
}
SITE = 'https://www.dolceclinic.com/'
ARABIC = re.compile(r'[؀-ۿ]')
LATIN = re.compile(r'[A-Za-z]')
PLUS = re.compile(r'(Dolce\+|NAD\+)')

# T is numbered by the wording list as it was when it was written
# (strings.base.json); EXTRA holds wording added since, keyed by the English.
# Both become one English -> (ckb, ar) table, so new wording never shifts
# the existing translations.
base = json.load(open('i18n/strings.base.json', encoding='utf-8'))
BYEN = {s['en']: T[i] for i, s in enumerate(base)}
BYEN.update(EXTRA)
missing = [s['en'] for s in json.load(open('i18n/strings.json', encoding='utf-8')) if s['en'] not in BYEN]
assert not missing, 'no translation for: ' + ' | '.join(m[:80] for m in missing)

OPEN_TAG = re.compile(r'<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?>')

def fill(src, tpl, idx):
    """Put the unit's own tags back into a placeholder template."""
    tags = [(m.group(1), m.group(0)) for m in OPEN_TAG.finditer(src)]
    used = set()
    def op(m):
        n = int(m.group(1)); used.add(n)
        return tags[n - 1][1]
    def cl(m):
        return '</' + tags[int(m.group(1)) - 1][0] + '>'
    out = re.sub(r'<(\d+)/?>', op, tpl)
    out = re.sub(r'</(\d+)>', cl, out)
    assert used == set(range(1, len(tags) + 1)), f'unit {idx}: tags used {sorted(used)} of {len(tags)}'
    return out

def tr(en, lang):
    v = BYEN.get(en.strip())
    return None if v is None else v[LANGS[lang]['col']]

def page_href(href, sfx):
    m = re.match(r'^(%s)\.html(#.*)?$' % '|'.join(map(re.escape, PAGES)), href or '')
    return f'{m.group(1)}-{sfx}.html{m.group(2) or ""}' if m else href

def isolate_latin(soup):
    """Wrap left-to-right runs (English names, reviews, numbers) in <bdi> so
    their punctuation and brackets stay in place inside right-to-left text."""
    for t in list(soup.body.find_all(string=True)):
        if not isinstance(t, NavigableString) or type(t) is not NavigableString:
            continue
        p = t.parent
        if p is None or p.name in ('script', 'style', 'bdi', 'title', 'option', 'textarea') or p.find_parent(['script', 'style', 'svg', 'bdi']):
            continue
        s = str(t)
        if ARABIC.search(s) and PLUS.search(s):
            # brand names ending in "+" inside Kurdish / Arabic text: keep the
            # "+" on the right side of the name
            parts = re.split(r'(?:Dolce\+|NAD\+)', s); names = PLUS.findall(s); new = []
            for k, part in enumerate(parts):
                if part: new.append(NavigableString(part))
                if k < len(names):
                    b = soup.new_tag('bdi'); b.string = names[k]; new.append(b)
            for n in new: t.insert_before(n)
            t.extract()
            continue
        if not s.strip() or ARABIC.search(s):
            continue
        if not (LATIN.search(s) or re.search(r'\d', s)):
            continue
        lead = s[:len(s) - len(s.lstrip())]; trail = s[len(s.rstrip()):]
        b = soup.new_tag('bdi')
        if not LATIN.search(s):
            b['dir'] = 'ltr'
        b.string = s.strip()
        t.replace_with(b)
        if lead: b.insert_before(lead)
        if trail: b.insert_after(trail)

def build(page, lang):
    L = LANGS[lang]; sfx = L['suffix']
    src = open(f'{page}.html', encoding='utf-8').read()
    soup = BeautifulSoup(src, 'html.parser')
    items = list(walk(soup))
    todo = []
    for it in items:
        if it[0] in ('html', 'text'):
            todo.append(it)
    for it in todo:
        en = key_of(it)
        v = BYEN[en]
        if v is None:
            continue
        t = v[L['col']]
        if it[0] == 'html':
            el = it[1]
            new = fill(el.decode_contents().strip(), t, en[:60])
            el.clear()
            for c in list(BeautifulSoup(new, 'html.parser').contents):
                el.append(c)
        else:
            s = str(it[1]); lead = s[:len(s) - len(s.lstrip())]; trail = s[len(s.rstrip()):]
            it[1].replace_with(lead + t + trail)
    # attributes, metas and title (after the units, so copied tags are covered)
    for el in soup.find_all(True):
        if el.name in ('script', 'style') or el.find_parent(['script', 'style', 'svg']):
            continue
        for a in ATTRS:
            if el.has_attr(a) and LATIN.search(el[a]) and not ARABIC.search(el[a]):
                t = tr(el[a], lang)
                if t: el[a] = t
    for m in soup.find_all('meta'):
        c = m.get('content', '')
        if m.get('name') == 'description' or (m.get('property') or '').startswith(('og:title', 'og:description', 'og:image:alt', 'og:site_name')):
            t = tr(c, lang)
            if t: m['content'] = t
        if m.get('property') == 'og:url':
            m['content'] = f'{SITE}{page}-{sfx}.html'
    if soup.title:
        t = tr(soup.title.string, lang)
        if t: soup.title.string = t

    # links between pages stay in this language
    for a in soup.find_all('a', href=True):
        a['href'] = page_href(a['href'], sfx)

    # <html>, <head>
    soup.html['lang'] = lang; soup.html['dir'] = 'rtl'
    head = soup.head
    # the English pages load a tiny copy of the Arabic-script font holding only
    # the letters of the language picker; here the full font is loaded, and
    # mixing the two would break letters apart, so the tiny copy goes
    for l in head.find_all('link', href=re.compile(r'fonts\.googleapis\.com/.*[?&]text=')):
        l.decompose()
    vp = head.find('meta', attrs={'name': 'viewport'})
    extra = BeautifulSoup(
        f'<meta property="og:locale" content="{L["locale"]}">'
        + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600&family=Noto+Sans+Arabic:wght@300;400;500;600&display=swap">'
        + f'<script>window.DOLCE_T={json.dumps(JS[lang], ensure_ascii=False)};</script>',
        'html.parser')
    for c in reversed(list(extra.contents)):
        vp.insert_after(c)

    # Our Story: the first word of the story in gold (in place of the large
    # opening letter, which would break a joined Arabic-script word)
    for p0 in soup.select('.story-text > p:first-child'):
        t = p0.find(string=True)
        if t and t.strip():
            s0 = str(t); lead = s0[:len(s0) - len(s0.lstrip())]; body = s0.lstrip()
            word, _, rest = body.partition(' ')
            sp = soup.new_tag('span', attrs={'class': 'first-word'}); sp.string = word
            t.replace_with(sp)
            if lead: sp.insert_before(lead)
            if rest: sp.insert_after(' ' + rest)
    # stand-alone arrows (outside the translated wording) point the other way
    for t in list(soup.body.find_all(string=re.compile(r'^\s*[→←]\s*$'))):
        if t.parent.name not in ('script', 'style'):
            t.replace_with(str(t).translate(str.maketrans('→←', '←→')))
    isolate_latin(soup)

    out = str(soup)
    # words inside the page's own scripts
    j = JS[lang]
    for a, b in [('aria-label="Close"', f'aria-label="{j["close"]}"'),
                 ('aria-label="Next photo"', f'aria-label="{j["next"]}"'),
                 ('aria-label="Previous photo"', f'aria-label="{j["prev"]}"'),
                 ("'✓ Copied'", f"'{j['copied']}'"),
                 ('booking.js?v=2', 'booking.js?v=3')]:
        out = out.replace(a, b)
    open(f'{page}-{sfx}.html', 'w', encoding='utf-8').write(out)
    return out

if __name__ == '__main__':
    for p in PAGES:
        for l in LANGS:
            build(p, l)
            print('built', f'{p}-{LANGS[l]["suffix"]}.html')
