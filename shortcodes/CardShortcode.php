<?php
namespace Grav\Plugin\Shortcodes;

use Thunder\Shortcode\Shortcode\ShortcodeInterface;

/**
 * [carte]Foudre[/carte], [card]Lightning Bolt[/card], [mtg]Lightning Bolt[/mtg], [carte="Lightning Bolt"]deux Foudres[/carte].
 * The name is looked up by Scryfall in any language: the image is the printing in that language.
 */
class CardShortcode extends Shortcode
{
    public function init()
    {
        $handler = function (ShortcodeInterface $sc) {
            // Plain text: tags removed, entities typed by the author (&AElig;, &rsquo;) decoded, escaped once below
            $plain = static fn($s): string => trim(html_entity_decode(strip_tags((string) $s), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            $text = $plain($sc->getContent());
            $name = $plain($sc->getBbCode()) ?: $text;
            if ($name === '') {
                return $text;
            }
            // Kept in the page cache meta by shortcode-core, so cached pages load them too
            $this->shortcode->addAssets('css', 'plugin://scryfall-tooltip/assets/scryfall-tooltip.css');
            $this->shortcode->addAssets('js', ['plugin://scryfall-tooltip/assets/scryfall-tooltip.js', ['group' => 'bottom', 'loading' => 'defer']]);
            $e = static fn(string $s): string => htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            // Exact search: Scryfall opens the card page itself when the name matches one card
            $href = 'https://scryfall.com/search?q=' . rawurlencode('!"' . str_replace('"', '\\"', $name) . '"');

            return '<a class="scryfall-card" href="' . $e($href) . '" data-card="' . $e($name) . '">' . $e($text ?: $name) . '</a>';
        };
        $this->shortcode->getHandlers()->add('carte', $handler);
        $this->shortcode->getHandlers()->add('card', $handler);
        // Less generic than [card], for sites where another plugin or theme already claims it
        $this->shortcode->getHandlers()->add('mtg', $handler);
    }
}
