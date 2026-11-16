/* Sweet & Sour · home page courses (classic script).
   H Bread Rain → T0 survivor flight → S1 relight → T1 score slash → S2 bake → T2 loaf to collage →
   S3 velocity collage + crumb iris → T3 iris → S4 bag restack → T4 crust flood → L settle. */
(function () {
  'use strict';
  var S = window.__savor;
  if (!S) return;
  var d = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var FR = S.frames;

  var hero = $('#h'), s1 = $('#s1'), s2 = $('#s2'), s3 = $('#s3'), s4 = $('#s4'), land = $('#l');

  S.chapter('H', hero, { points: [0, 0.5, 1], hold: 0.5 });
  S.chapter('S1', s1, { points: [0, 0.17, 0.5, 0.83, 1], hold: 0.17 });
  S.chapter('S2', s2, { points: [0, 0.5, 1], hold: 0.5 });
  S.chapter('S3', s3, { points: [0, 0.5, 1], hold: 0.5 });
  S.chapter('S4', s4, { points: [0, 0.5, 1], hold: 0.5 });
  S.chapter('L', land, { points: [0, 0.5, 1], hold: 1 });

  /* A fixed-position clone that travels between two live rects, re-measured every frame. */
  function flyer(src, alt) {
    var el = document.createElement('img');
    el.className = 'flyer'; el.alt = alt || ''; el.setAttribute('aria-hidden', 'true');
    el.decoding = 'async'; el.src = src;
    document.body.appendChild(el);
    return {
      el: el,
      place: function (r) {
        el.style.setProperty('--fx', r.x.toFixed(1) + 'px');
        el.style.setProperty('--fy', r.y.toFixed(1) + 'px');
        el.style.setProperty('--fw', r.w.toFixed(1) + 'px');
        el.style.setProperty('--fh', r.h.toFixed(1) + 'px');
      },
      show: function (on) { el.classList.toggle('is-on', !!on); },
      kill: function () { el.remove(); }
    };
  }
  function rect(el) { var r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }
  function mix(a, b, t) { return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) }; }

  S.boot(function (G, c) {
    var leads = $$('[data-lead]');
    if (!G || c.reduce) { leads.forEach(function (l) { l.setAttribute('data-armed', ''); }); return; }
    var ST = window.ScrollTrigger, cleanups = [];
    var wide = !!c.wide, fine = !!c.fine;

    /* ---------- leads: line masks rise when each course arrives ---------- */
    leads.forEach(function (l) { S.lead(G, l, l, 'top 92%'); S.arm(l, l.closest('[data-chapter]') || l, 'top 85%'); });

    /* ---------- H · Bread Rain ---------- */
    var copy = $('.hero__copy'), cue = $('.scroll-cue');
    ST.create({
      trigger: hero, start: 'top top', end: 'bottom bottom', scrub: true,
      onUpdate: function (st) {
        if (S.rain) { S.rain.progress(st.progress); S.rain.kick(st.getVelocity()); }
      }
    });
    G.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: S.scrub } })
      .to(cue, { autoAlpha: 0, duration: 0.15 }, 0)
      .fromTo(copy, { y: 0, scale: 1 }, { y: wide ? -72 : -170, scale: 0.9, transformOrigin: '0% 50%', duration: 0.2, ease: 'none' }, 0)
      .fromTo('.hero__spot', { opacity: 1 }, { opacity: wide ? 0.68 : 0.3, duration: 0.2, ease: 'none' }, 0)
      .fromTo('.hero__room-img', { scale: 1, yPercent: 0 }, { scale: wide ? 1.22 : 1.5, yPercent: wide ? -4 : -16, duration: 1, ease: 'power1.out' }, 0)
      .fromTo('canvas.rain', { scale: 1 }, { scale: wide ? 1 : 1.26, duration: 0.22, ease: 'none' }, 0)
      .to('canvas.rain', { scale: 1, duration: 0.25, ease: 'power1.inOut' }, 0.32)
      .to(copy, { y: wide ? -90 : -200, autoAlpha: 0, duration: 0.3, ease: 'power1.in' }, 0.68);
    if (wide && fine) {
      var spot = $('.hero__spot'), px = { x: 62, y: 48 };
      var qx = G.quickTo(px, 'x', { duration: 0.9, ease: 'power3.out', onUpdate: function () { spot.style.setProperty('--sx', px.x.toFixed(1) + '%'); } });
      var qy = G.quickTo(px, 'y', { duration: 0.9, ease: 'power3.out', onUpdate: function () { spot.style.setProperty('--sy', px.y.toFixed(1) + '%'); } });
      var mv = function (e) { qx(e.clientX / window.innerWidth * 100); qy(e.clientY / window.innerHeight * 100); };
      hero.addEventListener('pointermove', mv);
      cleanups.push(function () { hero.removeEventListener('pointermove', mv); });
    }

    /* ---------- T0 · the survivor loaf flies from the rain onto the first plate (spring k 14, c 6) ---------- */
    var plate0 = $('.loaf[data-loaf="0"] .loaf__plate');
    var f0 = flyer(S.rain ? S.rain.survivorSrc() : 'media/rain/ig-007.webp');
    var TS = 2.4, sp = null, vel = { x: 0, y: 0, w: 0, h: 0 }, lastT = 0, t0Active = false;
    function t0Progress() {
      var hr = S.range(hero), a = hr.start + (hr.end - hr.start) * 0.62, b = S.range(s1).start;
      return clamp((window.scrollY - a) / Math.max(1, b - a), 0, 1);
    }
    function t0Tick(time) {
      var f = t0Progress();
      var from = S.rain ? S.rain.survivorRect() : rect(hero), to = rect(plate0);
      var e = f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2;
      var target = mix(from, to, e);
      var dt = lastT ? Math.min(0.05, time - lastT) : 0.016; lastT = time;
      if (!sp || FR) sp = { x: target.x, y: target.y, w: target.w, h: target.h };
      else ['x', 'y', 'w', 'h'].forEach(function (k) {
        var a = 14 * (target[k] - sp[k]) - 6 * vel[k];
        vel[k] += a * dt * TS; sp[k] += vel[k] * dt * TS;
      });
      var off = Math.abs(sp.x - target.x) + Math.abs(sp.y - target.y) + Math.abs(sp.w - target.w);
      var flying = (f > 0 && f < 1) || ((f >= 1 || f <= 0) && off > 1.5 && t0Active);
      if (f <= 0 && off <= 1.5) flying = false;
      t0Active = flying;
      if (S.rain) S.rain.release(f > 0 || flying);
      d.classList.toggle('t0-fly', flying || (f > 0 && f < 1));
      f0.show(flying);
      if (flying) f0.place(sp);
    }
    var tick0 = function (t) { t0Tick(t); };
    G.ticker.add(tick0);
    cleanups.push(function () { G.ticker.remove(tick0); f0.kill(); d.classList.remove('t0-fly'); if (S.rain) S.rain.release(false); });

    /* ---------- S1 · Scored by hand: a lamp sweeps each loaf, lit plate through a radial mask ---------- */
    var loaves = $$('.loaf', s1), names = $$('.scored__names li', s1), ptr = { x: 0, y: 0 }, lastP = 0, curIdx = -1;
    function relight(p) {
      lastP = p;
      var seg = clamp(p * 3, 0, 2.9999), idx = Math.floor(seg), lp = seg - idx;
      loaves.forEach(function (lf, i) {
        var a = i === idx ? 1 : 0;
        if (i === idx + 1 && lp > 0.82) a = (lp - 0.82) / 0.18;
        if (i === idx && lp > 0.82 && idx < 2) a = 1;
        G.set(lf, { autoAlpha: a, zIndex: i === idx ? 1 : 2 });
        var near = i === idx ? lp : i === idx + 1 ? 0 : 1;
        var lx = 18 + near * 64 + ptr.x * 14, ly = 30 + Math.sin(near * Math.PI) * 26 + ptr.y * 12;
        lf.style.setProperty('--lx', lx.toFixed(1) + '%');
        lf.style.setProperty('--ly', ly.toFixed(1) + '%');
        var g = lf.querySelector('.loaf__glow'); if (g) g.style.opacity = (0.4 + Math.sin(near * Math.PI) * 0.6).toFixed(2);
        var tf = 'scale(' + (1 + near * (wide ? 0.22 : 0.4)).toFixed(3) + ') translateX(' + (-near * (wide ? 8 : 14)).toFixed(2) + '%)';
        lf.querySelectorAll('.loaf__plate img').forEach(function (im) { im.style.transform = tf; });
      });
      if (idx !== curIdx) { curIdx = idx; names.forEach(function (n, i) { n.classList.toggle('is-on', i === idx); }); }
    }
    ST.create({ trigger: s1, start: 'top top', end: 'bottom bottom', onUpdate: function (st) { relight(st.progress); }, onRefresh: function (st) { relight(st.progress); } });
    relight(0);
    if (wide && fine) {
      var stg = $('.scored__stage', s1);
      var pm = function (e) { var r = stg.getBoundingClientRect(); G.to(ptr, { x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5, duration: 0.6, overwrite: true, onUpdate: function () { relight(lastP); } }); };
      stg.addEventListener('pointermove', pm);
      cleanups.push(function () { stg.removeEventListener('pointermove', pm); });
    }
    cleanups.push(function () { loaves.forEach(function (lf) { lf.removeAttribute('style'); ['.loaf__glow', '.loaf__plate'].forEach(function (s) { var x = lf.querySelector(s); if (x) x.removeAttribute('style'); }); lf.querySelectorAll('.loaf__plate img').forEach(function (im) { im.removeAttribute('style'); }); }); });

    /* ---------- T1 · the score slash: a hairline opens into the ear ---------- */
    var slash = $('.slash');
    if (slash) {
      G.timeline({ scrollTrigger: { trigger: slash, start: 'top bottom', end: 'bottom bottom', scrub: S.scrub } })
        .fromTo('.slash__path', { attr: { d: 'M0.08,0.52 C0.30,0.50 0.62,0.48 0.92,0.46 C0.62,0.48 0.30,0.50 0.08,0.52 Z' } },
          { attr: { d: 'M-0.35,0.62 C0.05,-0.55 0.85,-0.70 1.35,0.40 C0.95,1.65 0.10,1.70 -0.35,0.62 Z' }, ease: 'sine.inOut', duration: 1 }, 0);
      G.fromTo('.slash__img', { scale: 1.4, rotation: -6, yPercent: 6 }, { scale: 1.04, rotation: 0, yPercent: 0, ease: 'none', scrollTrigger: { trigger: slash, start: 'top 40%', end: 'bottom bottom', scrub: S.scrub } });
    }

    /* ---------- S2 · Starter to oven ---------- */
    $$('.step', s2).forEach(function (st) {
      var media = $('.step__media', st), img = $('.step__media > img:not(.bake__oven)', st), num = $('.step__num', st);
      var reveal = G.timeline().fromTo(media, { clipPath: 'inset(18% 10% 18% 10% round 4px)' }, { clipPath: 'inset(0% 0% 0% 0% round 4px)', duration: 0.9, ease: 'power3.out' })
        .fromTo($('.step__text', st), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: 'power2.out' }, 0.2);
      S.trig(reveal, { trigger: st, start: 'top 78%' });
      if (img) G.fromTo(img, { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: 'none', scrollTrigger: { trigger: st, start: 'top bottom', end: 'bottom top', scrub: S.scrub } });
      G.fromTo(num, { yPercent: 30, fontVariationSettings: '"wght" 300' }, { yPercent: -30, fontVariationSettings: '"wght" 640', ease: 'none', scrollTrigger: { trigger: st, start: 'top bottom', end: 'bottom top', scrub: S.scrub } });
    });
    var bake = $('.bake', s2);
    if (bake) {
      G.timeline({ scrollTrigger: { trigger: bake, start: 'top 80%', end: 'bottom 30%', scrub: S.scrub } })
        .to('.bake__oven', { opacity: 0.85, duration: 0.3, ease: 'power1.in' }, 0)
        .fromTo('.bake__hole', { attr: { r: 0 } }, { attr: { r: 1100 }, duration: 0.7, ease: 'power2.in' }, 0.18)
        .to('.bake__oven', { opacity: 0, duration: 0.35 }, 0.55)
        .fromTo('.bake__bloom', { opacity: 0 }, { opacity: 1, duration: 0.25 }, 0.45)
        .to('.bake__bloom', { opacity: 0, duration: 0.3 }, 0.75);
    }

    /* ---------- T2 · the baked loaf leaves the oven for its slot in the collage ---------- */
    var slot = $('.pc-15', s3), bakeImg = bake;
    if (slot && bakeImg) {
      var f2 = flyer('media/s2/ig-212.webp'), t2 = { t: 0 };
      var place2 = function () {
        var a = rect(bakeImg), b = rect(slot.querySelector('img'));
        var r = mix(a, b, t2.t); r.y -= Math.sin(t2.t * Math.PI) * 60; f2.place(r);
      };
      var tw2 = G.to(t2, { t: 1, duration: 0.8, ease: 'power3.inOut', paused: true,
        onStart: function () { d.classList.add('t2-fly'); f2.show(true); },
        onUpdate: place2,
        onComplete: function () { f2.show(false); d.classList.remove('t2-fly'); },
        onReverseComplete: function () { f2.show(false); d.classList.remove('t2-fly'); } });
      ST.create({ trigger: s3, start: 'top 45%',
        onEnter: function () { if (FR) { tw2.progress(1); return; } d.classList.add('t2-fly'); f2.show(true); place2(); tw2.play(); },
        onLeaveBack: function () { if (FR) { tw2.progress(0); return; } d.classList.add('t2-fly'); f2.show(true); place2(); tw2.reverse(); } });
      cleanups.push(function () { tw2.kill(); f2.kill(); d.classList.remove('t2-fly'); });
    }

    /* ---------- S3 · So many flavours: depth parallax, scroll speed spreads the planes ---------- */
    var collage = $('.collage', s3), pieces = $$('.piece', collage);
    pieces.forEach(function (pc) {
      var z = +pc.getAttribute('data-depth') || 0;
      G.fromTo(pc, { yPercent: (0.5 - z) * 30 }, { yPercent: (z - 0.5) * 30, ease: 'none', scrollTrigger: { trigger: collage, start: 'top bottom', end: 'bottom top', scrub: S.scrub } });
    });
    $$('.collage__word', collage).forEach(function (w, i) {
      G.fromTo(w, { x: 0, xPercent: i % 2 ? -42 : -58 }, { x: 0, xPercent: i % 2 ? -58 : -42, ease: 'none', scrollTrigger: { trigger: collage, start: 'top bottom', end: 'bottom top', scrub: S.scrub } });
    });
    if (wide) {
      var spread = { v: 0 }, setters = pieces.map(function (pc) {
        var z = +pc.getAttribute('data-depth') || 0, r = pc.getBoundingClientRect(), cr = collage.getBoundingClientRect();
        var dir = ((r.left + r.width / 2) - (cr.left + cr.width / 2)) / cr.width;
        return { s: G.quickSetter(pc, 'scale'), x: G.quickSetter(pc, 'x', 'px'), z: z, dir: dir };
      });
      var qs = G.quickTo(spread, 'v', { duration: 0.6, ease: 'power3.out', onUpdate: function () {
        setters.forEach(function (o) { o.s(1 + spread.v * (0.5 - o.z) * 0.16); o.x(o.dir * spread.v * (1 - o.z) * 140); });
      } });
      ST.create({ trigger: collage, start: 'top bottom', end: 'bottom top', onUpdate: function (st) { qs(clamp(Math.abs(st.getVelocity()) / 2600, 0, 1)); } });
      var idle = function () { if (spread.v > 0.001) qs(0); };
      var iv = setInterval(idle, 180);
      cleanups.push(function () { clearInterval(iv); });
    }
    var menuItems = $$('.flavour', s3);
    S.trig(G.timeline().fromTo(menuItems, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.05, ease: 'power2.out' }), { trigger: $('.menu', s3) || s3, start: 'top 80%' });

    /* crumb surprise: the iris opens on the crumb, holds, then closes into the next course (T3 out) */
    var crumb = $('.crumb', s3);
    if (crumb) {
      G.timeline({ scrollTrigger: { trigger: crumb, start: 'top top', end: 'bottom bottom', scrub: S.scrub } })
        .fromTo('.iris-out', { attr: { rx: 0.08, ry: 0.1 } }, { attr: { rx: 0.75, ry: 0.75 }, duration: 0.22, ease: 'power2.out' }, 0)
        .fromTo('.crumb__img', { scale: 1.3 }, { scale: 1.04, duration: 1, ease: 'none' }, 0)
        .fromTo('.crumb__line .line__in', { yPercent: 105 }, { yPercent: 0, duration: 0.12, ease: 'power3.out' }, 0.16)
        .to('.crumb__line', { letterSpacing: '0.02em', duration: 0.5, ease: 'none' }, 0.2)
        .to('.crumb__line .line__in', { yPercent: -105, duration: 0.1, ease: 'power2.in' }, 0.8)
        .to('.iris-out', { attr: { rx: 0.0, ry: 0.0 }, duration: 0.18, ease: 'power2.in' }, 0.82);
    }

    /* ---------- S4 · How to get one: steps fill the rail, the bags restack (interruptible) ---------- */
    var bags = $$('.bag', s4), bagsBox = $('.bags', s4), osteps = $$('.ostep', s4), order = [0, 1, 2], rank = 0;
    function slotOf(r) {
      var w = bagsBox.offsetWidth, h = bagsBox.offsetHeight;
      return [{ x: 0, y: 0, rotation: 0 }, { x: w * 0.05, y: h * 0.03, rotation: 4 }, { x: -w * 0.05, y: h * 0.05, rotation: -5 }][r];
    }
    function layoutBags(instant) {
      order.forEach(function (bi, r) {
        var b = bags[bi], s = slotOf(r);
        b.style.zIndex = String(3 - r);
        if (instant || FR) G.set(b, s);
      });
    }
    function restack(front) {
      var prev = order[0];
      order = [front, (front + 1) % 3, (front + 2) % 3];
      layoutBags(false);
      if (FR) { layoutBags(true); return; }
      order.forEach(function (bi, r) {
        var b = bags[bi], s = slotOf(r);
        G.killTweensOf(b);
        if (bi === prev && r !== 0) {
          G.to(b, { keyframes: [
            { x: bagsBox.offsetWidth * 0.62, y: -bagsBox.offsetHeight * 0.05, rotation: 12, duration: 1.3, ease: 'sine.inOut' },
            { x: s.x, y: s.y, rotation: s.rotation, duration: 0.9, ease: 'sine.inOut' }] });
        } else {
          G.to(b, { x: s.x, y: s.y, rotation: s.rotation, duration: 0.8, ease: 'sine.inOut' });
        }
      });
    }
    G.set(bags, { clearProps: 'transform' });
    layoutBags(true);
    function stepOn(i) { osteps.forEach(function (o, k) { o.classList.toggle('is-on', k === i); }); }
    if (wide) {
      ST.create({ trigger: s4, start: 'top top', end: 'bottom bottom',
        onUpdate: function (st) { var i = st.progress < 0.3 ? 0 : st.progress < 0.62 ? 1 : 2; if (i !== rank) { rank = i; restack(i); stepOn(i); } } });
      G.fromTo('.howto__rail-fill', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: s4, start: 'top top', end: 'bottom bottom', scrub: S.scrub } });
      /* continuous drift under the restack so the pinned stage never goes still */
      G.fromTo($$('.bag img', s4), { scale: 1.04, yPercent: -9 }, { scale: 1.4, yPercent: 9, ease: 'none', scrollTrigger: { trigger: s4, start: 'top top', end: 'bottom bottom', scrub: S.scrub } });
      G.fromTo($('.howto__text', s4), { y: '4vh' }, { y: '-4vh', ease: 'none', scrollTrigger: { trigger: s4, start: 'top top', end: 'bottom bottom', scrub: S.scrub } });
      G.fromTo(bagsBox, { y: '9vh', rotation: -3 }, { y: '-9vh', rotation: 3, ease: 'none', scrollTrigger: { trigger: s4, start: 'top top', end: 'bottom bottom', scrub: S.scrub } });
    } else {
      G.fromTo('.howto__rail-fill', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: $('.ostep-list', s4), start: 'top 75%', end: 'bottom 45%', scrub: S.scrub } });
      osteps.forEach(function (o, k) { ST.create({ trigger: o, start: 'top 70%', end: 'bottom 40%', onToggle: function (st) { if (st.isActive) stepOn(k); } }); });
      var nb = $('.bags__next', s4);
      if (nb) { var nx = function () { rank = (rank + 1) % 3; restack(rank); }; nb.addEventListener('click', nx); cleanups.push(function () { nb.removeEventListener('click', nx); }); }
    }
    stepOn(0);
    var irisTl = G.timeline({ onComplete: function () { bagsBox.classList.add('is-open'); }, onReverseComplete: function () { bagsBox.classList.remove('is-open'); } })
      .fromTo('.iris-in', { attr: { rx: 0.04, ry: 0.04 } }, { attr: { rx: 0.75, ry: 0.75 }, duration: 0.9, ease: 'power3.out' });
    S.trig(irisTl, { trigger: $('.howto__stage', s4), start: wide ? 'top 85%' : 'top 80%',
      onLeaveBack: function () { bagsBox.classList.remove('is-open'); }, onEnter: function () { if (FR) bagsBox.classList.add('is-open'); } });
    cleanups.push(function () { bags.forEach(function (b) { b.removeAttribute('style'); }); bagsBox.classList.remove('is-open'); });

    /* ---------- T4 · a crust flood rises from the bottom edge, covers, then recedes ---------- */
    var flood = $('.flood');
    if (flood) {
      G.timeline({ scrollTrigger: { trigger: flood, start: 'top bottom', end: 'bottom bottom', scrub: S.scrub } })
        .fromTo('.flood__path', { attr: { d: 'M0,100 C20,100 30,100 50,100 C70,100 80,100 100,100 L100,100 L0,100 Z' } },
          { attr: { d: 'M0,46 C20,22 30,60 50,38 C70,16 80,48 100,30 L100,100 L0,100 Z' }, duration: 0.45, ease: 'power1.in' })
        .to('.flood__path', { attr: { d: 'M0,0 C20,0 30,0 50,0 C70,0 80,0 100,0 L100,100 L0,100 Z' }, duration: 0.1, ease: 'power1.out' })
        .to('.flood__path', { attr: { d: 'M0,0 C20,0 30,0 50,0 C70,0 80,0 100,0 L100,0 L0,0 Z' }, duration: 0.45, ease: 'power2.in' });
    }

    /* ---------- L · Come say hi: the feed drops in and settles ---------- */
    var tiles = $$('.tile', land);
    var settle = G.timeline().fromTo(tiles, { y: function (i) { return -160 - (i % 3) * 40; }, rotation: function (i) { return (i % 2 ? 1 : -1) * (4 + (i % 3) * 2); }, autoAlpha: 0 },
      { y: 0, rotation: 0, autoAlpha: 1, duration: 1.1, ease: 'back.out(1.5)', stagger: 0.06 });
    S.trig(settle, { trigger: land, start: 'top 60%' });
    if (wide) G.fromTo('.feed__row', { x: '3vw' }, { x: '-3vw', ease: 'none', scrollTrigger: { trigger: land, start: 'top bottom', end: 'bottom top', scrub: S.scrub } });

    return function () { cleanups.forEach(function (f) { f(); }); };
  });
})();
