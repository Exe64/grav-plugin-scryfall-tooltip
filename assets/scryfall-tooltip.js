// Scryfall Tooltip: the card image on hover or keyboard focus; on touch screens, a modal sheet
// (native <dialog>: it takes the taps outside, keeps the focus and closes on Escape).
// Without JS, the name stays a link to the card on Scryfall.
(function () {
  var links = document.querySelectorAll('a.scryfall-card');
  if (!links.length) return;
  var fr = (document.documentElement.lang || '').slice(0, 2) === 'fr';
  var T = fr ? { open: 'Voir sur Scryfall', close: 'Fermer', missing: 'Carte introuvable sur Scryfall.' }
             : { open: 'View on Scryfall', close: 'Close', missing: 'Card not found on Scryfall.' };

  // One card view, shown either as the hover card or inside the sheet
  function view(cls) {
    var el = document.createElement(cls === 'scryfall-sheet' ? 'dialog' : 'div');
    el.className = cls;
    el.innerHTML = '<img alt="" width="244" height="340"><p class="scryfall-pop-msg" hidden></p>';
    var img = el.querySelector('img'), msg = el.querySelector('p');
    msg.textContent = T.missing;
    img.addEventListener('load', function () { el.classList.remove('loading'); });
    img.addEventListener('error', function () {
      if (!img.getAttribute('src')) return;
      el.classList.remove('loading'); img.hidden = true; msg.hidden = false;
      if (el === pop && !pop.hidden && owner) place(owner);
    });
    // The image URL comes from the shortcode (data-img): name, or set / number / lang
    el.load = function (a) {
      img.alt = a.dataset.card;
      if (img.dataset.img === a.dataset.img) return;
      img.dataset.img = a.dataset.img; img.hidden = false; msg.hidden = true;
      el.classList.add('loading');
      img.removeAttribute('src'); // never show the previous card while the next one loads
      img.src = a.dataset.img;
    };
    document.body.appendChild(el);
    return el;
  }

  var pop = view('scryfall-pop');
  pop.hidden = true;
  var owner = null, by = null, touch = false, later = 0;

  function place(a) {
    var r = a.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight, m = 8;
    var top = r.bottom + m + h <= innerHeight ? r.bottom + m : Math.max(m, r.top - m - h);
    pop.style.top = top + 'px';
    pop.style.left = Math.min(Math.max(m, r.left), innerWidth - w - m) + 'px';
  }
  function show(a, how) {
    clearTimeout(later);
    pop.load(a);
    owner = a; by = how;
    pop.hidden = false;
    place(a);
  }
  function hide() { clearTimeout(later); pop.hidden = true; owner = null; by = null; }
  function focused() { var f = document.activeElement; return f && f.matches && f.matches('a.scryfall-card') ? f : null; }
  // The pointer left: wait a moment (it may be crossing to the card), then fall back to the
  // card of the focused link, if any, instead of closing it under a keyboard user
  function soon() {
    clearTimeout(later);
    later = setTimeout(function () { var f = focused(); if (f && !touch) show(f, 'focus'); else hide(); }, 150);
  }

  var sheet = null;
  function open(a) {
    if (!sheet) {
      sheet = view('scryfall-sheet');
      sheet.insertAdjacentHTML('beforeend', '<p class="scryfall-pop-bar"><a></a><button type="button"></button></p>');
      sheet.querySelector('.scryfall-pop-bar a').textContent = T.open;
      var shut = sheet.querySelector('.scryfall-pop-bar button');
      shut.textContent = T.close;
      shut.addEventListener('click', function () { sheet.close(); });
      // A tap on the backdrop lands on the dialog itself
      sheet.addEventListener('click', function (e) { if (e.target === sheet) sheet.close(); });
    }
    hide();
    sheet.load(a);
    sheet.setAttribute('aria-label', a.dataset.card);
    sheet.querySelector('.scryfall-pop-bar a').href = a.href;
    sheet.showModal();
    sheet.querySelector('.scryfall-pop-bar button').focus();
  }

  document.addEventListener('pointerdown', function (e) { touch = e.pointerType === 'touch'; }, true);
  document.addEventListener('keydown', function (e) {
    touch = false;
    if (e.key === 'Escape') hide();
  }, true);
  links.forEach(function (a) {
    a.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') show(a, 'pointer'); });
    a.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch' && !pop.contains(e.relatedTarget)) soon(); });
    a.addEventListener('focus', function () { if (!touch) show(a, 'focus'); });
    a.addEventListener('blur', function (e) { if (owner === a && !pop.contains(e.relatedTarget)) hide(); });
    // First tap shows the card; the sheet's link leads to Scryfall
    a.addEventListener('click', function (e) { if (touch) { e.preventDefault(); open(a); } });
  });
  pop.addEventListener('pointerenter', function () { clearTimeout(later); });
  pop.addEventListener('pointerleave', function (e) { if (e.relatedTarget !== owner) soon(); });
  // Scrolling: a card opened by the pointer closes; one opened by the keyboard follows its link
  // (the browser scrolls itself to bring a focused link into view)
  addEventListener('scroll', function () { if (!pop.hidden) { if (by === 'focus') place(owner); else hide(); } }, { passive: true });
})();
