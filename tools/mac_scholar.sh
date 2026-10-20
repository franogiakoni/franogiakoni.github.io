#!/bin/zsh
# Tarea semanal del Mac: lee Google Scholar (desde aquí no hay bloqueo) y sube los cambios a GitHub.
# GitHub vuelve a publicar la web sola al recibir el cambio.
# La ejecuta launchd cada lunes a las 08:30 (tools/cl.franogiakoni.cv-scholar.plist).
set -u
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
cd "$(dirname "$0")/.." || exit 1
echo "=== $(date '+%F %T') ==="

git pull --rebase --autostash -q || { echo "No se pudo traer la última versión de GitHub."; exit 1; }

if ! /usr/bin/python3 -I tools/update_scholar.py; then
  echo "Scholar no respondió; no se cambió nada."
  exit 0
fi

git add assets/publications.js assets/scholar-stats.js
if git diff --cached --quiet; then
  echo "Scholar sin cambios esta semana."
else
  git -c user.name="Frano Giakoni Ramírez" -c user.email="frano.giakoni@unab.cl" \
    commit -q -m "Scholar: actualización automática $(date +%F)"
  git push -q && echo "Cambios subidos a GitHub; la web se publica sola."
fi
