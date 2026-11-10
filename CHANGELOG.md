# v2.0.4
## 2026-11-10

1. [](#bugfix)
    * Plugin description: no double quotes, getgrav.org escaped them twice on the plugin card

# v2.0.3
## 2026-11-10

1. [](#improved)
    * Plugin description: the five shortcodes only, instead of the full usage text

# v2.0.2
## 2026-11-10

1. [](#improved)
    * Usage documentation moved from the configuration page to the plugin description

# v2.0.1
## 2026-11-10

1. [](#improved)
    * Full usage documentation in the plugin's configuration page: shortcode table, printing rules, how it works

# v2.0.0
## 2026-11-10

1. [](#new)
    * One shortcode, `[scryfall]`, a name no other plugin or theme is likely to claim
    * Optional printing: `set=m10`, then `number=146` for one exact printing and `lang=fr` for its language
    * Shortcode list in the plugin's configuration page
1. [](#improved)
    * `compatibility: grav: ['2.0']`, the GPM convention (Grav 2.2 is still the minimum)
    * Release archives no longer include `test/`, `.github/` or `doc/`
1. [](#bugfix)
    * Breaking: `[card]` and `[carte]` are gone, replace them with `[scryfall]`

# v1.0.0
## 2026-11-08

1. [](#new)
    * First public release: `[card]` and `[carte]` shortcodes, card image from Scryfall on hover, keyboard focus or tap
