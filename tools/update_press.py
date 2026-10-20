#!/usr/bin/env python3
"""Actualiza assets/press.js con apariciones en prensa encontradas en Google Noticias.

Uso: python3 tools/update_press.py
Las entradas agregadas a mano (con "manual": true) nunca se borran ni se modifican.
"""
import email.utils, json, re, urllib.parse, urllib.request, xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/press.js"
QUERIES = ['"Frano Giakoni"', '"Giakoni Ramírez"']
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130 Safari/537.36"}


def load_existing():
    if not OUT.exists():
        return []
    txt = OUT.read_text(encoding="utf-8")
    return json.loads(txt[txt.index("["): txt.rindex("]") + 1])


def kind(title, source):
    t = title.lower()
    if "por frano giakoni" in t or "columna" in t or "opinión" in t:
        return "columna"
    if "unab" in source.lower():
        return "unab"
    return "prensa"


def clean_title(title, source):
    title = re.sub(r"\s+-\s+" + re.escape(source) + r"\s*$", "", title).strip()
    title = re.sub(r"\.?\s*Por Frano Giakoni Ram[ií]rez.*$", "", title).strip()
    title = re.sub(r"^COLUMNA DE OPINI[ÓO]N:\s*", "", title, flags=re.I)
    return title


def norm(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())[:60]


SOURCE_NAMES = {"cronicadigital": "Crónica Digital", "elrancaguino": "El Rancagüino", "noticias.unab": "Noticias UNAB",
    "eltipografo.cl": "El Tipógrafo", "eltipografo": "El Tipógrafo", "lavozdemaipu": "La Voz de Maipú", "linaresenlinea": "Linares en Línea",
    "ivoox": "iVoox", "la tercera": "La Tercera", "el heraldo": "El Heraldo", "g5noticias": "G5noticias"}
SKIP_TITLES = re.compile(r"^(volver a |frano giakoni r(\.|amírez)?$)", re.I)


def pretty_source(s):
    return SOURCE_NAMES.get(s.strip().lower(), s.strip())


def bing_items(q):
    url = "https://www.bing.com/news/search?" + urllib.parse.urlencode({"q": q, "format": "rss", "setlang": "es-CL"})
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        data = r.read()
    if not data.strip():
        return []
    root = ET.fromstring(data)
    out = []
    for it in root.findall(".//item"):
        src = next((c.text for c in it if c.tag.endswith("Source") and c.text), "")
        link = it.findtext("link") or ""
        m = re.search(r"[?&]url=([^&]+)", link)
        if m: link = urllib.parse.unquote(m.group(1))
        if "x.com" in link or "twitter.com" in link: continue
        out.append((it.findtext("title") or "", src, it.findtext("pubDate"), link))
    return out


def main():
    items = load_existing()
    seen = {norm(i["t"]) for i in items}
    added = 0
    for q in QUERIES:
        url = "https://news.google.com/rss/search?" + urllib.parse.urlencode({"q": q, "hl": "es-419", "gl": "CL", "ceid": "CL:es-419"})
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
            root = ET.fromstring(r.read())
        for it in root.findall(".//item"):
            src_el = it.find("source")
            source = src_el.text.strip() if src_el is not None and src_el.text else ""
            raw = it.findtext("title") or ""
            title = clean_title(raw, source)
            if not title or norm(title) in seen:
                continue
            d = email.utils.parsedate_to_datetime(it.findtext("pubDate")).date().isoformat()
            items.append({"d": d, "t": title, "s": source, "k": kind(raw, source), "u": it.findtext("link")})
            seen.add(norm(title)); added += 1
    for q in ['"Frano Giakoni"', 'Giakoni UNAB']:
        try:
            for raw, source, pub, link in bing_items(q):
                source = pretty_source(source)
                title = clean_title(raw, source)
                if not title or SKIP_TITLES.search(title) or norm(title) in seen: continue
                d = email.utils.parsedate_to_datetime(pub).date().isoformat()
                k = "podcast" if source == "iVoox" else kind(raw, source)
                items.append({"d": d, "t": title, "s": source, "k": k, "u": link})
                seen.add(norm(title)); added += 1
        except Exception as e:
            print("bing:", e)
    for i in items:
        if not i.get("manual"): i["s"] = pretty_source(i["s"])
    items.sort(key=lambda i: i["d"], reverse=True)
    OUT.write_text(f"/* Apariciones en prensa. Fuente: Google Noticias + entradas manuales (\"manual\": true). Actualizado {date.today().isoformat()}.\n   k = columna | prensa | unab | tv | radio | podcast */\nwindow.PRESS = "
                   + json.dumps(items, ensure_ascii=False, indent=0) + ";\n", encoding="utf-8")
    print(f"OK prensa: {len(items)} apariciones ({added} nuevas)")


if __name__ == "__main__":
    main()
