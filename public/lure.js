(function() {
  "use strict";
  var q = location.search;
  if (/[?&]lure=0/.test(q)) return;
  var force = /[?&]lure=1/.test(q);
  if (!force && !matchMedia("(hover:hover) and (pointer:fine)").matches) return;
  var still = matchMedia("(prefers-reduced-motion:reduce)").matches;
  var cv = document.createElement("canvas");
  cv.className = "lure";
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
  var DEEPV = "c43790de";
  var dir = (document.getElementById("deep") || {
    dataset: {}
  }).dataset.dir || "assets/deep/";
  var pic = new Image, ok = false;
  pic.onload = function() {
    ok = true;
  };
  pic.src = dir + "lure_note.webp?v=" + DEEPV;
  var caus = new Image, causOk = false;
  caus.onload = function() {
    causOk = true;
  };
  caus.src = dir + "caustic.webp?v=" + DEEPV;
  var NL = document.createElement("canvas"), nl = NL.getContext("2d"), CL = document.createElement("canvas"), cl = CL.getContext("2d"), causPat = null;
  var bubs = [];
  function bub(x, y, vx, vy, r, now, life) {
    bubs.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: r,
      t: now,
      life: life,
      ph: Math.random() * 6
    });
  }
  var HOOK = {
    x: .424,
    y: .963
  };
  var fadeEl = document.querySelector(".egg__fade"), deepEl = document.getElementById("deep");
  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function smooth(v) {
    v = clamp(v, 0, 1);
    return v * v * (3 - 2 * v);
  }
  function sunk() {
    if (!fadeEl) return 0;
    var r = fadeEl.getBoundingClientRect();
    return clamp((H * .8 - r.top) / Math.max(1, r.height * .7), 0, 1);
  }
  var n = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    rot: 0,
    vr: 0
  }, stir = 0, sv = 0, lastY = scrollY, last = 0, startle = 0, eaten = 0, freed = 0, rig = null, taut = 0, swing = 0, swPh = Math.random() * 6, yaw = 0, surge = {
    x: 0,
    v: 0,
    next: performance.now() + 2500
  };
  var m = {
    x: -1e4,
    y: -1e4,
    px: -1e4,
    py: -1e4,
    vx: 0,
    vy: 0,
    t: 0
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
  var T = function(k) {
    if (window.mmTrack) window.mmTrack(k);
  }, touched = false;
  var drag = {
    on: false,
    ox: 0,
    oy: 0,
    last: 0
  }, NOTE = {
    w: 0,
    h: 0
  };
  function onPaper(px, py) {
    var dx = px - n.x, dy = py - n.y, c = Math.cos(-n.rot), s = Math.sin(-n.rot), lx = dx * c - dy * s, ly = dx * s + dy * c;
    return Math.max(Math.abs(lx) / (NOTE.w * .5 + 10), Math.abs(ly) / (NOTE.h * .5 + 10));
  }
  addEventListener("mousedown", function(e) {
    if (e.button !== 0 || !NOTE.w || eaten) return;
    if (onPaper(e.clientX, e.clientY) < 1.15) {
      drag.on = true;
      drag.ox = (e.clientX - n.x) * .6;
      drag.oy = (e.clientY - n.y) * .6;
      e.preventDefault();
      document.documentElement.style.userSelect = "none";
      if (window.mmGloveGrip) mmGloveGrip(true);
      touched = true;
      T("lure_grabbed");
    }
  });
  function letGo() {
    if (drag.on) {
      drag.on = false;
      drag.last = performance.now();
      stir = 1;
      n.vx *= .3;
      n.vy *= .3;
      document.documentElement.style.userSelect = "";
      if (window.mmGloveGrip) mmGloveGrip(false);
    }
  }
  addEventListener("mouseup", letGo);
  addEventListener("blur", letGo);
  document.addEventListener("mouseleave", letGo);
  document.addEventListener("selectstart", function(e) {
    if (drag.on) e.preventDefault();
  });
  function noteSize() {
    var w = clamp(W * .072, 96, 128);
    return {
      w: w,
      h: w * (pic.naturalHeight / pic.naturalWidth || .47)
    };
  }
  var RISE_AT = performance.now() + 2e3, risen = still;
  function home(sz) {
    var y = H - sz.h * .5 - 92;
    if (!risen) y = H + sz.h * 1.2 + 70;
    return {
      x: W * .5 + (.5 - HOOK.x) * sz.w,
      y: y
    };
  }
  var wv = {
    amp: 0,
    ph: 0,
    bend: 0
  };
  function paperY(u, h) {
    return Math.sin(u * Math.PI * 1.7 - wv.ph) * wv.amp * (.3 + .7 * Math.abs(u - HOOK.x) * 2) + wv.bend * h * Math.pow(2 * (u - HOOK.x), 2);
  }
  var hk = new Image, hkOk = false;
  hk.onload = function() {
    hkOk = true;
  };
  hk.src = dir + "lure_hook.webp?v=" + DEEPV;
  var HK = {
    eye: {
      x: .144,
      y: .925
    },
    entry: {
      x: .15,
      y: .47
    },
    point: [ .66, .14, 1, .4 ]
  };
  function hookBox(ex, ey, w) {
    var hw = w * .19, hh = hw * (hk.naturalHeight / hk.naturalWidth || 2.26);
    return {
      x: ex - HK.entry.x * hw,
      y: ey - HK.entry.y * hh,
      w: hw,
      h: hh
    };
  }
  function hook(x, ex, ey, w, back) {
    if (!hkOk) return;
    var b = hookBox(ex, ey, w), iw = hk.naturalWidth, ih = hk.naturalHeight;
    if (back) x.drawImage(hk, b.x, b.y, b.w, b.h); else {
      var P = HK.point;
      x.drawImage(hk, P[0] * iw, P[1] * ih, (P[2] - P[0]) * iw, (P[3] - P[1]) * ih, b.x + P[0] * b.w, b.y + P[1] * b.h, (P[2] - P[0]) * b.w, (P[3] - P[1]) * b.h);
    }
  }
  function mono(x, dark, tt) {
    x.lineWidth = 1.7;
    x.strokeStyle = dark > .5 ? "rgba(0,0,0," + (.22 + .1 * tt) + ")" : "rgba(36,44,48," + (.2 + .12 * tt) + ")";
    x.stroke();
    x.lineWidth = .8;
    x.strokeStyle = dark > .5 ? "rgba(190,225,240," + (.36 + .25 * tt) + ")" : "rgba(255,255,255," + (.7 + .3 * tt) + ")";
    x.stroke();
  }
  function glint(x, bx, by, dark) {
    var gg = x.createRadialGradient(bx, by, 0, bx, by, 7);
    gg.addColorStop(0, "rgba(255,255,255," + (.8 - .4 * dark) + ")");
    gg.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = gg;
    x.fillRect(bx - 7, by - 7, 14, 14);
  }
  function drawRope(x, ox, oy) {
    var R = rig, X = R.x, Y = R.y, nn = R.n, Hd = R.Hd, i;
    x.save();
    x.translate(ox, oy);
    var mEnd = nn;
    for (i = 1; i < nn; i++) {
      if (Y[i] > Hd + 30 && Y[i - 1] > Hd + 30) {
        mEnd = i;
        break;
      }
    }
    x.beginPath();
    x.moveTo(X[0], Y[0]);
    for (i = 1; i < mEnd - 1; i++) x.quadraticCurveTo(X[i], Y[i], (X[i] + X[i + 1]) * .5, (Y[i] + Y[i + 1]) * .5);
    x.lineTo(X[mEnd - 1], Y[mEnd - 1]);
    mono(x, 1, R.tt);
    if (R.gp < 1 && !still) {
      var gi = R.gp * R.nV, g0 = Math.floor(gi), gf = gi - g0;
      if (g0 < nn - 1) glint(x, X[g0] + (X[g0 + 1] - X[g0]) * gf, Y[g0] + (Y[g0 + 1] - Y[g0]) * gf, 1);
    }
    if (hkOk) {
      var HB = R.hb, P = HK.point, iw = hk.naturalWidth, ih = hk.naturalHeight;
      x.globalAlpha = .58;
      x.translate(X[0], Y[0]);
      x.rotate(R.ang);
      x.translate(-R.lx * R.yk, -R.ly);
      x.scale(R.yk, 1);
      x.drawImage(hk, HB.x, HB.y, HB.w, HB.h);
      x.drawImage(hk, P[0] * iw, P[1] * ih, (P[2] - P[0]) * iw, (P[3] - P[1]) * ih, HB.x + P[0] * HB.w, HB.y + P[1] * HB.h, (P[2] - P[0]) * HB.w, (P[3] - P[1]) * HB.h);
    }
    x.restore();
  }
  window.mmRigDraw = function(x, now) {
    var R = rig;
    if (!freed || !R || !R.n || R.gone) return;
    R.fishDrewAt = now;
    if (R.lureDrewAt === now) return;
    drawRope(x, 0, 0);
  };
  if (force) window.mmLureDebug = {
    n: n,
    m: m,
    drag: drag,
    get rig() {
      return rig;
    },
    get freed() {
      return freed;
    },
    get eaten() {
      return eaten;
    }
  };
  var done = false;
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min((now - (last || now)) / 1e3, .05);
    last = now;
    if (document.hidden || !ok) return;
    if (eaten && now - eaten > 320 && (!rig || rig.gone)) {
      if (!done) {
        done = true;
        wipe();
        cv.style.visibility = "hidden";
      }
      return;
    }
    var dy = scrollY - lastY;
    lastY = scrollY;
    sv += ((dt ? clamp(dy / dt, -3e3, 3e3) : 0) - sv) * Math.min(1, dt * 12);
    if (now - m.t > 60) {
      var mk = Math.pow(.01, dt);
      m.vx *= mk;
      m.vy *= mk;
    }
    if (!risen && (now > RISE_AT || scrollY > 40)) {
      risen = true;
      T("lure_rose");
    }
    var sz = noteSize(), h0 = home(sz), s = sunk(), t = still ? 0 : now / 1e3;
    NOTE.w = sz.w;
    NOTE.h = sz.h;
    var A = window.mmAngler, dr = deepEl ? deepEl.getBoundingClientRect() : null;
    var inDeep = A && A.ok && dr && dr.top < H * .45 && dr.bottom > H * .4;
    if (!freed && !eaten && A && A.ok && dr && dr.top < H * .5 && !drag.on) {
      var sd = Math.random() < .5 ? -1 : 1;
      freed = now + 1;
      rig = {
        x: 0,
        y: 0,
        sd: sd
      };
      n.vy -= 95;
      n.vx += sd * 22;
      n.vr += sd * 1.4;
      stir = 1;
      T("lure_freed");
      for (var bq = 0; bq < 8; bq++) bub(n.x + (Math.random() - .5) * sz.w * .4, n.y + sz.h * .4, (Math.random() - .5) * 40, -40 - Math.random() * 50, .8 + Math.random() * 2, now, 700 + Math.random() * 800);
    }
    if (freed && !eaten) {
      if (now > freed) n.y -= dy;
      if (dr) {
        var top = dr.top + dr.height * .18, bot = dr.top + dr.height * .62;
        if (n.y < top) {
          n.y = top;
          n.vy = Math.abs(n.vy) * .3;
        }
        if (n.y > bot) {
          n.y = bot;
          n.vy = -Math.abs(n.vy) * .3;
        }
      }
    }
    var tx, ty, ax, ay;
    swing = Math.min(46, swing + Math.abs(n.vy) * dt * .09) * Math.pow(.55, dt);
    if (now > surge.next) {
      surge.v = (Math.random() < .5 ? -1 : 1) * (10 + Math.random() * 16);
      surge.next = now + 3500 + Math.random() * 4500;
    }
    surge.x += surge.v * dt;
    surge.v *= Math.pow(.35, dt);
    surge.x *= Math.pow(.7, dt);
    var cx = Math.sin(t * .7) * 16 + Math.sin(t * .29 + 2) * 9 + Math.sin(t * 1.25 + swPh) * swing + surge.x;
    var cy = Math.sin(t * 1.1 + 1) * 2 + Math.sin(t * .5) * 1.5 + cx * cx * .012;
    yaw += (Math.sin(t * .31 + swPh) * .5 + Math.sin(t * .13) * .25 + clamp(n.vx * .0015, -.4, .4) - yaw) * Math.min(1, dt * 1.5);
    ax = W * .5 + Math.sin(t * .25) * 4;
    ay = risen ? H + 40 : h0.y + sz.h + 120;
    if (freed) {
      tx = n.x;
      ty = n.y + 12;
    } else {
      tx = h0.x + cx;
      ty = h0.y + cy;
    }
    if (!n.x) {
      n.x = tx;
      n.y = ty;
    }
    if (freed && !eaten) {
      var FN = window.mmFreeNote || (window.mmFreeNote = {});
      FN.live = true;
      FN.sx = n.x;
      FN.sy = n.y;
      FN.w = sz.w;
      if (FN.dead) {
        eaten = now;
        n.vr += (A && A.dir || 1) * 4;
        T("lure_eaten");
        letGo();
      }
    }
    if (still) {
      n.x = tx;
      n.y = ty;
      n.vx = n.vy = 0;
    }
    var dx = n.x - m.x, dyh = n.y - m.y, d = Math.hypot(dx, dyh) || 1, canR = !(freed || eaten || drag.on || now - drag.last < 900 || still);
    var near = canR ? onPaper(m.x, m.y) : 9, sweep = near;
    if (canR && near > 1 && m.px > -1e3) {
      for (var sk = 1; sk < 4; sk++) {
        var f = sk / 4;
        sweep = Math.min(sweep, onPaper(m.px + (m.x - m.px) * f, m.py + (m.y - m.py) * f));
      }
    }
    var toward = (m.vx * dx + m.vy * dyh) / d;
    var hs = Math.hypot(m.vx, m.vy);
    if (canR && hs > 40) {
      var reach = clamp(1 - (sweep - .6) / 1.6, 0, 1);
      if (reach > 0) {
        var flow = reach * reach * Math.min(1, hs / 900), side = m.vx * dyh - m.vy * dx > 0 ? 1 : -1;
        n.vx += (m.vx * .55 + -m.vy / hs * side * hs * .18) * flow * dt * 6;
        n.vy += (m.vy * .55 + m.vx / hs * side * hs * .18) * flow * dt * 6 * .8;
        n.vr += side * flow * hs * .004 * dt * 6;
        stir = Math.min(1, stir + flow * dt * 5);
        if (Math.random() < flow * dt * 6) bub(n.x + (Math.random() - .5) * sz.w * .7, n.y + (Math.random() - .5) * sz.h * .5, m.vx * .08, -25 - Math.random() * 35, .7 + Math.random() * 1.6, now, 600 + Math.random() * 600);
        if (!touched) {
          touched = true;
          T("lure_touched");
        }
      }
    }
    stir = Math.max(0, stir - dt * .45);
    if (stir > .25 && !still && Math.random() < stir * dt * 14) bub(n.x + (Math.random() - .5) * sz.w * .8, n.y + (Math.random() - .5) * sz.h * .5, (Math.random() - .5) * 20, -25 - Math.random() * 40, .8 + Math.random() * 1.8, now, 600 + Math.random() * 700);
    window.mmLureRect = freed || eaten ? null : {
      x: n.x,
      y: n.y,
      w: sz.w,
      h: sz.h
    };
    var sp = Math.hypot(n.vx, n.vy), hxw, hyw;
    if (drag.on) {
      drag.ox *= Math.pow(.05, dt);
      drag.oy *= Math.pow(.05, dt);
      var gx = m.x - drag.ox, gy = m.y - drag.oy, fl = 1 - Math.exp(-dt / .014), nx = n.x + (gx - n.x) * fl, ny = n.y + (gy - n.y) * fl;
      var gd = Math.hypot(gx - nx, gy - ny);
      if (gd > 7) {
        nx = gx + (nx - gx) * 7 / gd;
        ny = gy + (ny - gy) * 7 / gd;
      }
      if (dt) {
        n.vx = n.vx * .4 + (nx - n.x) / dt * .6;
        n.vy = n.vy * .4 + (ny - n.y) / dt * .6;
      }
      n.x = nx;
      n.y = ny;
      sp = Math.hypot(n.vx, n.vy);
      stir = Math.min(1, stir + sp * dt * .004);
      if (Math.random() < Math.min(.6, sp * dt * .04)) bub(n.x + (Math.random() - .5) * sz.w * .7, n.y + (Math.random() - .5) * sz.h * .5, -n.vx * .15, -30 - Math.random() * 40, .8 + Math.random() * 2, now, 600 + Math.random() * 700);
    } else {
      var K = freed ? .6 : 7, C = freed ? 1.6 : 3, snap = drag.last && !freed ? Math.max(0, 1 - (now - drag.last) / 1e3) : 0;
      var wdrag = C + sp * .004 + snap * 1.5, vw = freed || still ? 0 : -sv * .85;
      var eH = drag.last ? Math.min(1, .35 + .65 * Math.pow(Math.max(0, now - drag.last) / 260, 1.4)) : 1;
      n.vx += (clamp(tx - n.x, -140, 140) * K * eH - n.vx * wdrag) * dt;
      n.vy += (clamp(ty - n.y, -140, 140) * K * eH + vw * 5.5 - n.vy * wdrag) * dt;
    }
    hxw = n.x + (HOOK.x - .5) * sz.w;
    hyw = n.y + sz.h * (HOOK.y - .5);
    if (!freed && !still) {
      var ux = ax - hxw, uy = ay - hyw, Ld = Math.hypot(ux, uy) || 1, L0 = ay - (h0.y + sz.h * (HOOK.y - .5)) + 6, ext = Ld - L0;
      ux /= Ld;
      uy /= Ld;
      taut += (clamp(ext / 40, 0, 1) - taut) * Math.min(1, dt * 18);
      if (ext > 0 && !drag.on) {
        var vrad = n.vx * ux + n.vy * uy, KT = 16, ease = drag.last ? Math.min(1, .35 + .65 * Math.pow(Math.max(0, now - drag.last) / 260, 1.4)) : 1, ex2 = Math.min(ext, 420), F = ex2 * KT * (1 + ex2 / 170) * ease - Math.min(0, vrad) * 5 * ease;
        n.vx += ux * F * dt;
        n.vy += uy * F * dt;
      }
    } else if (!freed) taut = 0;
    n.x += n.vx * dt;
    n.y += n.vy * dt;
    if (n.x !== n.x || n.y !== n.y || n.vx !== n.vx || n.vy !== n.vy) {
      n.x = tx;
      n.y = ty;
      n.vx = n.vy = 0;
      n.rot = n.vr = 0;
    }
    if (!freed && !drag.on && !still && (!drag.last || now - drag.last > 3e3)) {
      var ox = n.x - h0.x, oy = n.y - h0.y, od = Math.hypot(ox, oy), lim = sz.w * 3.2;
      if (od > lim) {
        n.x = h0.x + ox / od * lim;
        n.y = h0.y + oy / od * lim;
      }
    }
    hxw = n.x + (HOOK.x - .5) * sz.w;
    hyw = n.y + sz.h * (HOOK.y - .5);
    var lineAng = Math.atan2(ax - hxw, ay - hyw);
    var targetRot = (freed ? Math.sin(t / 1.9) * .16 : -lineAng * (.45 + .3 * taut)) + clamp(-n.vx * 9e-4, -.4, .4) + Math.sin(t * .8) * .03;
    n.vr += ((targetRot - n.rot) * 14 - n.vr * 3.4) * dt;
    n.rot += n.vr * dt;
    n.rot = clamp(n.rot, -.85, .85);
    wv.amp = sz.h * (.04 + .06 * stir + Math.min(.07, sp * 12e-5));
    wv.ph += dt * (1.4 + stir * 3 + Math.min(4, sp * .006));
    wv.bend += (clamp(-n.vy * 45e-5 - (drag.on ? 0 : sv * .0011), -.26, .26) - wv.bend) * Math.min(1, dt * 8);
    wipe();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var dark = inDeep || freed ? 1 : s, a = 1 - .42 * dark;
    var c = Math.cos(n.rot), si = Math.sin(n.rot), yk = still ? 1 : Math.max(.5, Math.cos(yaw));
    var ex = (HOOK.x - .5) * sz.w, ey = (HOOK.y - .5) * sz.h + paperY(HOOK.x, sz.h), hb = hookBox(ex, ey, sz.w);
    var lx = hb.x + HK.eye.x * hb.w, ly = hb.y + HK.eye.y * hb.h + hb.w * .08;
    var eyeX = n.x + (lx * yk * c - ly * si), eyeY = n.y + (lx * yk * si + ly * c);
    var bow = 1 - taut, midx = (eyeX + ax) / 2 + (Math.sin(t * .6) * 5 - n.vx * .035) * bow, midy = (eyeY + ay) / 2, gp = t * .3 % 3.4;
    if (freed) {
      var R = rig, age = (now - freed) / 1e3, born = !R.n, Hd = dr ? dr.height : H, oxv = dr ? dr.left : 0, oyv = dr ? dr.top : 0;
      if (born) {
        var S = 40, L = 0, px = eyeX, py = eyeY, sx = [ eyeX ], sy = [ eyeY ], sl = [ 0 ];
        for (var i = 1; i <= S; i++) {
          var u = i / S, qq = 1 - u, bx = qq * qq * eyeX + 2 * qq * u * midx + u * u * ax, by = qq * qq * eyeY + 2 * qq * u * midy + u * u * ay;
          L += Math.hypot(bx - px, by - py);
          px = bx;
          py = by;
          sx.push(bx);
          sy.push(by);
          sl.push(L);
        }
        var nV = Math.max(6, Math.round(L / 8)), seg = L / nV, TAIL = Math.round(280 / seg), N = nV + 1 + TAIL, MAXN = 240;
        R.x = new Float32Array(MAXN);
        R.y = new Float32Array(MAXN);
        R.vx = new Float32Array(MAXN);
        R.vy = new Float32Array(MAXN);
        R.ox = new Float32Array(MAXN);
        R.oy = new Float32Array(MAXN);
        var k = 1;
        for (var i = 0; i <= nV; i++) {
          var dA = i * seg;
          while (k < S && sl[k] < dA) k++;
          var fA = sl[k] === sl[k - 1] ? 0 : (dA - sl[k - 1]) / (sl[k] - sl[k - 1]);
          R.x[i] = sx[k - 1] + (sx[k] - sx[k - 1]) * fA - oxv;
          R.y[i] = sy[k - 1] + (sy[k] - sy[k - 1]) * fA - oyv;
        }
        var tx1 = ax - midx, ty1 = ay - midy, tl = Math.hypot(tx1, ty1) || 1;
        tx1 /= tl;
        ty1 /= tl;
        for (var i = nV + 1; i < N; i++) {
          R.x[i] = R.x[nV] + tx1 * seg * (i - nV);
          R.y[i] = R.y[nV] + ty1 * seg * (i - nV);
        }
        var hvx = n.vx * .25 - R.sd * 10, hvy = 10 + taut * 30;
        for (var i = 0; i < N; i++) {
          var w = Math.max(0, 1 - i / nV);
          R.vx[i] = hvx * w * (i ? .5 : 1);
          R.vy[i] = hvy * w * (i ? .5 : 1);
        }
        R.n = N;
        R.nV = nV;
        R.seg = seg;
        R.ang = n.rot;
        R.va = -R.sd * .9;
        R.yk = yk;
        R.ph = Math.random() * 6;
        R.gone = false;
        R.Hd = Hd;
        R.hb = {
          x: hb.x,
          y: hb.y,
          w: hb.w,
          h: hb.h
        };
        R.lx = lx;
        R.ly = ly;
        for (var hb2 = 0; hb2 < 6; hb2++) bub(eyeX + (Math.random() - .5) * 8, eyeY - 10, (Math.random() - .5) * 20, -30 - Math.random() * 30, .7 + Math.random() * 1.6, now, 700 + Math.random() * 700);
      }
      var X = R.x, Y = R.y, VX = R.vx, VY = R.vy, OX = R.ox, OY = R.oy, nn = R.n, sg = R.seg, i;
      while (Y[nn - 1] < Hd + 40 && nn < X.length) {
        var ex2 = X[nn - 1] - X[nn - 2], ey2 = Y[nn - 1] - Y[nn - 2], el = Math.hypot(ex2, ey2) || 1;
        X[nn] = X[nn - 1] + ex2 / el * sg;
        Y[nn] = Y[nn - 1] + ey2 / el * sg;
        VX[nn] = VX[nn - 1];
        VY[nn] = VY[nn - 1];
        nn++;
      }
      R.n = nn;
      taut *= Math.pow(.02, dt);
      if (!still && dt > 0) {
        R.simT = (R.simT || 0) + dt;
        if (!R.kv) {
          R.kv = [];
          for (i = 0; i < X.length; i++) R.kv.push(.8 + Math.random() * .45);
        }
        for (i = 0; i < nn; i++) {
          var hk0 = i === 0, kv = R.kv[i] || 1, gv = hk0 ? 96 : 68 * kv, kd = hk0 ? 1.2 : 3.1 / kv;
          var sw = Math.sin(t * .5 + Y[i] * .011 + R.ph) * 9 + Math.sin(t * .21 + R.ph * 2 + Y[i] * .004) * 5 + (hk0 ? 0 : Math.sin(t * 1.3 + i * .9 + R.ph) * 14 + Math.sin(t * .7 - i * .37) * 8);
          VX[i] += (sw - VX[i] * kd) * dt;
          VY[i] += (gv - VY[i] * kd) * dt;
          OX[i] = X[i];
          OY[i] = Y[i];
          X[i] += VX[i] * dt;
          Y[i] += VY[i] * dt;
        }
        for (var it = 0; it < 4; it++) {
          for (i = 0; i < nn - 1; i++) {
            var ddx = X[i + 1] - X[i], ddy = Y[i + 1] - Y[i], dd = Math.hypot(ddx, ddy) || 1e-4, ff = (dd - sg) / dd * (dd < sg ? .15 : 1), w0 = i ? .5 : .18;
            X[i] += ddx * ff * w0;
            Y[i] += ddy * ff * w0;
            X[i + 1] -= ddx * ff * (1 - w0);
            Y[i + 1] -= ddy * ff * (1 - w0);
          }
          for (i = 1; i < nn - 1; i++) {
            var mx2 = (X[i - 1] + X[i + 1]) * .5, my2 = (Y[i - 1] + Y[i + 1]) * .5;
            X[i] += (mx2 - X[i]) * .012;
            Y[i] += (my2 - Y[i]) * .012;
          }
        }
        for (i = 0; i < nn; i++) {
          VX[i] = (X[i] - OX[i]) / dt;
          VY[i] = (Y[i] - OY[i]) / dt;
        }
        var s1x = X[1] - X[0], s1y = Y[1] - Y[0], tg = Math.atan2(-s1x, s1y), df = tg - R.ang;
        df = Math.atan2(Math.sin(df), Math.cos(df));
        R.va += (df * 9 - R.va * 3) * dt;
        R.ang += R.va * dt;
        R.yk += (1 - R.yk) * Math.min(1, dt * 1.2);
      }
      var minY = 1e9;
      for (i = 0; i < nn; i++) if (Y[i] < minY) minY = Y[i];
      if (minY > Hd + 60) R.gone = true;
      R.tt = taut;
      R.gp = gp;
      if (!R.gone && (!R.fishDrewAt || now - R.fishDrewAt > 120)) {
        drawRope(g, oxv, oyv);
        R.lureDrewAt = now;
      }
      eyeX = -1e4;
      ax = -1e4;
    }
    if (!freed) {
      g.beginPath();
      g.moveTo(eyeX, eyeY);
      g.quadraticCurveTo(midx, midy, ax, ay);
      mono(g, dark, taut);
      if (gp < 1 && !still) {
        var qg = 1 - gp;
        glint(g, qg * qg * eyeX + 2 * qg * gp * midx + gp * gp * ax, qg * qg * eyeY + 2 * qg * gp * midy + gp * gp * ay, dark);
      }
    }
    function drawBubs() {
      for (var b2 = bubs.length - 1; b2 >= 0; b2--) {
        var B = bubs[b2], age = (now - B.t) / B.life;
        if (age >= 1) {
          bubs.splice(b2, 1);
          continue;
        }
        B.vx *= Math.pow(.2, dt);
        B.vy += (-55 - B.vy) * Math.min(1, dt * 2);
        B.x += (B.vx + Math.sin(t * 7 + B.ph) * 10) * dt;
        B.y += B.vy * dt;
        var al = (1 - age) * (age < .1 ? age * 10 : 1);
        g.beginPath();
        g.arc(B.x, B.y, B.r, 0, Math.PI * 2);
        g.lineWidth = .8;
        g.strokeStyle = dark > .5 ? "rgba(190,225,240," + .55 * al + ")" : "rgba(70,90,100," + .5 * al + ")";
        g.stroke();
        g.fillStyle = "rgba(255,255,255," + .7 * al + ")";
        g.beginPath();
        g.arc(B.x - B.r * .35, B.y - B.r * .35, Math.max(.4, B.r * .3), 0, Math.PI * 2);
        g.fill();
      }
      if (bubs.length > 80) bubs.splice(0, bubs.length - 80);
    }
    var ep = eaten ? clamp((now - eaten) / 320, 0, 1) : 0, sc = 1 - ep * ep * .96;
    if (eaten) {
      if (A) {
        var e = Math.min(1, dt * (6 + ep * 30));
        n.x += (A.x - n.x) * e;
        n.y += (A.y - n.y) * e;
      }
      if (ep >= 1) {
        drawBubs();
        return;
      }
    }
    g.save();
    g.translate(n.x, n.y);
    g.rotate(n.rot);
    g.scale(sc * yk, sc);
    g.globalAlpha = a;
    if (!freed) hook(g, ex, ey, sz.w, true);
    var N = still ? 1 : PL() >= 2 ? 16 : 56, iw = pic.naturalWidth, ih = pic.naturalHeight, pad = Math.ceil(sz.h * .3), LW = Math.ceil(sz.w * dpr), LH = Math.ceil((sz.h + pad * 2) * dpr);
    if (NL.width !== LW || NL.height !== LH) {
      NL.width = CL.width = LW;
      NL.height = CL.height = LH;
    }
    nl.setTransform(1, 0, 0, 1, 0, 0);
    nl.clearRect(0, 0, LW, LH);
    nl.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (var i = 0; i < N; i++) {
      var u0 = i / N, u1 = (i + 1) / N, u = (u0 + u1) / 2;
      nl.drawImage(pic, u0 * iw, 0, (u1 - u0) * iw, ih, u0 * sz.w, pad + paperY(u, sz.h), (u1 - u0) * sz.w + .4, sz.h);
    }
    if (dark > 0) {
      nl.setTransform(1, 0, 0, 1, 0, 0);
      nl.globalCompositeOperation = "source-atop";
      nl.fillStyle = "rgba(3,10,16," + (.42 * dark).toFixed(3) + ")";
      nl.fillRect(0, 0, LW, LH);
      nl.globalCompositeOperation = "source-over";
    }
    var ga = g.globalAlpha;
    g.globalAlpha = 1;
    g.drawImage(NL, -sz.w / 2, -sz.h / 2 - pad, sz.w, sz.h + pad * 2);
    g.globalAlpha = ga;
    var sun = inDeep || freed ? 0 : 1 - smooth(s * 1.25);
    if (causOk && !still && PL() < 1 && sun > .02) {
      cl.setTransform(1, 0, 0, 1, 0, 0);
      cl.globalCompositeOperation = "source-over";
      cl.clearRect(0, 0, LW, LH);
      if (!causPat) causPat = cl.createPattern(caus, "repeat");
      var k1 = sz.w / 95;
      [ [ k1, t * 9, t * 5, 0, .75 ], [ k1 * 1.6, -t * 6, t * 8, .7, .55 ] ].forEach(function(L) {
        var mtx = (new DOMMatrix).translateSelf(L[1] * dpr, L[2] * dpr).rotateSelf(L[3] * 57.3).scaleSelf(L[0] * dpr, L[0] * dpr);
        causPat.setTransform(mtx);
        cl.globalAlpha = L[4];
        cl.globalCompositeOperation = "lighter";
        cl.fillStyle = causPat;
        cl.fillRect(0, 0, LW, LH);
      });
      cl.globalAlpha = 1;
      cl.globalCompositeOperation = "destination-in";
      cl.drawImage(NL, 0, 0);
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = a * .45 * sun;
      g.drawImage(CL, -sz.w / 2, -sz.h / 2 - pad, sz.w, sz.h + pad * 2);
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = a;
    }
    if (!freed) hook(g, ex, ey, sz.w, false);
    g.restore();
    g.globalAlpha = 1;
    if (freed && hkOk && rig.n && !rig.gone && now - freed < 500) {
      var B3 = rig.hb, P3 = HK.point, iw3 = hk.naturalWidth, ih3 = hk.naturalHeight;
      g.save();
      g.globalAlpha = a * (1 - (now - freed) / 500);
      g.translate(rig.x[0] + (dr ? dr.left : 0), rig.y[0] + (dr ? dr.top : 0));
      g.rotate(rig.ang);
      g.translate(-rig.lx * rig.yk, -rig.ly);
      g.scale(rig.yk, 1);
      g.drawImage(hk, P3[0] * iw3, P3[1] * ih3, (P3[2] - P3[0]) * iw3, (P3[3] - P3[1]) * ih3, B3.x + P3[0] * B3.w, B3.y + P3[1] * B3.h, (P3[2] - P3[0]) * B3.w, (P3[3] - P3[1]) * B3.h);
      g.restore();
    }
    drawBubs();
    m.px = m.x;
    m.py = m.y;
  }
  requestAnimationFrame(frame);
})();
