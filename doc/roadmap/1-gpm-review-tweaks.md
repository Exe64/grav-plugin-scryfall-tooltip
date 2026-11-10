---
plan:
  id: '1'
  name: 1-gpm-review-tweaks.md
  link: doc/roadmap/1-gpm-review-tweaks.md
  source: local
status: active
date: 2026-11-09
enriched: 2026-11-10
description: >
  Retouches de la revue GPM (compatibility 2.0, .gitattributes) et shortcode unique [scryfall] avec édition facultative (set, number, lang). Version 2.0.0.
priority: medium
complexity: S
intent: production
scope:
  modules:
    - blueprints.yaml
    - .gitattributes
    - shortcodes/ScryfallShortcode.php
    - assets/scryfall-tooltip.js
    - test/
    - README.md
    - CHANGELOG.md
issue:
  id: null
  url: null
---

# [🧹] Plan #1 - GPM Review Tweaks

## Objectif

Le plugin est accepté dans GPM. La revue propose trois retouches optionnelles : la convention `compatibility: grav: ['2.0']`, un zip de release sans `test/` ni `.github/`, et un alias moins générique que `[card]`.

## Périmètre

### Inclus
- `blueprints.yaml` : `compatibility.grav` à `['2.0']`, version 1.1.0
- `.gitattributes` : `export-ignore` pour `test/`, `.github/`, `.gitignore`, `doc/`
- Shortcode unique `[scryfall]` : `[card]` et `[carte]` retirés (aucun site en production, confirmé le 2026-11-10)
- Attributs facultatifs `set`, `number` (avec `set`) et `lang` (avec `number`) pour viser une impression
- Aide des shortcodes dans la page de configuration du plugin (champ `display` du blueprint)
- README et CHANGELOG v2.0.0

### Hors scope
- Boutons dans la barre de l'éditeur (API d'admin2 non documentée ; remplacés par l'aide dans la configuration)
- Exclusion de `docs/` (captures référencées par le README)
- Tag et push de la release

## Étapes

- [x] Étape 1 — compatibility 2.0 + version 1.1.0 (XS · standard → Sonnet)
- [x] Étape 2 — .gitattributes export-ignore (XS · standard → Sonnet)
- [x] Étape 3 — alias [mtg] + test + README + CHANGELOG (XS · standard → Sonnet)
- [x] Étape 4 — [mtg] renommé [scryfall], [card] et [carte] retirés (XS · standard → Sonnet)
- [x] Étape 5 — set / number / lang : URL d'image calculée côté PHP (data-img), lien de recherche filtré (S · standard → Sonnet)
- [x] Étape 6 — aide des shortcodes dans la configuration du plugin, README, CHANGELOG 2.0.0 (XS · standard → Sonnet)
- [x] 🧪 Tests — Rédiger et exécuter la procédure de test (avant-dernière étape, obligatoire)
- [ ] ✅ Validation — Vérifier les résultats des tests et clôturer (dernière étape, obligatoire)

## Décisions techniques

| Décision | Choix retenu | Justification |
|----------|-------------|---------------|
| Nom du shortcode | `[scryfall]` seul (remplace `[mtg]`, `[card]`, `[carte]`) | Nom spécifique, sans risque de conflit ; aucun site en production |
| Version | 2.0.0 | Retrait de `[card]` et `[carte]`, publiés en 1.0.0 = changement cassant |
| Édition | `set`, `number`, `lang` facultatifs | `named?fuzzy&set` garde la langue du nom ; `/cards/set/number` répond en anglais sans `lang` |
| URL de l'image | Calculée en PHP, passée en `data-img` | Un seul endroit, couvert par les tests de balisage sans navigateur |
| Valeur invalide | Attribut ignoré | Pas d'URL cassée ; la carte retombe sur l'impression par défaut |
| Boutons d'éditeur | Remplacés par une aide dans la configuration | API d'admin2 non documentée |
| `doc/roadmap/` | `export-ignore` | Suivi de projet, inutile dans une installation |

## Tests

### Prérequis pour les tests

```bash
cd /srv/dev/grav-plugin-scryfall-tooltip
```

### Procédure de test

```bash
bash test/run.sh
git archive HEAD | tar -t | grep -E '^(test|\.github|doc)/|^\.gitignore$' || echo "nothing excluded leaks"
```

**Résultats attendus :** `ALL OK` (dont les lignes `[scryfall]`, `set=`, `set= number= lang=`, `invalid set ignored`, `[card] no longer handled`) ; l'archive ne contient ni `test/`, ni `.github/`, ni `doc/`, ni `.gitignore`.

### Résultats joués et vérifiés

| Date | Test | Attendu | Observé | Verdict |
|------|------|---------|---------|---------|
| 2026-11-09 | `php -l shortcodes/CardShortcode.php` (php:8.3-cli-alpine) | Aucune erreur | No syntax errors detected | ✅ |
| 2026-11-09 | `HOLD=1 bash test/run.sh` (conteneur, balisage seul) | 12 `ok`, dont `[mtg] alias` | 12 `ok`, ALL OK | ✅ |
| 2026-11-09 | Partie navigateur de `test/run.sh` | Passe en CI | Non jouée en local (pas de PHP ni de playwright-core sur l'hôte) ; JS inchangé, couvert par la CI au push | ⏳ CI |
| 2026-11-10 | `php -l` des deux fichiers PHP (php:8.3-cli-alpine) | Aucune erreur | No syntax errors detected ×2 | ✅ |
| 2026-11-10 | `blueprints.yaml` chargé par `yaml.safe_load` | Champs `enabled` et `usage` (display) | `['enabled', 'usage']`, version 2.0.0, grav `['2.0']` | ✅ |
| 2026-11-10 | `HOLD=1 bash test/run.sh` (conteneur, balisage seul) | 15 `ok` : [scryfall], set=, set= number= lang=, set invalide ignoré, number sans set ignoré, [card] non traité | 15 `ok`, ALL OK | ✅ |
| 2026-11-10 | API Scryfall en direct : `named?fuzzy=Foudre&set=m10`, `cards/m10/146/fr`, `set=zzz` | m10 en français ; impression exacte ; 404 | m10 fr n°146 ; 302 vers l'image ; 404 | ✅ |
| 2026-11-10 | Aide dans la page de configuration (admin) | Tableau des shortcodes affiché | Non vérifié : pas d'admin dans le banc de test | ⏳ à regarder dans l'admin |
| 2026-11-10 | CI (run 42779174477, commit a898ece) : balisage + navigateur | ALL OK | 15 `ok` balisage + 4 `ok` navigateur (survol, clavier, carte introuvable, tactile), ALL OK | ✅ |
| 2026-11-10 | Zip GitHub du tag v2.0.0 | Ni `test/`, `.github/`, `doc/`, `.gitignore` | assets, shortcodes, blueprints, docs, README, CHANGELOG, LICENSE uniquement | ✅ |
| 2026-11-09 | `git archive` de l'index | Ni `test/`, `.github/`, `doc/`, `.gitignore`, `.gitattributes` | nothing excluded leaks | ✅ |

## Journal de session

### Session 2026-11-09
- ✅ Fait : plan créé à partir de la revue GPM ; étapes 1-3 ; tests balisage et archive
- 📋 Prochain : push, vérifier la CI (partie navigateur), tag v1.1.0
- 🚧 Note : `graft/` (cache local) exclu via `.git/info/exclude`

### Session 2026-11-10
- ✅ Fait : étapes 4 à 6 ; tests balisage, YAML, API Scryfall
- ✅ Fait : rebase sur 3 commits README distants, push, CI verte, tag v2.0.0 poussé
- 📋 Prochain : vérifier l'aide dans la page de configuration de l'admin, puis ✅ Validation ; release GitHub v2.0.0 à créer (refusée en mode auto)
- 🚧 Note : `lang` ajouté (non prévu au cadrage) : sans lui, `/cards/set/number` répond en anglais
