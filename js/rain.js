/* Sweet & Sour · Bread Rain (hero). Classic script, works from file://.
   Real loaves fall through 12 depth planes (about 6 on phones) on one canvas over the lit room photo.
   Each bitmap is decoded just before it is first needed, sized to its drawn width, and closed when the
   collage course gets near, so the rain never holds memory the rest of the page needs. Pixels are never read back. */
(function () {
  'use strict';
  var ENABLE_RAIN_LIGHTBOX = false;

  var d = document.documentElement;
  var S = window.__savor || (window.__savor = { checks: {} });
  var stage = document.querySelector('.hero__stage');
  var canvas = stage && stage.querySelector('canvas.rain');
  var list = document.querySelectorAll('.rain-items li');
  var pauseBtn = document.querySelector('.rain-pause');
  if (!canvas || !list.length) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var FRAMES = /[?&]frames=1/.test(location.search);
  var ctx = canvas.getContext('2d', { alpha: true });
  var W = 0, H = 0, DPR = 1, narrow = false;
  var items = [], drops = [], survivor = null;
  var running = false, paused = false, visible = true, freed = false, released = false;
  var last = 0, clock = 0, progress = 0, rawP = 0, boost = 0, raf = 0, drawn = 0;

  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function rnd(seed) { var x = Math.sin(seed * 999.13) * 43758.5453; return x - Math.floor(x); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  for (var i = 0; i < list.length; i++) {
    var li = list[i];
    items.push({
      el: li, id: li.getAttribute('data-rain-id'), plane: +li.getAttribute('data-plane'),
      src: li.getAttribute('data-src'), full: li.getAttribute('data-full'), post: li.getAttribute('data-post'),
      postLabel: li.getAttribute('data-post-label'), alt: li.getAttribute('data-alt'),
      w: +li.getAttribute('data-w') || 1440, h: +li.getAttribute('data-h') || 960
    });
  }

  var MOBILE_PLANES = { 1: 1, 2: 1, 3: 1, 7: 1, 10: 1, 12: 1 };

  function layout() {
    var r = stage.getBoundingClientRect();
    narrow = window.innerWidth < 900;
    DPR = Math.min(window.devicePixelRatio || 1, narrow ? 1.5 : 1.75);
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    build();
  }

  function build() {
    var keep = drops.reduce(function (m, dr) { m[dr.item.id + dr.k] = dr; return m; }, {});
    drops = []; survivor = null;
    var k = 0;
    /* Thinned + spaced (Aaron 20:42): no still card any more. Every loaf falls; each one gets its own lane across the width
       (a coprime stride keeps same-plane loaves far apart) and loaves sharing a plane, and so a speed, are phased evenly
       down the fall so they never stack. ig-007 is a real falling drop that the hand-off catches as the T0 survivor. */
    var live = items.filter(function (it) { return !narrow || MOBILE_PLANES[it.plane]; });
    var N = live.length, stride = Math.max(1, Math.round(N * 0.382));
    while (N > 1 && gcd(stride, N) !== 1) stride++;
    var perPlane = {}, seenPlane = {};
    live.forEach(function (it) { perPlane[it.plane] = (perPlane[it.plane] || 0) + 1; });
    live.forEach(function (it, j) {
      var n = items.indexOf(it);
      var z = (it.plane - 1) / 11;
      var size = (narrow ? lerp(0.5, 0.2, z) : lerp(0.22, 0.075, z)) * W;
      var lane = (j * stride) % N, slot = seenPlane[it.plane] = (seenPlane[it.plane] || 0) + 1;
      var dr = {
        item: it, k: k++, z: z, w: size, h: size * it.h / it.w,
        x: ((lane + 0.5 + (rnd(n + 1) - 0.5) * 0.35) / N) * (W + size * 0.4) - size * 0.7,
        y0: ((slot - 0.5) / perPlane[it.plane] + (rnd(n + 7) - 0.5) * 0.12 + it.plane * 0.137) * (H + size * 1.4),
        speed: lerp(150, 26, z) * (H / 900),
        rot: (rnd(n + 3) - 0.5) * 0.5, spin: (rnd(n + 5) - 0.5) * 0.18,
        sway: rnd(n + 11) * 6.28, alpha: z > 0.45 ? lerp(1, 0.86, z) : 1,
        bmp: null, loading: false
      };
      var o = keep[it.id + dr.k]; if (o) { dr.bmp = o.bmp; dr.loading = o.loading; }
      if (it.id === 'ig-007' && !survivor) survivor = dr;
      drops.push(dr);
    });
    drops.sort(function (a, b) { return b.z - a.z; });
  }

  /* Just-in-time decode at the drawn size; the source Image is dropped as soon as the bitmap exists. */
  // Squircle corners baked once per decode (matches CSS --r-photo: min(60px,18%) wide, min(36px,16%) under 600px).
  // Superellipse |x|^4+|y|^4=1 per corner, the same curve as CSS corner-shape: squircle. The source bitmap is closed right after.
  function squirclePath(c, w, h, r) {
    var N = 10;
    c.beginPath();
    function corner(ccx, ccy, sx, sy, up) {
      for (var k = 0; k <= N; k++) {
        var a = (up ? k : N - k) / N * Math.PI / 2;
        c.lineTo(ccx + sx * r * Math.pow(Math.cos(a), 0.5), ccy + sy * r * Math.pow(Math.sin(a), 0.5));
      }
    }
    corner(w - r, h - r, 1, 1, true); corner(r, h - r, -1, 1, false); corner(r, r, -1, -1, true); corner(w - r, r, 1, -1, false);
    c.closePath();
  }
  function roundBake(b, cssW) {
    var cv = document.createElement('canvas'); cv.width = b.width; cv.height = b.height;
    var c = cv.getContext('2d'), scale = b.width / cssW;
    var r = Math.min((W >= 600 ? 60 : 36) * scale, (W >= 600 ? 0.18 : 0.16) * Math.min(b.width, b.height));
    squirclePath(c, b.width, b.height, r); c.clip(); c.drawImage(b, 0, 0); b.close();
    return createImageBitmap(cv).then(function (rb) { cv.width = 0; cv.height = 0; return rb; });
  }

  function want(dr) {
    if (dr.bmp || dr.loading || freed) return;
    dr.loading = true;
    var img = new Image();
    img.decoding = 'async';
    img.src = dr.item.src;
    var tw = Math.max(32, Math.round(dr.w * DPR * (dr === survivor ? 1.4 : 1.25)));
    img.decode().then(function () {
      if (freed || !window.createImageBitmap) { dr.bmp = freed ? null : img; dr.loading = false; return; }
      return createImageBitmap(img, { resizeWidth: Math.min(tw, img.naturalWidth), resizeQuality: 'medium' }).then(function (b) {
        img.src = '';
        if (freed) { b.close(); dr.loading = false; return; }
        return roundBake(b, dr.w).then(function (rb) {
          if (freed) { rb.close(); } else { dr.bmp = rb; }
          dr.loading = false;
        });
      });
    }).catch(function () { dr.loading = false; });
  }

  function free() {
    freed = true;
    drops.concat(survivor ? [survivor] : []).forEach(function (dr) {
      if (dr.bmp && dr.bmp.close) dr.bmp.close();
      dr.bmp = null; dr.loading = false;
    });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  function unfree() { if (freed) { freed = false; } }

  function frame(t) {
    raf = 0;
    if (!running) return;
    var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016; last = t;
    if (!paused && !FRAMES) clock += dt * (1 + boost);
    boost *= 0.92;
    draw();
    raf = requestAnimationFrame(frame);
  }

  function draw() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var time = FRAMES ? progress * 6 : clock;
    var dolly = progress;
    drawn = 0;
    for (var i = 0; i < drops.length; i++) {
      var dr = drops[i];
      var span = H + dr.h * 2;
      var y = ((dr.y0 + time * dr.speed + dolly * H * (0.35 + (1 - dr.z)) * 0.9) % span) - dr.h;
      var cx = W / 2, near = 1 - dr.z;
      var s = 1 + dolly * near * 0.7;
      var x = cx + (dr.x - cx) * (1 + dolly * near * 0.9) + Math.sin(time * 0.7 + dr.sway) * 10 * near;
      var w = dr.w * s, h = dr.h * s, rot = dr.rot + time * dr.spin + dolly * (dr.sway % 1 - 0.5) * 0.9;
      if (dr === survivor) {
        if (released) continue;
        var c = catchAmt();
        if (c > 0) {
          if (!dr.cap) dr.cap = { x: x, y: y, w: w, h: h, r: rot };
          var e = c * c * (3 - 2 * c), cr = catchRect(FRAMES ? 0 : Math.sin(clock * 0.9) * 6);
          x = lerp(dr.cap.x, cr.x, e); y = lerp(dr.cap.y, cr.y, e); w = lerp(dr.cap.w, cr.w, e); h = lerp(dr.cap.h, cr.h, e);
          rot = lerp(dr.cap.r % 6.283, Math.sin(time * 0.6) * 0.03, e);
          want(dr);
        } else dr.cap = null;
        dr.last = { x: x, y: y, w: w, h: h };
      }
      if (y > H || y + h < 0 || x > W || x + w < 0) continue;
      want(dr);
      if (!dr.bmp) continue;
      ctx.save();
      ctx.globalAlpha = dr === survivor ? 1 : dr.alpha * (1 - dolly * 0.2 * dr.z);
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(rot);
      ctx.drawImage(dr.bmp, -w / 2, -h / 2, w, h);
      ctx.restore();
      drawn++;
    }
  }

  /* the catch: late in the hero the survivor drop slows out of the rain into the hand-off spot T0 flies from */
  function catchAmt() { return Math.min(1, Math.max(0, (rawP - 0.42) / 0.18)); }
  function catchRect(bob) {
    var cw = narrow ? W * 0.5 : W * 0.24, ch = cw * survivor.item.h / survivor.item.w, lift = progress * H * 0.08;
    var cx = narrow ? W * 0.56 : W * 0.66, cy = narrow ? H * 0.3 : H * 0.4;
    return { x: cx - cw / 2, y: cy - ch / 2 + bob - lift, w: cw, h: ch };
  }
  function survLocal(bob) {
    if (catchAmt() >= 1 || !survivor.last) return catchRect(bob);
    return survivor.last;
  }

  function start() {
    if (running || reduce.matches) return;
    running = true; last = 0;
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  function sync() { if (visible && !document.hidden && !freed && !reduce.matches) start(); else stop(); }

  S.rain = {
    /* hero scroll progress 0..1 drives the camera dolly through the planes */
    progress: function (p) { rawP = Math.min(Math.max(p, 0), 1); progress = 1 - Math.pow(1 - rawP, 3); if (!running) draw(); },
    kick: function (v) { boost = Math.min(4, Math.max(boost, Math.abs(v) / 900)); },
    /* the survivor loaf's on-screen rect (viewport px), where T0 picks it up */
    survivorRect: function () {
      var r = stage.getBoundingClientRect(), bob = FRAMES ? 0 : Math.sin(clock * 0.9) * 6;
      if (!survivor) return { x: r.left + W * 0.6, y: r.top + H * 0.3, w: W * 0.3, h: W * 0.2 };
      var l = survLocal(bob);
      return { x: l.x + r.left, y: l.y + r.top, w: l.w, h: l.h };
    },
    survivorSrc: function () { return survivor ? survivor.item.src : ''; },
    release: function (on) { released = !!on; if (!running) draw(); },
    free: function () { if (!freed) { free(); stop(); } },
    resume: function () { if (freed) { unfree(); sync(); } },
    drawn: function () { return drawn; },
    loaded: function () { return drops.filter(function (x) { return x.bmp; }).length; }
  };
  S.checks = S.checks || {};
  S.checks.rain = function () {
    return !reduce.matches && !freed && canvas.width > 0 && drops.length >= (narrow ? 10 : 20) && (drawn > 0 || paused);
  };

  if (reduce.matches) { d.classList.remove('rain-on'); return; }
  d.classList.add('rain-on');

  layout();
  var rz = 0;
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(layout, 150); });
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; sync(); }, { rootMargin: '10% 0px' }).observe(stage);
    var s3 = document.getElementById('s3');
    if (s3) new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) S.rain.free(); else if (e[0].boundingClientRect.top > 0) S.rain.resume();
    }, { rootMargin: '0px 0px 120% 0px' }).observe(s3);
  }
  reduce.addEventListener && reduce.addEventListener('change', function () { if (reduce.matches) { stop(); d.classList.remove('rain-on'); } else { d.classList.add('rain-on'); sync(); } });

  if (pauseBtn) pauseBtn.addEventListener('click', function () {
    paused = !paused;
    pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
    pauseBtn.textContent = paused ? 'Play the rain' : 'Pause the rain';
  });

  sync();
  draw();

  /* Tap-a-loaf lightbox: ships switched off (ENABLE_RAIN_LIGHTBOX). When on, planes 1-5 are tappable,
     the tapped loaf pauses mid-fall, and the dialog shows the full photo with a link to its post. */
  var rainLightbox = {
    dialog: null, held: null,
    init: function (cv, its) {
      var self = this;
      this.dialog = document.querySelector('.rain-lightbox');
      if (!this.dialog) return;
      cv.addEventListener('click', function (e) {
        var r = cv.getBoundingClientRect(), hit = self.hitTest(e.clientX - r.left, e.clientY - r.top);
        if (hit) { self.pauseDrop(hit); self.open(hit.item); }
      });
      this.dialog.querySelector('.rain-lightbox__close').addEventListener('click', function () { self.close(); });
      this.dialog.addEventListener('close', function () { self.held = null; paused = false; });
      return its;
    },
    hitTest: function (x, y) {
      var time = clock;
      for (var i = drops.length - 1; i >= 0; i--) {
        var dr = drops[i];
        if (dr.item.plane > 5) continue;
        var span = H + dr.h * 2, near = 1 - dr.z, s = 1 + progress * near * 0.7;
        var yy = ((dr.y0 + time * dr.speed + progress * H * (0.35 + near) * 0.9) % span) - dr.h;
        var xx = W / 2 + (dr.x - W / 2) * (1 + progress * near * 0.9) + Math.sin(time * 0.7 + dr.sway) * 10 * near;
        if (x >= xx && x <= xx + dr.w * s && y >= yy && y <= yy + dr.h * s) return dr;
      }
      return null;
    },
    pauseDrop: function (dr) { this.held = dr; paused = true; },
    open: function (it) {
      var img = this.dialog.querySelector('img'), a = this.dialog.querySelector('.rain-lightbox__post');
      img.src = it.full; img.alt = it.alt || '';
      a.href = it.post; a.textContent = 'See it on ' + (it.postLabel || 'Instagram');
      if (this.dialog.showModal) this.dialog.showModal();
    },
    close: function () { if (this.dialog.open) this.dialog.close(); }
  };
  if (ENABLE_RAIN_LIGHTBOX) rainLightbox.init(canvas, items);
})();
