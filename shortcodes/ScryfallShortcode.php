<?php
namespace Grav\Plugin\Shortcodes;

use Thunder\Shortcode\Shortcode\ShortcodeInterface;

/**
 * [scryfall]Foudre[/scryfall], [scryfall="Lightning Bolt"]deux Foudres[/scryfall].
 * The name is looked up by Scryfall in any language: the image is the printing in that language.
 * Optional printing: set=m10 (that set, language of the name), plus number=146 for one exact printing,
 * plus lang=fr for that printing in another language than English. Invalid values are ignored.
 */
class ScryfallShortcode extends Shortcode
{
    public function init()
    {
        $this->shortcode->getHandlers()->add('scryfall', function (ShortcodeInterface $sc) {
            // Plain text: tags removed, entities typed by the author (&AElig;, &rsquo;) decoded, escaped once below
            $plain = static fn($s): string => trim(html_entity_decode(strip_tags((string) $s), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            $text = $plain($sc->getContent());
            $name = $plain($sc->getBbCode()) ?: $text;
            if ($name === '') {
                return $text;
            }
            $param = static fn(string $key, string $pattern): string => preg_match($pattern, $v = strtolower($plain($sc->getParameter($key)))) ? $v : '';
            $set = $param('set', '/^[a-z0-9]{2,8}$/');
            $number = $set ? $param('number', '/^[\p{L}\p{N}★†-]{1,12}$/u') : '';
            $lang = $number ? $param('lang', '/^[a-z]{2,3}$/') : '';

            // Kept in the page cache meta by shortcode-core, so cached pages load them too
            $this->shortcode->addAssets('css', 'plugin://scryfall-tooltip/assets/scryfall-tooltip.css');
            $this->shortcode->addAssets('js', ['plugin://scryfall-tooltip/assets/scryfall-tooltip.js', ['group' => 'bottom', 'loading' => 'defer']]);
            $e = static fn(string $s): string => htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            // Exact search: Scryfall opens the card page itself when the query matches one card
            $query = '!"' . str_replace('"', '\\"', $name) . '"' . ($set ? " set:$set" : '') . ($number ? " cn:$number" : '') . ($lang ? " lang:$lang" : '');
            $href = 'https://scryfall.com/search?q=' . rawurlencode($query);
            // Image asked by the browser only on hover, focus or tap (assets/scryfall-tooltip.js)
            $img = 'https://api.scryfall.com/cards/' . ($number
                ? rawurlencode($set) . '/' . rawurlencode($number) . ($lang ? "/$lang" : '') . '?format=image&version=normal'
                : 'named?format=image&version=normal&fuzzy=' . rawurlencode($name) . ($set ? "&set=$set" : ''));

            return '<a class="scryfall-card" href="' . $e($href) . '" data-card="' . $e($name) . '" data-img="' . $e($img) . '">' . $e($text ?: $name) . '</a>';
        });
    }
}
