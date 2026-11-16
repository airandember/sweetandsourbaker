/* Sweet & Sour · about page courses (classic script).
   AH drizzle settles on a shelf → slash → A1 the kitchen comes apart → A2 counts rise like dough → AL flip me over. */
(function () {
  'use strict';
  var S = window.__savor;
  if (!S) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var FR = S.frames;

  var ah = $('#ah'), a1 = $('#a1'), a2 = $('#a2'), al = $('#al');
  S.chapter('AH', ah, { points: [0, 0.5, 1], hold: 0.5 });
  S.chapter('A1', a1, { points: [0, 0.5, 1], hold: 0.5 });
  S.chapter('A2', a2, { points: [0, 0.5, 1], hold: 0.5 });
  S.chapter('AL', al, { points: [0, 0.5, 1], hold: 1 });

  /* The flip card works with or without GSAP: aria-pressed is the truth. */
  var flip = $('.card__flip'), back = $('.card__face--back');
  function setPressed(on) {
    flip.setAttribute('aria-pressed', on ? 'true' : 'false');
    back.setAttribute('aria-hidden', on ? 'false' : 'true');
  }

  S.boot(function (G, c) {
    var leads = $$('[data-lead]');
    if (!G || c.reduce) {
      leads.forEach(function (l) { l.setAttribute('data-armed', ''); });
      var plain = function () { var on = flip.getAttribute('aria-pressed') !== 'true'; setPressed(on); flip.classList.toggle('is-flipped', on); };
      flip.addEventListener('click', plain);
      return function () { flip.removeEventListener('click', plain); };
    }
    var cleanups = [], wide = !!c.wide, fine = !!c.fine;

    leads.forEach(function (l) { S.lead(G, l, l, 'top 92%'); S.arm(l, l.closest('[data-chapter]') || l, 'top 85%'); });

    /* ---------- AH · a drizzle of loaves falls and settles on the shelf ---------- */
    var drops = $$('.drop', ah), shelf = $('.ahero__shelf', ah), stage = $('.ahero__stage', ah);
    var fall = G.timeline({ scrollTrigger: { trigger: ah, start: 'top top', end: 'bottom bottom', scrub: FR ? true : 0.4, invalidateOnRefresh: true } });
    drops.forEach(function (dr, i) {
      var land = function () { return shelf.offsetTop - dr.offsetTop - dr.offsetHeight + stage.offsetHeight * 0.006 * (i % 3); };
      fall.fromTo(dr, { y: 0, rotation: (i % 2 ? 1 : -1) * (10 + i * 3), autoAlpha: i % 2 ? 0.85 : 0.7 },
        { y: land, rotation: (i % 2 ? -1 : 1) * (1 + (i % 3)), autoAlpha: 1, duration: 0.55, ease: 'bounce.out' }, i * 0.07);
    });
    fall.to('.ahero__text', { yPercent: -8, autoAlpha: 0.55, duration: 0.3, ease: 'none' }, 0.85);
    /* W2/W3 (about MD 19:37): wide front-loads the portrait so the first wheel visibly lands; narrow spreads it linearly over the whole AH
       range so 0.4–0.9vh never goes still while the drops are mid-bounce. */
    if (wide) fall.fromTo('.portrait__img', { scale: 1.35, yPercent: 8 }, { scale: 1, yPercent: 0, duration: 0.4, ease: 'power1.out' }, 0);
    else fall.fromTo('.portrait__img', { scale: 1.45, yPercent: 12, rotation: -3 }, { scale: 1.2, yPercent: 6, rotation: -1.5, duration: 0.2, ease: 'power1.out' }, 0)
      .to('.portrait__img', { scale: 1, yPercent: 0, rotation: 0, duration: 0.9, ease: 'none' }, 0.2);
    /* W2 (about MD 20:04): wide also settles the whole framed portrait out of a larger, nearer pose on the first input */
    if (wide) fall.fromTo('.portrait', { scale: 1.28, xPercent: -10 }, { scale: 1, xPercent: 0, duration: 0.3, ease: 'power1.out' }, 0);
    fall.fromTo('.ahero__text', { y: 0 }, { y: wide ? -110 : -70, duration: 0.35, ease: 'power1.out' }, 0);
    /* hold floor (Aaron 20:27): AH runway 110vh -> 165vh. The beats above keep their scroll distance (timeline padded to 1.5x) and the
       added runway carries a slow settle so the lead holds without a dead stretch. */
    var fT = fall.duration();
    fall.to('.portrait', { yPercent: -5, rotation: wide ? 1.5 : -1.5, duration: fT * 0.5, ease: 'none' }, fT)
      .to(drops, { y: '+=' + (wide ? 10 : 8), rotation: '+=4', duration: fT * 0.5, ease: 'none' }, fT);
    var spot = $('.portrait__spot', ah), portrait = $('.portrait', ah);
    if (wide && fine && portrait) {
      var px = { x: 50, y: 40 }, put = function () { spot.style.setProperty('--sx', px.x.toFixed(1) + '%'); spot.style.setProperty('--sy', px.y.toFixed(1) + '%'); };
      var mv = function (e) { var r = portrait.getBoundingClientRect(); G.to(px, { x: (e.clientX - r.left) / r.width * 100, y: (e.clientY - r.top) / r.height * 100, duration: 0.6, ease: 'power3.out', overwrite: true, onUpdate: put }); };
      portrait.addEventListener('pointermove', mv);
      cleanups.push(function () { portrait.removeEventListener('pointermove', mv); spot.style.removeProperty('--sx'); spot.style.removeProperty('--sy'); });
    }

    /* ---------- slash · the score opens onto the next room ---------- */
    var slash = $('.slash--about');
    if (slash) {
      G.timeline({ scrollTrigger: { trigger: slash, start: 'top bottom', end: 'bottom bottom', scrub: S.scrub } })
        .fromTo('.slash--about .slash__path', { attr: { d: 'M0.08,0.52 C0.30,0.50 0.62,0.48 0.92,0.46 C0.62,0.48 0.30,0.50 0.08,0.52 Z' } },
          { attr: { d: 'M-0.35,0.62 C0.05,-0.55 0.85,-0.70 1.35,0.40 C0.95,1.65 0.10,1.70 -0.35,0.62 Z' }, ease: 'power2.inOut', duration: 1 }, 0.1)
        .fromTo('.slash--about .slash__img', { scale: 1.25, rotation: 4 }, { scale: 1, rotation: 0, ease: 'none', duration: 1.1 }, 0);
    }

    /* ---------- A1 · the kitchen comes apart into its three parts ---------- */
    var layers = $$('.layer', a1);
    if (wide) {
      var spread = [{ x: '-36vw', y: '4svh', rotation: -6 }, { x: '0vw', y: '-3svh', rotation: 2 }, { x: '36vw', y: '6svh', rotation: 7 }];
      var kt = G.timeline({ scrollTrigger: { trigger: a1, start: 'top top', end: 'bottom bottom', scrub: S.scrub } });
      layers.forEach(function (ly, i) {
        kt.fromTo(ly, { x: 0, y: (i - 1) * 10, rotation: (i - 1) * 3, scale: 1 - (2 - i) * 0.06 },
          { x: spread[i].x, y: spread[i].y, rotation: spread[i].rotation, scale: 1, duration: 0.6, ease: 'power3.inOut' }, 0.05);
        kt.fromTo($('figcaption', ly), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.15 }, 0.5 + i * 0.06);
      });
      kt.to(layers, { y: '-=2svh', duration: 0.3, ease: 'none' }, 0.7);
    } else {
      /* hold floor (Aaron 20:27): narrow pins A1 too; the three parts come apart down the pinned stage while the lead holds */
      var nspread = [{ x: '-17vw', y: '1svh', rotation: -5 }, { x: '15vw', y: '12svh', rotation: 3 }, { x: '-5vw', y: '23svh', rotation: 6 }];
      var nk = G.timeline({ scrollTrigger: { trigger: a1, start: 'top top', end: 'bottom bottom', scrub: S.scrub } });
      layers.forEach(function (ly, i) {
        nk.fromTo(ly, { x: 0, y: i * 8, rotation: (i - 1) * 3, scale: 1 - (2 - i) * 0.06 },
          { x: nspread[i].x, y: nspread[i].y, rotation: nspread[i].rotation, scale: 1, duration: 0.6, ease: 'power3.inOut' }, 0.05);
        nk.fromTo($('figcaption', ly), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.15 }, 0.5 + i * 0.06);
      });
      nk.to(layers, { y: '-=2svh', duration: 0.3, ease: 'none' }, 0.7);
    }

    /* ---------- A2 · the numbers rise like dough: count up while the weight swells ---------- */
    $$('.stat__n', a2).forEach(function (n, i) {
      var to = +n.getAttribute('data-count'), p = { v: 0, w: 300 };
      var draw = function () { n.textContent = String(Math.round(p.v)); n.style.setProperty('font-variation-settings', '"wght" ' + Math.round(p.w)); };
      var t = G.timeline({ onUpdate: draw }).fromTo(p, { v: 0, w: 300 }, { v: to, w: 700, duration: 1.6, ease: 'power3.out', onUpdate: draw }, i * 0.15)
        .fromTo(n, { yPercent: 22, scaleY: 0.82, transformOrigin: '50% 100%' }, { yPercent: 0, scaleY: 1, duration: 1.2, ease: 'back.out(2)' }, i * 0.15);
      S.trig(t, { trigger: $('.stats', a2), start: 'top 80%' });
      cleanups.push(function () { n.textContent = String(to); n.style.removeProperty('font-variation-settings'); });
    });
    $$('.nb', a2).forEach(function (f, i) {
      G.fromTo(f, { y: i ? 110 : 50, scale: 1.06 }, { y: i ? -110 : -50, scale: 1, ease: 'none', scrollTrigger: { trigger: a2, start: 'top bottom', end: 'bottom top', scrub: S.scrub } });
    });

    /* ---------- AL · flip me over: tap or drag, it springs to a face ---------- */
    var front = $('.card__face--front'), ang = { a: 0 }, on = false;
    var paint = function () { G.set(front, { rotationY: ang.a }); G.set(back, { rotationY: ang.a + 180 }); };
    var goTo = function (deg, v) {
      G.to(ang, { a: deg, duration: 1.1, ease: 'elastic.out(' + (1 + Math.min(Math.abs(v || 0) / 2000, 0.6)).toFixed(2) + ',0.5)', overwrite: true, onUpdate: paint });
    };
    var settleTo = function (pressed) { on = pressed; setPressed(on); goTo(on ? 180 : 0); };
    var drag = null, moved = false;
    var down = function (e) { drag = { x: e.clientX, a: ang.a, t: performance.now() }; moved = false; G.killTweensOf(ang); };
    var move = function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      if (Math.abs(dx) > 6) moved = true;
      if (moved) { ang.a = drag.a + dx * 0.7; paint(); }
    };
    var up = function (e) {
      if (!drag) return;
      if (moved) {
        var v = (e.clientX - drag.x) / Math.max(16, performance.now() - drag.t) * 1000;
        var tgt = Math.round((ang.a + v * 0.08) / 180) * 180;
        on = (Math.abs(tgt / 180) % 2) === 1; setPressed(on);
        G.to(ang, { a: tgt, duration: 1.1, ease: 'elastic.out(1.2,0.5)', overwrite: true, onUpdate: paint });
      }
      drag = null;
    };
    var click = function (e) { if (moved) { e.preventDefault(); moved = false; return; } settleTo(!on); };
    flip.addEventListener('pointerdown', down); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    flip.addEventListener('click', click);
    paint();
    var hint = G.timeline().fromTo(ang, { a: -70 }, { a: 0, duration: 1.4, ease: 'elastic.out(1,0.45)', onUpdate: paint })
      .fromTo('.card', { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: 'power3.out' }, 0)
      .fromTo('.card__links li', { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }, 0.4);
    S.trig(hint, { trigger: al, start: 'top 65%' });
    /* hold floor (Aaron 20:27): wide pins AL; the photo inside the card front slowly settles across the pinned runway (clipped by its face,
       so nothing leaves its box) so the hold is never still */
    if (wide) G.fromTo('.card__face--front img', { scale: 1.22, xPercent: -4, yPercent: 5 }, { scale: 1, xPercent: 0, yPercent: 0, ease: 'none', scrollTrigger: { trigger: al, start: 'top top', end: 'bottom bottom', scrub: 0.4 } });
    G.utils.toArray('.sayhi__strip img').forEach(function (im, i) {
      G.fromTo(im, { scale: 1.3, yPercent: 8 + i * 4 }, { scale: 1.04, yPercent: 0, ease: 'none', scrollTrigger: { trigger: al, start: 'top bottom', end: 'bottom bottom', scrub: 0.4 } });
    });
    cleanups.push(function () {
      flip.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      flip.removeEventListener('click', click); G.set([front, back], { clearProps: 'transform' });
    });

    return function () { cleanups.forEach(function (f) { f(); }); };
  });
})();
