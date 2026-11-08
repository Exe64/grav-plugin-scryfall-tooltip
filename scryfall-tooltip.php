<?php
namespace Grav\Plugin;

use Grav\Common\Plugin;

/**
 * [carte]Name[/carte] (or [card]): a link to the card on Scryfall that shows its image on hover,
 * keyboard focus or tap. The browser asks Scryfall for the image only then; nothing is stored here.
 */
class ScryfallTooltipPlugin extends Plugin
{
    public static function getSubscribedEvents(): array
    {
        return ['onShortcodeHandlers' => ['onShortcodeHandlers', 0]];
    }

    public function onShortcodeHandlers(): void
    {
        $this->grav['shortcode']->registerAllShortcodes(__DIR__ . '/shortcodes');
    }
}
