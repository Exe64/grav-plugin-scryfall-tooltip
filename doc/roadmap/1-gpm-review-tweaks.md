---
plan:
  id: '1'
  name: 1-gpm-review-tweaks.md
  link: doc/roadmap/1-gpm-review-tweaks.md
  source: local
status: active
date: 2026-11-09
description: >
  Appliquer les retouches optionnelles de la revue GPM : compatibility 2.0, .gitattributes export-ignore, alias [mtg]. Version 1.1.0.
priority: medium
complexity: S
intent: production
scope:
  modules:
    - blueprints.yaml
    - .gitattributes
    - shortcodes/CardShortcode.php
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
- Shortcode `[mtg]` en plus de `[carte]` et `[card]`, testé et documenté
- CHANGELOG v1.1.0

### Hors scope
- Retrait de `[card]` ou `[carte]` (casserait les pages existantes)
- Exclusion de `docs/` (captures référencées par le README)
- Tag et push de la release

## Étapes

- [x] Étape 1 — compatibility 2.0 + version 1.1.0 (XS · standard → Sonnet)
- [x] Étape 2 — .gitattributes export-ignore (XS · standard → Sonnet)
- [x] Étape 3 — alias [mtg] + test + README + CHANGELOG (XS · standard → Sonnet)
- [x] 🧪 Tests — Rédiger et exécuter la procédure de test (avant-dernière étape, obligatoire)
- [ ] ✅ Validation — Vérifier les résultats des tests et clôturer (dernière étape, obligatoire)

## Décisions techniques

| Décision | Choix retenu | Justification |
|----------|-------------|---------------|
| Alias | Ajouter `[mtg]`, garder `[carte]` et `[card]` | Rétrocompatibilité ; `[mtg]` documenté comme la forme sûre en cas de conflit |
| Version | 1.1.0 | Nouveau shortcode = fonctionnalité mineure |
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

**Résultats attendus :** `ALL OK` (dont la ligne `ok   [mtg] alias`) ; l'archive ne contient ni `test/`, ni `.github/`, ni `doc/`, ni `.gitignore`.

### Résultats joués et vérifiés

| Date | Test | Attendu | Observé | Verdict |
|------|------|---------|---------|---------|
| 2026-11-09 | `php -l shortcodes/CardShortcode.php` (php:8.3-cli-alpine) | Aucune erreur | No syntax errors detected | ✅ |
| 2026-11-09 | `HOLD=1 bash test/run.sh` (conteneur, balisage seul) | 12 `ok`, dont `[mtg] alias` | 12 `ok`, ALL OK | ✅ |
| 2026-11-09 | Partie navigateur de `test/run.sh` | Passe en CI | Non jouée en local (pas de PHP ni de playwright-core sur l'hôte) ; JS inchangé, couvert par la CI au push | ⏳ CI |
| 2026-11-09 | `git archive` de l'index | Ni `test/`, `.github/`, `doc/`, `.gitignore`, `.gitattributes` | nothing excluded leaks | ✅ |

## Journal de session

### Session 2026-11-09
- ✅ Fait : plan créé à partir de la revue GPM ; étapes 1-3 ; tests balisage et archive
- 📋 Prochain : push, vérifier la CI (partie navigateur), tag v1.1.0
- 🚧 Note : `graft/` (cache local) exclu via `.git/info/exclude`
