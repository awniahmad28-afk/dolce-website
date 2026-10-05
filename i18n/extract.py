"""Find every piece of visible wording on the English pages.

A "unit" is the smallest element whose whole content is text plus inline
markup (em, br, a, ...), so a sentence is translated as one piece with its
inline tags kept. Attributes people see or hear (alt, aria-label, title,
placeholder) and the page's <title>/meta descriptions are units too.
"""
import json, re, sys
from bs4 import BeautifulSoup, NavigableString, Comment, Tag

PAGES = ['index', 'our-story', 'dermatology', 'plastic-surgery', 'wellness', 'polished']
INLINE = {'a', 'em', 'strong', 'b', 'i', 'br', 'span', 'small', 'sup', 'sub', 'img', 'button', 'svg', 'u', 'mark', 'abbr', 'time'}
SKIP = {'script', 'style', 'svg', 'noscript', 'iframe', 'video', 'canvas', 'template'}
ATTRS = ['alt', 'aria-label', 'title', 'placeholder']
META = {('name', 'description'), ('property', 'og:title'), ('property', 'og:description'),
        ('property', 'og:image:alt'), ('property', 'og:site_name')}

def has_text(s):
    return bool(re.search(r'[A-Za-z]', s))

def all_inline(el):
    for d in el.descendants:
        if isinstance(d, Tag) and d.name not in INLINE:
            return False
    return True

def in_skip(el):
    for p in el.parents:
        if isinstance(p, Tag) and p.name in SKIP:
            return True
    return False

def walk(soup):
    """Yield ('html', element) units, ('text', NavigableString) stray texts,
    ('attr', element, name) and ('meta', element)."""
    body = soup.body
    def rec(el):
        for ch in list(el.children):
            if isinstance(ch, Comment):
                continue
            if isinstance(ch, NavigableString):
                if has_text(str(ch)):
                    yield ('text', ch)
                continue
            if not isinstance(ch, Tag) or ch.name in SKIP:
                continue
            if all_inline(ch) and has_text(ch.get_text()):
                yield ('html', ch)
            else:
                yield from rec(ch)
    yield from rec(body)
    for el in soup.find_all(True):
        if el.name in SKIP or in_skip(el):
            continue
        for a in ATTRS:
            if el.has_attr(a) and has_text(el[a]):
                yield ('attr', el, a)
    for m in soup.find_all('meta'):
        for k, v in META:
            if m.get(k) == v and has_text(m.get('content', '')):
                yield ('meta', m)
    if soup.title and has_text(soup.title.string or ''):
        yield ('title', soup.title)

def key_of(item):
    kind = item[0]
    if kind == 'html':
        return item[1].decode_contents().strip()
    if kind == 'text':
        return str(item[1]).strip()
    if kind == 'attr':
        return item[1][item[2]].strip()
    if kind == 'meta':
        return item[1]['content'].strip()
    if kind == 'title':
        return item[1].string.strip()

if __name__ == '__main__':
    seen, out = set(), []
    for p in PAGES:
        soup = BeautifulSoup(open(f'{p}.html', encoding='utf-8').read(), 'html.parser')
        for it in walk(soup):
            k = key_of(it)
            if k not in seen:
                seen.add(k); out.append({'page': p, 'kind': it[0], 'en': k})
    json.dump(out, open('i18n/strings.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(out), 'units,', sum(len(o['en']) for o in out), 'chars')
