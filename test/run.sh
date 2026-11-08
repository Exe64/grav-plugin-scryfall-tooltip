#!/usr/bin/env bash
# Bench of the plugin: a throwaway Grav with shortcode-core, the plugin and test/pages, then markup checks and, when
# Playwright is available, the browser checks (test/browser.js). Needs php 8.3 (gd, zip), curl, unzip, node.
# Usage, from the repository root: bash test/run.sh [screenshot-dir]
# GRAV_ZIP: a local Grav archive instead of the download. HOLD=<seconds>: keep the server up that long after the markup checks, for a browser run from elsewhere.
set -uo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
SHOTS="${1:-}"
PORT="${PORT:-8099}"
W="$(mktemp -d)"
trap 'kill $(jobs -p) 2>/dev/null; rm -rf "$W"' EXIT
if [[ -z "${GRAV_ZIP:-}" ]]; then GRAV_ZIP="$W/grav.zip"; curl -fsSL -o "$GRAV_ZIP" https://getgrav.org/download/core/grav/latest || { echo "Grav download failed"; exit 1; }; fi
cd "$W" && unzip -q "$GRAV_ZIP" && cd "$(ls -d "$W"/grav*/ | head -1)" || exit 1
# A grav-admin archive (local cache) would redirect to the admin setup: keep the plain Grav
rm -rf user/plugins/{admin,admin2,login,form,email,flex-objects,api,problems} 2>/dev/null
for i in 1 2 3; do php bin/gpm install -y shortcode-core >/dev/null; [[ -d user/plugins/shortcode-core ]] && break; sleep 5; done
[[ -d user/plugins/shortcode-core ]] || { echo "shortcode-core not installed"; exit 1; }
mkdir user/plugins/scryfall-tooltip && cp -r "$REPO"/{scryfall-tooltip.php,scryfall-tooltip.yaml,blueprints.yaml,assets,shortcodes} user/plugins/scryfall-tooltip/
rm -rf user/pages/* && cp -r "$REPO"/test/pages/. user/pages/
printf 'title: Test\n' > user/config/site.yaml
php -S 127.0.0.1:"$PORT" system/router.php >"$W/php.log" 2>&1 &
B="http://127.0.0.1:$PORT"
for i in $(seq 30); do curl -fs -o /dev/null "$B/" && break; sleep 1; done

fail=0
ok() { echo "ok   $*"; }
ko() { echo "FAIL $*"; fail=$((fail+1)); }
get() { curl -s -o "$W/page.html" -w '%{http_code}' "$B$1"; }
has() { grep -qF -- "$1" "$W/page.html"; }

echo "== markup"
get /home >/dev/null
has '<a class="scryfall-card" href="https://scryfall.com/search?q=%21%22Foudre%22" data-card="Foudre">Foudre</a>' && ok "[carte]: link to Scryfall exact search" || ko "[carte] markup"
has 'data-card="Llanowar Elves">Llanowar Elves</a>' && ok "[card] alias" || ko "[card]"
has 'data-card="Lightning Bolt">deux Foudres</a>' && ok '[carte="Name"]text: name and text apart' || ko "bbcode name"
has "data-card=\"Jace, l&apos;Arpenteur d&apos;esprit\">Jace, l&apos;Arpenteur d&apos;esprit</a>" && ! has '<b>d' && ok "apostrophe escaped, HTML removed" || ko "escaping: $(grep -o 'data-card="Jace[^<]*' "$W/page.html")"
has 'href="https://scryfall.com/search?q=%21%22Kongming%2C%20%5C%22Sleeping%20Dragon%5C%22%22"' && ok "quotes in a name escaped for Scryfall's search" || ko "quoted name"
has 'data-card="Æther Vial">Æther Vial</a>' && ok "entity typed by the author decoded once" || ko "entity"
has 'scryfall-tooltip.js' && has 'scryfall-tooltip.css' && ok "assets on a page with cards" || ko "assets missing"
get /home >/dev/null
has 'scryfall-tooltip.js' && ok "assets on the cached page too" || ko "assets missing from cache"
get /plain >/dev/null
has 'scryfall-tooltip' && ko "assets on a page without cards" || ok "no assets on a page without cards"
for f in scryfall-tooltip.js scryfall-tooltip.css; do code=$(curl -s -o /dev/null -w '%{http_code}' "$B/user/plugins/scryfall-tooltip/assets/$f"); [[ $code == 200 ]] || ko "asset $f $code"; done; ok "plugin assets served"
grep -qiE 'fatal|exception' "$W/php.log" && ko "PHP errors: $(grep -iE 'fatal|exception' "$W/php.log" | head -2)" || ok "no PHP error in the log"

echo "== browser"
if [[ -n "${HOLD:-}" ]]; then echo "ready $B"; sleep "$HOLD"; elif command -v node >/dev/null && node -e "require('playwright-core')" 2>/dev/null; then
  node "$REPO/test/browser.js" "$B" "$REPO/test/card.jpg" ${SHOTS:+"$SHOTS"} || fail=$((fail+1))
else ko "playwright-core not found (npm i --no-save playwright-core && npx playwright-core install chromium)"; fi
[[ $fail == 0 ]] && echo "ALL OK" || { echo "$fail FAILED"; exit 1; }
