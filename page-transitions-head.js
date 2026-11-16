/* SavorSuite Tier 0+/1 head script: classic, parser-blocking, in <head> (pagereveal must be registered before first render).
   Chromium: everything below. Safari 18.2–26.1: no navigation.activation, so no "back" type and no Plate Lift on return; forward
   Plate Lift works (pageswap activation). Safari 26.2 / Firefox 147 have navigation.activation (research addendum, MDN BCD; not tested here).
   A transition that is not ready within ~4s is skipped by Chrome (TimeoutError): __savorReveal resolves 'skipped', Tier 1 still reveals. */
(function () {
  var html = document.documentElement;
  var motionOK = matchMedia('(prefers-reduced-motion: no-preference)').matches;
  // Tier 1 (off by default; on per page with <html data-tier1>). Failsafe: content never stays hidden past 1.5s AFTER the page is shown —
  // a prerendered page starts the clock on activation, not while it waits unseen.
  var tier1 = html.hasAttribute('data-tier1');
  if (tier1 && motionOK) html.classList.add('savor-enter');
  var failsafe = function () { setTimeout(function () { html.classList.remove('savor-enter'); }, 1500); };
  if (tier1) { if (document.prerendering) document.addEventListener('prerenderingchange', function onActivate() { document.removeEventListener('prerenderingchange', onActivate); failsafe(); }); else failsafe(); }
  // Transitions vs prerender are split (Case 10): sensitive routes (auth, checkout, payment, side-effect GETs, downloads, external)
  // are NEVER PRERENDERED — that list lives in the speculation rule. A plain GET to a static login / auth page still crossfades.
  // Transition opt-outs: <html data-no-transition> on a genuinely sensitive page (either side of the navigation), or data-no-transition
  // on a link. Reloads never transition. Form POSTs get no special skip here: mark a POST result page data-no-transition if it
  // must not animate (Chrome 156 DOES run the crossfade into a same-origin POST result — measured, RESULTS.md Revision 2).
  var path = function (u) { try { return new URL(u, location.href).pathname; } catch (e) { return ''; } };
  var noVtHref = null;                                                 // last clicked a[data-no-transition]
  document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[href]'); noVtHref = a && a.hasAttribute('data-no-transition') ? a.href : null; }, true);
  var inView = function (el) { var r = el.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth; };
  // Plate Lift: name ONE card (the one that matches the other page), only when it is on screen, never on a detail page.
  var plate = function (url) {
    if (document.querySelector('[data-detail] .page-hero__media')) return null;      // this page carries hero-media itself
    var p = path(url), cards = document.querySelectorAll('[data-plate]');
    for (var i = 0; i < cards.length; i++) if (path(cards[i].href) === p) { var img = cards[i].querySelector('img'); return img && inView(img) ? img : null; }
    return null;
  };
  var name = function (img, vt) { img.style.viewTransitionName = 'hero-media'; vt.finished.then(function () { img.style.viewTransitionName = ''; }, function () { img.style.viewTransitionName = ''; }); };
  // Interruption: while a transition runs, the ::view-transition overlay takes every click (target = <html>). A click there skips the
  // transition and is replayed on whatever is under the pointer, so a second click goes straight to its page: no queue, no lost tap.
  // v0.0.8.5 rev 3: the navigation that click starts is skipped in pageswap too, so the next page lands at once instead of replaying
  // the full crossfade (measured: 258ms replay before, none after — RESULTS.md Revision 3).
  // v0.0.8.5 rev 4: skipping rejects ready / finished; mark them handled so a skip never logs "Uncaught (in promise) … skipTransition()
  // called" (seen 1 run in 3 on the interruption step in Chrome 156 headless).
  var noop = function () {}, skip = function (vt) { vt.ready.catch(noop); vt.finished.catch(noop); vt.skipTransition(); };
  var running = null, interrupted = false;
  document.addEventListener('click', function (e) {
    var vt = running; if (!vt || e.target !== html || e.button !== 0 || e.defaultPrevented) return;
    running = null; skip(vt);
    var el = document.elementFromPoint(e.clientX, e.clientY);
    el = el && el.closest('a[href], button, summary, label, input, select, textarea, [role="button"]');
    if (!el) return;
    interrupted = true; setTimeout(function () { interrupted = false; }, 1000);   // only the navigation this click starts (1s window)
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && !/^(submit|button|checkbox|radio|reset|image)$/.test(el.type)) el.focus(); else el.click();
  }, true);
  // v0.0.8.5 rev 4 (Case 10): a shared element must be VISIBLE when it is snapshotted. An element named while it is still at
  // opacity 0 (its entrance has not run yet) is captured as an empty box: it flies in invisible and pops at the end. So names that
  // need an entrance go on data-vt-name="…" instead of in CSS; the name is set only at the two capture moments (pageswap on the old
  // page, pagereveal on the new one) and only if the element and every ancestor are fully opaque and visible right then. A name not
  // set simply means the element crossfades with the page. (CSS / Web Animations entrances are covered; a script tween is covered
  // too, because the opacity is read, not the animation.)
  var opaque = function (el) { for (var e = el; e && e.nodeType === 1; e = e.parentElement) { var cs = getComputedStyle(e);
    if (+cs.opacity < 0.99 || cs.visibility !== 'visible' || cs.display === 'none') return false; } return true; };
  var nameVisible = function () { var els = document.querySelectorAll('[data-vt-name]');
    for (var i = 0; i < els.length; i++) els[i].style.viewTransitionName = opaque(els[i]) ? els[i].getAttribute('data-vt-name') : ''; };
  // v0.0.8.5 rev 4: fallback for browsers WITHOUT cross-document view transitions (page-transitions.css section 6). A 200ms fade-in of
  // the content, started two frames after the first paint so the fade is seen in full; the CSS failsafe shows it by ~300ms anyway.
  // Never where the browser has native transitions (CSSViewTransitionRule), never for reduced motion / data-no-transition / reloads,
  // and only after an in-site link click (sessionStorage stamp, 5s) or a history step.
  var FB = 'savor-fb';
  if (typeof window.CSSViewTransitionRule === 'undefined' && motionOK && !html.hasAttribute('data-no-transition')) {
    var stamp = 0, nt = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0] || {}).type;
    try { stamp = +sessionStorage.getItem(FB) || 0; sessionStorage.removeItem(FB); } catch (e) {}
    if (nt !== 'reload' && (nt === 'back_forward' || Date.now() - stamp < 5000)) {
      html.classList.add(FB);
      var fbDone = function () { html.classList.remove(FB, 'savor-fb-in'); };
      var fbIn = function () { html.classList.add('savor-fb-in'); setTimeout(fbDone, 400); };
      requestAnimationFrame(function () { requestAnimationFrame(fbIn); });
      setTimeout(fbDone, 1000);   // frames never came (the CSS failsafe has already shown the content): just clean up
    }
    addEventListener('pageshow', function (e) { if (e.persisted) html.classList.remove(FB, 'savor-fb-in'); });   // bfcache: never restore hidden
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.origin !== location.origin || a.target || a.hasAttribute('download') || a.hasAttribute('data-no-transition')) return;
      if (a.pathname === location.pathname && a.search === location.search) return;   // same-page #hash: no navigation
      try { sessionStorage.setItem(FB, String(Date.now())); } catch (x) {}
    });
  }
  window.__savorReveal = new Promise(function (resolve) {
    addEventListener('pagereveal', function (e) {
      var vt = e.viewTransition;
      if (!vt) return resolve('none');
      nameVisible();
      var act = window.navigation && navigation.activation;           // Safari < 26.2: undefined (guarded)
      if (html.hasAttribute('data-no-transition') || (act && act.navigationType === 'reload')) { skip(vt); return resolve('skipped'); }
      if (act && act.navigationType === 'traverse')                    // history back -> reversed slide; history forward keeps the forward one
        vt.types.add(act.from && act.entry && act.entry.index > act.from.index ? 'forward' : 'back');
      var img = act && act.from && plate(act.from.url);              // detail -> list (incl. back): name the card we came from
      if (img) name(img, vt);
      running = vt;
      var done = function () { if (running === vt) running = null; };
      vt.finished.then(done, done);
      vt.ready.then(function () { resolve('vt'); }, function () { resolve('skipped'); });
    });
    if (!('onpagereveal' in window)) document.addEventListener('DOMContentLoaded', function () { resolve('none'); });
  });
  addEventListener('pageswap', function (e) {                           // list -> detail: name the clicked card on the old page
    var vt = e.viewTransition; if (!vt) return;
    nameVisible();
    if (interrupted) { interrupted = false; skip(vt); return; }   // second click mid-transition: land without a replay
    var to = e.activation && e.activation.entry && e.activation.entry.url;
    if (html.hasAttribute('data-no-transition') || (to && noVtHref && to.split('#')[0] === noVtHref.split('#')[0])) { noVtHref = null; skip(vt); return; }
    var img = to && plate(to);
    if (img) name(img, vt);
  });
})();
