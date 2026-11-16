/* Sweet & Sour · shared motion runtime (classic script, works from file://).
   Sets html.motion when motion is allowed and html.wide on desktop, exposes window.__savor for the QA tools,
   runs Lenis smooth scroll on wide screens with a fine pointer, and hides the header while reading down. */
(function () {
  'use strict';
  var d = document.documentElement;
  var FRAMES = /[?&]frames=1/.test(location.search);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var G = window.gsap, ST = window.ScrollTrigger;
  if (FRAMES) d.classList.add('frames');
  if (G && ST && !reduce.matches) d.classList.add('motion');
  if (window.matchMedia('(min-width: 900px)').matches) d.classList.add('wide');

  var readyResolve;
  var S = window.__savor = {
    frames: FRAMES,
    chapters: {},
    checks: {},
    ready: new Promise(function (r) { readyResolve = r; }),
    check: function (n) { var f = S.checks[n]; return f ? f() === true : false; },
    triggerCount: function () { return ST ? ST.getAll().length : 0; }
  };

  function absTop(el) { return el.getBoundingClientRect().top + window.scrollY; }
  function range(el) {
    var t = absTop(el), h = el.offsetHeight, vh = window.innerHeight;
    return { start: t, end: Math.max(t, t + h - vh) };
  }
  S.range = range;
  S.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  S.chapter = function (id, el, opt) {
    opt = opt || {};
    S.chapters[id] = {
      appmap: opt.appmap || id,
      points: opt.points || [0, 0.5, 1],
      hold: opt.hold != null ? opt.hold : 0.5,
      seek: function (p) {
        var r = opt.range ? opt.range() : range(el);
        var y = Math.round(r.start + p * (r.end - r.start));
        if (S.lenis) S.lenis.scrollTo(y, { immediate: true, force: true });
        window.scrollTo(0, y);
        if (ST) ST.update();
      }
    };
  };

  S.arm = function (lead, section, start) {
    if (!lead) return;
    if (!ST || !d.classList.contains('motion')) { lead.setAttribute('data-armed', ''); return; }
    ST.create({
      trigger: section, start: start || 'top 40%',
      onEnter: function () { lead.setAttribute('data-armed', ''); },
      onLeaveBack: function () { lead.removeAttribute('data-armed'); }
    });
  };

  S.trig = function (tl, cfg) {
    tl.pause(0);
    return ST.create({
      trigger: cfg.trigger, start: cfg.start || 'top 70%',
      onEnter: function () { if (FRAMES) tl.progress(1); else tl.play(); if (cfg.onEnter) cfg.onEnter(); },
      onLeaveBack: function () { if (FRAMES) tl.progress(0); else tl.reverse(); if (cfg.onLeaveBack) cfg.onLeaveBack(); }
    });
  };

  S.scrub = FRAMES ? true : 0.2;

  /* Line-mask lead reveal: each .line__in rises out of its mask once the course is reached. */
  S.lead = function (G, lead, trigger, start) {
    if (!lead) return;
    var lines = lead.querySelectorAll('.line__in');
    if (!lines.length) return;
    var tl = G.timeline().fromTo(lines, { yPercent: 105 }, { yPercent: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 });
    S.trig(tl, { trigger: trigger || lead, start: start || 'top 88%' });
  };

  /* Header: slides up while reading down, returns on any upward scroll. */
  function header() {
    var h = document.querySelector('.site-header');
    if (!h) return;
    var last = window.scrollY, ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (FRAMES || y < 120 || y < last - 4) h.classList.remove('is-hidden');
        else if (y > last + 4) h.classList.add('is-hidden');
        last = y; ticking = false;
      });
    }, { passive: true });
    h.addEventListener('focusin', function () { h.classList.remove('is-hidden'); });
    /* keyboard users: scroll-linked fades never hide a Tab stop */
    document.addEventListener('keydown', function (e) { if (e.key === 'Tab') document.documentElement.classList.add('kbd'); });
    document.addEventListener('pointerdown', function () { document.documentElement.classList.remove('kbd'); }, { passive: true });
  }

  function lenisOn() {
    if (FRAMES || !window.Lenis || !G || !ST) return null;
    var l = new window.Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 1 });
    l.on('scroll', ST.update);
    var tick = function (t) { l.raf(t * 1000); };
    G.ticker.add(tick);
    G.ticker.lagSmoothing(0);
    S.lenis = l;
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || !S.lenis) return;
      var t = document.querySelector(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      S.lenis.scrollTo(t, { offset: 0 });
      if (t.id === 'main' || t.tabIndex >= 0) t.focus({ preventScroll: true });
    });
    return function () { G.ticker.remove(tick); l.destroy(); S.lenis = null; };
  }

  S.boot = function (setup) {
    header();
    var done = function () {
      Promise.all([document.fonts ? document.fonts.ready : 0, new Promise(function (r) {
        if (document.readyState === 'complete') r(); else window.addEventListener('load', r, { once: true });
      })]).then(function () {
        if (ST) ST.refresh();
        requestAnimationFrame(function () { readyResolve(true); });
      });
    };
    if (!G || !ST) { setup(null, { reduce: true }); done(); return; }
    G.registerPlugin(ST);
    var mm = G.matchMedia();
    mm.add({
      wide: '(min-width: 900px) and (prefers-reduced-motion: no-preference)',
      narrow: '(max-width: 899.98px) and (prefers-reduced-motion: no-preference)',
      reduce: '(prefers-reduced-motion: reduce)',
      fine: '(pointer: fine)'
    }, function (ctx) {
      var c = ctx.conditions;
      d.classList.toggle('motion', !c.reduce);
      d.classList.toggle('wide', !!c.wide);
      var off = (c.wide && c.fine) ? lenisOn() : null;
      var undo = setup(G, c);
      return function () { if (off) off(); if (typeof undo === 'function') undo(); };
    });
    done();
  };
})();
