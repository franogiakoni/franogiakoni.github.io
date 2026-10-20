#!/usr/bin/env python3
"""Actualiza assets/publications.js y assets/scholar-stats.js desde Google Scholar.

Uso: python3 tools/update_scholar.py
Lo ejecuta cada lunes el robot de GitHub Actions (.github/workflows/sitio.yml).
Si Scholar bloquea la consulta, no se toca ningún archivo y la web conserva los datos anteriores.
"""
import html, json, re, sys, time, urllib.request, urllib.parse
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))
from datetime import date
from pathlib import Path

USER = "eCAw05QAAAAJ"
ROOT = Path(__file__).resolve().parent.parent
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36",
      "Accept-Language": "es-ES,es;q=0.9"}

# Trabajos atribuidos por error en Scholar (no son del autor).
DROP = {"9Nmd_mFXekcC", "_Re3VWB3Y0AC"}
OVERRIDES = {
    "bEWYMUwI8FkC": {"v": "SPORT TK – Revista EuroAmericana de Ciencias del Deporte 11, 21, 2022"},
    "WF5omc3nYNoC": {"v": "The Global Private Health & Fitness Business: A Marketing Perspective, Emerald, 2021"},
    "B3FOqHPlNUQC": {"t": "Sports motivation in Chilean rugby players: impact of occupational status"},
    "UHK10RUVsp4C": {"t": "Ripples of change: transforming lives and communities through sport in Colombia"},
    "8k81kl-MbHgC": {"v": "Tesis doctoral · Universidad Católica San Antonio de Murcia, 2021"},
    "35N4QoGY0k4C": {"v": "Seminario de grado · Universidad Andrés Bello, 2012"},
}
BOOK = {"id": "", "t": "El Libro Blanco de la Gestión Deportiva", "a": "F Giakoni-Ramírez",
        "v": "Libro · Editorial Trayecto, Chile · ISBN 978-956-6083-13-9", "c": 0, "y": 2020, "l": "gestion", "first": True,
        "url": "https://www.trayecto.cl/site/producto/el-libro-blanco-de-la-gestion-deportiva/"}


def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def clean(s):
    return html.unescape(re.sub(r"<.*?>", "", s)).strip()


def line(r):
    s = (r["t"] + " " + r["v"]).lower()
    if re.search(r"esport|neuromarketing|advertis|publicit|sponsor|streaming|gamer", s): return "gestion"
    if re.search(r"virtual reality|realidad virtual|icaros", s): return "vr"
    if re.search(r"manag|gesti|gestor|competenc|formula e|fórmula e|perceived quality|calidad percibida|funding|financiamiento|sporting event|eventos deportivos|industry|olympic|pan american|panamerican|panamericanos|responsabilidad social|digitiz|fitness trends|tendencias|marketing|congres|sport service|servicio deportivo|ripples|sustainab|asociaciones deportivas|desarrollo|abuse|curricul|currículo", s): return "gestion"
    return "salud"


def main():
    base = f"https://scholar.google.es/citations?user={USER}&hl=es&pagesize=100&view_op=list_works&sortby=pubdate"
    pages, rows = [], []
    for start in range(0, 1000, 100):
        page = fetch(f"{base}&cstart={start}")
        if "gsc_a_tr" not in page:
            if start == 0:
                sys.exit("Scholar no devolvió publicaciones (¿bloqueo o captcha?). No se modificó nada.")
            break
        pages.append(page)
        found = re.findall(r'<tr class="gsc_a_tr">(.*?)</tr>', page, re.S)
        for tr in found:
            m = re.search(r'citation_for_view=([^"&]+)[^>]*>(.*?)</a>', tr, re.S)
            if not m: continue
            grays = re.findall(r'<div class="gs_gray">(.*?)</div>', tr, re.S)
            c = re.search(r'class="gsc_a_ac gs_ibl">(\d*)<', tr)
            y = re.search(r'gsc_a_h gsc_a_hc gs_ibl">(\d*)<', tr)
            rows.append(dict(id=m.group(1).split(":")[-1], t=clean(m.group(2)),
                             a=clean(grays[0]) if grays else "", v=clean(grays[1]) if len(grays) > 1 else "",
                             c=int(c.group(1)) if c and c.group(1) else 0, y=int(y.group(1)) if y and y.group(1) else 0))
        if len(found) < 100: break
        time.sleep(3)

    pubs = []
    for r in rows:
        if r["id"] in DROP: continue
        r.update(OVERRIDES.get(r["id"], {}))
        r["l"] = line(r)
        r["first"] = bool(re.match(r"^(F|FV|FG)\.? ?(Giakoni|Ramírez|Ramirez)|^F Giakoni|^FG Ramírez|^FV Giakoni", r["a"]))
        pubs.append({k: r[k] for k in ("id", "t", "a", "v", "c", "y", "l", "first")})
    pubs.append(BOOK)
    pubs.sort(key=lambda p: (-p["y"], -p["c"]))
    if len(pubs) < 100:
        sys.exit(f"Solo se leyeron {len(pubs)} publicaciones; parece una respuesta incompleta. No se modificó nada.")

    first = pages[0]
    stats = [int(x) for x in re.findall(r'<td class="gsc_rsb_std">(\d+)</td>', first)]
    years = [int(x) for x in re.findall(r'<span class="gsc_g_t"[^>]*>(\d{4})</span>', first)]
    cites = [int(x) for x in re.findall(r'<span class="gsc_g_al">(\d+)</span>', first)]
    today = date.today().isoformat()
    out = {"updated": today, "citations": stats[0] if stats else None, "h": stats[2] if len(stats) > 2 else None,
           "i10": stats[4] if len(stats) > 4 else None, "records": len(pubs) - 1,
           "perYear": [[y, c] for y, c in list(zip(years, cites))[-6:]]}

    (ROOT / "assets/publications.js").write_text(
        f"/* Fuente: Google Scholar (user={USER}), actualizado {today}. l = línea: esports | gestion | vr | salud */\n"
        "window.PUBS = " + json.dumps(pubs, ensure_ascii=False, indent=0) + ";\n", encoding="utf-8")
    (ROOT / "assets/scholar-stats.js").write_text(
        f"/* Métricas de Google Scholar, actualizado {today} */\nwindow.SCHOLAR = " + json.dumps(out) + ";\n", encoding="utf-8")
    print(f"OK {today}: {len(pubs)} publicaciones, {out['citations']} citas, h={out['h']}, i10={out['i10']}")


if __name__ == "__main__":
    main()
