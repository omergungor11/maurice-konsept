(function() {
  "use strict";
  var q = location.search;
  if (/[?&]bubbles=0/.test(q)) return;
  var force = /[?&]bubbles=1/.test(q);
  if (!force && !matchMedia("(hover:hover) and (pointer:fine)").matches) return;
  if (!force && matchMedia("(prefers-reduced-motion:reduce)").matches) return;
  var cv = document.createElement("canvas");
  cv.className = "bubbles";
  cv.setAttribute("aria-hidden", "true");
  var host = document.getElementById("menu") || document.body;
  cv.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:" + (host === document.body ? 32 : 1);
  host.appendChild(cv);
  var g = cv.getContext("2d"), W = 0, H = 0, dpr = 1;
  var wipe = window.mmPerf && mmPerf.dirty ? mmPerf.dirty(g) : function() {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, cv.width, cv.height);
  };
  function PL() {
    return window.mmPerf && window.mmPerf.level || 0;
  }
  addEventListener("mmperf", function() {
    size();
  });
  function size() {
    dpr = Math.min(devicePixelRatio || 1, PL() >= 1 ? 1 : 2);
    W = innerWidth;
    H = innerHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
  }
  size();
  addEventListener("resize", size);
  var voidEl = document.querySelector(".egg__void"), subEl = document.querySelector(".hero__sub");
  var dir = (document.getElementById("deep") || {
    dataset: {}
  }).dataset.dir || "assets/deep/";
  function sheet(name) {
    var im = new Image;
    im.onload = function() {
      im.n = Math.round(im.naturalWidth / im.naturalHeight);
      var c = document.createElement("canvas");
      c.width = im.naturalWidth;
      c.height = im.naturalHeight;
      var x = c.getContext("2d");
      if ("filter" in x) {
        x.filter = "blur(2.5px)";
        x.drawImage(im, 0, 0);
        im.soft = c;
      } else im.soft = im;
    };
    im.src = dir + name + "?v=" + ART;
    return im;
  }
  var ART = "5";
  var LIGHT = sheet("bubbles_light.webp"), DARK = sheet("bubbles_dark.webp");
  function rnd(a, b) {
    return a + Math.random() * (b - a);
  }
  function oceanSize(lo, hi, k) {
    return lo + (hi - lo) * Math.pow(Math.random(), k);
  }
  var MODES = {
    tease: {
      gap: [ 900, 2e3 ],
      n: [ 3, 8 ],
      lo: 3,
      hi: 34,
      k: 2.4,
      rise: [ 60, 240 ],
      a: 1
    },
    trail: {
      gap: [ 3500, 7e3 ],
      n: [ 1, 4 ],
      lo: 2.5,
      hi: 16,
      k: 3,
      rise: [ 50, 170 ],
      a: .8
    },
    deep: {
      gap: [ 1100, 2300 ],
      n: [ 4, 9 ],
      lo: 2.5,
      hi: 16,
      k: 2.6,
      rise: [ 150, 480 ],
      a: .6
    },
    sink: {
      gap: [ 650, 1300 ],
      n: [ 4, 9 ],
      lo: 3,
      hi: 32,
      k: 2.3,
      rise: [ 170, 560 ],
      a: .95
    }
  };
  var fadeEl = document.querySelector(".egg__fade");
  function mix(a, b, t) {
    var o = {};
    for (var k in a) o[k] = typeof a[k] === "number" ? a[k] + (b[k] - a[k]) * t : [ a[k][0] + (b[k][0] - a[k][0]) * t, a[k][1] + (b[k][1] - a[k][1]) * t ];
    return o;
  }
  function sunk() {
    if (!fadeEl) return 0;
    var r = fadeEl.getBoundingClientRect();
    return Math.max(0, Math.min(1, (H - r.top) / Math.max(1, r.height)));
  }
  function dissolving() {
    if (!fadeEl || !voidEl) return false;
    return fadeEl.getBoundingClientRect().top < H && voidEl.getBoundingClientRect().top >= H;
  }
  function mode() {
    var vt = voidEl ? voidEl.getBoundingClientRect().top : 1e9;
    if (vt < H) return MODES.deep;
    var q = sunk();
    if (q > 0 && scrollY >= H * .35) return mix(MODES.trail, MODES.sink, .25 * Math.pow(q, 1.6));
    return scrollY < H * .35 ? MODES.tease : MODES.trail;
  }
  function SEEP() {
    return W / 2;
  }
  function LURE() {
    return !!document.querySelector("canvas.lure");
  }
  var vent = {
    t0: 0,
    acc: 0,
    gushUntil: 0,
    nextGush: 0,
    leadSurge: 0,
    nextLead: 0
  }, lead_acc = 0;
  function ventBubble(now, md) {
    var lu = LURE(), d = lu ? Math.random() < .12 ? rnd(11, 17) : oceanSize(3, 9, 2) : Math.random() < .09 ? rnd(15, 26) : oceanSize(2.5, 12, 2.1);
    var x = SEEP() + (lu ? rnd(-6, 6) : 0) + Math.sin(now / 1700) * 7 + Math.sin(now / 430) * 3 + rnd(-2.5, 2.5);
    var b = add(x, H + d * .55, d, md, {
      z: rnd(.45, 1),
      plume: true
    });
    b.vy = -rnd(150, 250) * (now < vent.gushUntil ? 1.25 : 1);
    b.vx = rnd(-22, 22);
    b.left = rnd(H * .3, H * .48) * (.85 + .25 * d / 26);
    b.a = md.a * (.75 + .25 * b.z);
  }
  var bubs = [], rings = [], nextBurst = performance.now() + 1e9, first = true, nextStray = performance.now() + 2500, last = 0, popped = 0;
  var m = {
    x: -1e4,
    y: -1e4,
    vx: 0,
    vy: 0,
    t: 0
  }, lastScroll = scrollY, sv = 0, stir = 0, idle = false;
  var T = function(n) {
    if (window.mmTrack) window.mmTrack(n);
  };
  addEventListener("mousemove", function(e) {
    var now = performance.now(), dt = Math.max(8, now - m.t);
    if (m.t) {
      m.vx = m.vx * .5 + (e.clientX - m.x) / dt * 1e3 * .5;
      m.vy = m.vy * .5 + (e.clientY - m.y) / dt * 1e3 * .5;
    }
    m.x = e.clientX;
    m.y = e.clientY;
    m.t = now;
  }, {
    passive: true
  });
  function add(x, y, d, md, extra) {
    var z = Math.random();
    var size = d * (.6 + .4 * z);
    var b = {
      x: x,
      y: y,
      d: size,
      z: z,
      vx: 0,
      vy: 0,
      ph: Math.random() * 6.3,
      rise: (18 + size * 2.6) * rnd(.8, 1.2),
      wob: size > 6 ? Math.min(1, (size - 6) / 22) : 0,
      kick: 0,
      left: rnd(md.rise[0], md.rise[1]) * (.7 + .6 * z),
      a: md.a * (.55 + .45 * z),
      born: performance.now(),
      cell: null
    };
    if (extra) for (var k in extra) b[k] = extra[k];
    if (PL() >= 2 && bubs.length > 45) bubs.shift();
    bubs.push(b);
    return b;
  }
  function spread() {
    var p = Math.max(0, Math.min(1, scrollY / Math.max(1, document.documentElement.scrollHeight - H)));
    return Math.max(110 + (W * .42 - 110) * Math.pow(p, .8), 110 + (W * .5 - 110) * Math.pow(sunk(), 1.4));
  }
  function burst(now, md, n, gulp) {
    var sp = spread(), x = SEEP() + rnd(-1, 1) * sp * .75;
    if (gulp) {
      x = W / 2 + rnd(-30, 30);
      var ds = [ rnd(32, 42), rnd(24, 32), rnd(18, 24) ];
      if (Math.random() < .7) ds.push(rnd(14, 20));
      n = Math.max(n, 30);
      for (var k = ds.length; k < n; k++) ds.push(oceanSize(2.5, 12, 2.2));
      ds.sort(function(p, q) {
        return q - p;
      });
      for (var i = 0; i < ds.length; i++) {
        var d = ds[i], big = i < ds.length * .15;
        var ang = rnd(-1, 1) * (big ? .22 : .56), sp = (big ? 1 : 1.25) * rnd(.8, 1.2);
        var g1 = add(x + rnd(-1, 1) * (6 + d * .3), H + d * .55, d, md, {
          z: big ? rnd(.7, 1) : rnd(.3, 1),
          plume: true
        });
        g1.born = now + rnd(0, big ? 80 : 240);
        g1.left = rnd(H * .36, H * .52) * (.8 + .3 * d / 42);
        var V = rnd(230, 330) * (big ? 1.1 : 1);
        g1.vy = -V * Math.cos(ang);
        g1.vx = V * Math.sin(ang);
        g1.kick = big ? .6 : 0;
        g1.a = md.a * (.78 + .22 * g1.z);
      }
      return;
    }
    for (var j = 0; j < n; j++) {
      var dd = oceanSize(md.lo, md.hi, md.k);
      add(x + rnd(-1, 1) * (6 + dd * .3 + sp * .12), H + dd + j * rnd(6, 22), dd, md);
    }
  }
  function pop(b) {
    rings.push({
      x: b.x,
      y: b.y,
      d: b.d,
      t: performance.now(),
      dark: b.dark,
      z: b.z,
      cell: b.cell,
      a: b.a * (b.cf == null ? 1 : b.cf)
    });
    if (b.d > 7) {
      var md = mode(), n = Math.min(6, 2 + Math.floor(b.d / 7));
      for (var i = 0; i < n; i++) {
        var an = rnd(0, 6.28), sp = rnd(60, 160);
        add(b.x + Math.cos(an) * b.d * .3, b.y + Math.sin(an) * b.d * .3, rnd(2, 4), md, {
          vx: Math.cos(an) * sp,
          vy: Math.sin(an) * sp - 40,
          left: rnd(30, 90),
          z: b.z
        });
      }
    }
  }
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min((now - (last || now)) / 1e3, .05);
    last = now;
    if (document.hidden) return;
    var md = mode();
    var dy = scrollY - lastScroll;
    lastScroll = scrollY;
    sv += ((dt ? dy / dt : 0) - sv) * Math.min(1, dt * 10);
    stir += Math.abs(dy);
    var atTop = scrollY < H * .35;
    var hush = dissolving();
    if (atTop && LIGHT.n) {
      if (!vent.t0) {
        vent.t0 = now;
        vent.nextGush = now + rnd(2200, 3e3);
      }
      if (now > vent.nextGush) {
        vent.gushUntil = now + rnd(350, 750);
        vent.nextGush = now + rnd(1500, 3200);
      }
      var age = now - vent.t0, rate = now < vent.gushUntil ? 34 : age < 1600 ? 40 : age < 2600 ? 40 - 29 * (age - 1600) / 1e3 : 11;
      if (LURE()) rate = now < vent.gushUntil ? 15 : age < 1600 ? 18 : 6.8;
      vent.acc += rate * dt;
      while (vent.acc >= 1) {
        vent.acc -= 1;
        ventBubble(now, md);
      }
      first = false;
      nextBurst = now + rnd(md.gap[0], md.gap[1]);
    } else if (hush) nextBurst = Math.max(nextBurst, now + rnd(md.gap[0], md.gap[1])); else if (now > nextBurst) {
      burst(now, md, Math.round(rnd(md.n[0], md.n[1])));
      nextBurst = now + rnd(md.gap[0], md.gap[1]);
    }
    if (!atTop && fadeEl) {
      var ft = fadeEl.getBoundingClientRect().top, lx = (H * 1.25 - ft) / (H * 1.25);
      var lead = lx > 0 && lx < 1 ? Math.min(1, lx / .12, (1 - lx) / .25) : 0;
      if (lead > .02) {
        if (now > vent.nextLead) {
          vent.leadSurge = now;
          vent.nextLead = now + rnd(1400, 2600);
        }
        var surge = now - vent.leadSurge < 450;
        lead_acc += lead * (surge ? 22 : 9) * dt * (LURE() ? .35 : 1);
        while (lead_acc >= 1) {
          lead_acc -= 1;
          var ld = LURE() ? oceanSize(2.5, 8, 2) : Math.random() < .16 ? rnd(16, 26) : oceanSize(4, 15, 1.8);
          var lb = add(SEEP() + Math.sin(now / 1900) * 14 + rnd(-6, 6), H + ld * .55, ld, md, {
            z: rnd(.4, 1),
            plume: true
          });
          lb.vy = -rnd(130, 200);
          lb.vx = rnd(-16, 16);
          lb.left = rnd(H * .26, H * .46);
          lb.a = .85 + .15 * lb.z;
        }
      }
    }
    if (stir > 260) {
      stir = 0;
      if (!hush) burst(now, md, Math.round(rnd(1, 3)));
    }
    if (now > nextStray) {
      var sx = rnd(.08, .92) * W;
      if (Math.abs(sx - W / 2) > 120 && !hush) add(sx, H + 6, rnd(2.5, 6), md, {
        z: rnd(0, .3)
      });
      nextStray = now + rnd(1800, 4200) * (1 - .25 * sunk());
    }
    m.vx *= Math.pow(.02, dt);
    m.vy *= Math.pow(.02, dt);
    if (!bubs.length && !rings.length) {
      if (!idle) {
        wipe();
        idle = true;
        cv.style.visibility = "hidden";
      }
      return;
    }
    if (idle) cv.style.visibility = "";
    idle = false;
    var fr = fadeEl ? fadeEl.getBoundingClientRect() : null;
    var hot = document.querySelector(".item--cards:hover"), hr = hot ? hot.getBoundingClientRect() : null;
    function darkAt(y) {
      if (hr && y >= hr.top && y <= hr.bottom) return 1;
      if (!fr) return 0;
      var t = Math.max(0, Math.min(1, ((y - fr.top) / Math.max(1, fr.height) - .5) / .22));
      return t * t * (3 - 2 * t);
    }
    wipe();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var ms = Math.hypot(m.vx, m.vy);
    touch(dt);
    var ceil = -1e9;
    if (subEl && scrollY < H) {
      var sr = subEl.getBoundingClientRect(), so = +getComputedStyle(subEl).opacity;
      if (so > .05 && sr.bottom > 0 && sr.top < H) ceil = sr.bottom + 40;
    }
    for (var i = bubs.length - 1; i >= 0; i--) {
      var b = bubs[i], t = (now - b.born) / 1e3;
      if (t < 0) continue;
      b.y -= dy * (.35 + .5 * b.z);
      var tvx = Math.sin(t * (3.2 - b.wob * 1.4) + b.ph) * (6 + b.wob * 38), tvy = -b.rise * (.6 + .4 * b.z);
      var kx = b.plume ? .8 : 2.2, ky = b.plume ? .55 : 1.6;
      b.vx += (tvx - b.vx) * Math.min(1, dt * kx);
      b.vy += (tvy - b.vy) * Math.min(1, dt * ky);
      var ddx = b.x - m.x, ddy = b.y - m.y, dist = Math.hypot(ddx, ddy), R = 70 + b.d * 1.5;
      if (dist < R && ms > 60) {
        var f = (1 - dist / R) * Math.min(1, ms / 900) * dt * (1.1 - .4 * b.z);
        b.vx += m.vx * f * 1.6 + ddx / (dist || 1) * ms * f * .6;
        b.vy += m.vy * f * 1.6 + ddy / (dist || 1) * ms * f * .6;
      }
      var oy = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.left -= Math.max(0, oy - b.y);
      b.dk = darkAt(b.y);
      b.dark = b.dk > .5;
      if (dist < b.d * .55 + 2 && b.d > 4) {
        pop(b);
        bubs.splice(i, 1);
        if (!popped++) T("bubble_pop");
        continue;
      }
      var cf = Math.min(1, Math.max(0, (b.y - b.d / 2 - ceil) / 50));
      if (cf < .5) {
        b.left = 0;
        b.cf = cf;
      }
      if (b.left <= 0 || b.y < -60 || b.y > H + 160 || b.x < -60 || b.x > W + 60) {
        if (b.left <= 0 && b.d > 9 && b.y > 0 && b.y < H && !b.dark) pop(b);
        bubs.splice(i, 1);
        continue;
      }
      draw(b, Math.min(1, b.left / 30) * Math.min(1, t * 4) * cf, now);
    }
    for (var j = rings.length - 1; j >= 0; j--) {
      var r = rings[j], u = Math.max(0, (now - r.t) / 200);
      if (u > 1) {
        rings.splice(j, 1);
        continue;
      }
      var im = r.dark ? DARK : LIGHT, cs = im.naturalHeight, e = (1 - u) * (1 - u), k = 1 + .3 * u;
      if (im.n && r.cell != null) {
        g.globalAlpha = (r.a || 1) * e * .8;
        g.drawImage(im, r.cell % im.n * cs, 0, cs, cs, r.x - r.d * k / 2, r.y - r.d * k / 2, r.d * k, r.d * k);
      }
      g.globalAlpha = e * .12;
      g.strokeStyle = r.dark ? "rgba(205,225,245,1)" : "rgba(90,95,100,1)";
      g.lineWidth = .7;
      g.beginPath();
      g.arc(r.x, r.y, Math.max(.5, r.d / 2 * (1 + u * .6)), 0, 7);
      g.stroke();
    }
    g.globalAlpha = 1;
  }
  function touch(dt) {
    for (var i = 0; i < bubs.length; i++) {
      var a = bubs[i];
      if (a.dead || a.born > last) continue;
      for (var j = i + 1; j < bubs.length; j++) {
        var b = bubs[j];
        if (b.dead || b.born > last || Math.abs(a.z - b.z) > .35) continue;
        var dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy) || .01, rs = (a.d + b.d) / 2;
        if (dist < rs) {
          var rel = Math.hypot(b.vx - a.vx, b.vy - a.vy);
          if (!a.plume && !b.plume && a.d < 14 && b.d < 14 && rel < 90 && Math.random() < .5) {
            var va = a.d * a.d * a.d, vb = b.d * b.d * b.d, nd = Math.cbrt(va + vb), wa = va / (va + vb);
            a.x = a.x * wa + b.x * (1 - wa);
            a.y = a.y * wa + b.y * (1 - wa);
            a.vx = a.vx * wa + b.vx * (1 - wa);
            a.vy = a.vy * wa + b.vy * (1 - wa);
            a.d = nd;
            a.rise = (18 + nd * 2.6) * rnd(.9, 1.1);
            a.wob = nd > 6 ? Math.min(1, (nd - 6) / 22) : 0;
            a.kick = 1;
            a.left = Math.max(a.left, b.left);
            a.a = Math.max(a.a, b.a);
            b.dead = true;
          } else {
            var o = (rs - dist) / dist, wb = a.d / (a.d + b.d);
            a.x -= dx * o * (1 - wb);
            a.y -= dy * o * (1 - wb);
            b.x += dx * o * wb;
            b.y += dy * o * wb;
          }
        } else {
          var big = a.d > b.d ? a : b, sm = big === a ? b : a;
          if (sm.d < big.d * .5 && sm.y > big.y && sm.y - big.y < big.d * 4 && Math.abs(sm.x - big.x) < big.d * .6) {
            sm.vy -= 45 * dt;
          }
        }
      }
    }
    for (var k = bubs.length - 1; k >= 0; k--) if (bubs[k].dead) bubs.splice(k, 1);
  }
  function draw(b, fade, now) {
    b.kick *= Math.pow(.04, 1 / 60);
    var dk = b.dk == null ? b.dark ? 1 : 0 : b.dk;
    if (dk > 0 && dk < 1) {
      b.dark = false;
      drawOne(b, fade * (1 - dk), now);
      b.dark = true;
      drawOne(b, fade * dk, now);
      b.dark = dk > .5;
      return;
    }
    drawOne(b, fade, now);
  }
  function drawOne(b, fade, now) {
    var im = b.dark ? DARK : LIGHT;
    if (!im.n) return;
    if (b.cell == null) b.cell = Math.floor(Math.random() * im.n);
    var cs = im.naturalHeight, src = b.z < .3 && im.soft ? im.soft : im;
    var w = Math.sin(now * .011 + b.ph * 3) * .07 * b.wob + Math.sin(now * .03 + b.ph) * .14 * b.kick, squash = 1 + .12 * b.wob;
    var st = Math.min(.22, Math.abs(sv) / 4e3) * (.4 + .6 * b.z);
    var sx = squash * (1 + w) * (1 - st * .5), sy = 1 / squash * (1 - w) * (1 + st);
    var d = b.d;
    g.globalAlpha = b.a * fade;
    g.save();
    g.translate(b.x, b.y);
    if (b.wob) g.rotate(Math.max(-.25, Math.min(.25, b.vx / 400)));
    if (b.dark && d < 18) {
      var rr = d / 2;
      g.scale(sx, sy);
      g.globalAlpha = b.a * fade * (.28 + .012 * d) * (.5 + .5 * b.z);
      g.strokeStyle = "rgba(170,205,235,1)";
      g.lineWidth = Math.max(.55, d * .07);
      g.beginPath();
      g.arc(0, 0, Math.max(.6, rr - g.lineWidth / 2), 0, 7);
      g.stroke();
      if (d > 4) {
        g.globalAlpha = b.a * fade * .7 * (.5 + .5 * b.z);
        g.fillStyle = "rgba(225,240,250,1)";
        g.beginPath();
        g.arc(rr * .38, -rr * .4, Math.max(.45, d * .08), 0, 7);
        g.fill();
      }
    } else {
      if (b.dark) {
        g.globalAlpha = b.a * fade * .62;
        if (src === im.soft) src = im;
      }
      g.drawImage(src, b.cell % im.n * cs, 0, cs, cs, -d * sx / 2, -d * sy / 2, d * sx, d * sy);
    }
    g.restore();
  }
  requestAnimationFrame(frame);
})();
