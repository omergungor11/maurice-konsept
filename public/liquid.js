(function() {
  "use strict";
  var CFG = {
    r: 34,
    bulge: .32,
    f1: 1.4,
    f2: 2.3,
    term: .34,
    wob: 9,
    apex: .62,
    mw: .46,
    pinch: .12,
    goo: 7
  };
  var PHY = {
    reach: 55,
    push: 8,
    carry: .16,
    dip: .3,
    still: .2,
    slow: .05,
    max: .85,
    flat: .006,
    couple: .28,
    sub: 4,
    damp: .9845
  };
  var INK = "#161511", PERIOD = 18e3, FPS = 24, FPS_LIVE = 60, PI = Math.PI;
  var _h = 300 + 68 * PHY.max, _pad = CFG.r * ((1 + CFG.bulge + CFG.term) * 1.06 + PHY.max);
  var REF_H = _h - 2 * _pad, REF_W = (_h * 298 / 160 - 2 * _pad) * CFG.mw, MW = REF_W / REF_H;
  var UNIT = {
    r: CFG.r / REF_H,
    wob: CFG.wob / REF_H,
    goo: CFG.goo * _h / 300 / REF_H
  };
  var NAME_R = .16, NAME_BULGE = .28, TRACK = .18, SPACE = .45, LEAD = .4;
  var SEEDSTEP = 2.7;
  function skel(x0, W, H, apex) {
    var A = H * apex;
    return [ [ x0, H ], [ x0, H * .16 ], [ x0 + W * .11, 0 ], [ x0 + W * .31, A * .55 ], [ x0 + W * .5, A ], [ x0 + W * .69, A * .55 ], [ x0 + W * .89, 0 ], [ x0 + W, H * .16 ], [ x0 + W, H ] ];
  }
  function polylen(pts) {
    var t = 0;
    for (var i = 0; i < pts.length - 1; i++) t += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    return t;
  }
  function sample(pts, n) {
    var out = [], segs = [], tot = 0, i, d;
    for (i = 0; i < pts.length - 1; i++) {
      d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      segs.push(d);
      tot += d;
    }
    for (var k = 0; k <= n; k++) {
      var t = k / n * tot;
      i = 0;
      while (i < segs.length && t > segs[i]) {
        t -= segs[i];
        i++;
      }
      if (i >= segs.length) {
        out.push(pts[pts.length - 1].slice());
        continue;
      }
      var f = segs[i] ? t / segs[i] : 0;
      out.push([ pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f ]);
    }
    return out;
  }
  var DENS = 160 / polylen(skel(0, MW, 1, CFG.apex));
  function S(pts, o) {
    o = o || {};
    return {
      pts: pts,
      k: o.k || 1,
      closed: !!o.closed,
      ends: o.ends || [ 1, 1 ],
      pin: o.pin || null,
      pd: o.pd || 1
    };
  }
  function arc(cx, cy, rx, ry, a0, a1, n) {
    var out = [];
    for (var i = 0; i <= n; i++) {
      var a = a0 + (a1 - a0) * i / n;
      out.push([ cx + rx * Math.cos(a), cy + ry * Math.sin(a) ]);
    }
    return out;
  }
  var GL = {
    M: {
      w: MW,
      strokes: [ S(skel(0, MW, 1, CFG.apex)) ]
    },
    A: {
      w: 1.22,
      lsb: -.095,
      rsb: -.095,
      strokes: [ S([ [ 0, 1 ], [ .61, 0 ], [ 1.22, 1 ] ], {
        pin: [ .5 ],
        pd: 2.5,
        ends: [ .5, .5 ]
      }), S([ [ .23, .76 ], [ .99, .76 ] ], {
        k: .58,
        ends: [ 0, 0 ]
      }) ]
    },
    U: {
      w: .78,
      strokes: [ S([ [ 0, 0 ], [ 0, .5 ] ].concat(arc(.39, .5, .39, .5, PI, 0, 32)).concat([ [ .78, 0 ] ]), {
        ends: [ 1, .5 ]
      }) ]
    },
    R: {
      w: .82,
      strokes: [ S([ [ 0, 0 ], [ 0, 1 ] ], {
        ends: [ .4, 1 ]
      }), S([ [ 0, 0 ] ].concat(arc(.4, .34, .42, .34, -PI / 2, PI / 3, 32)).concat([ [ 0, .56 ] ]), {
        k: .86,
        ends: [ 0, 0 ]
      }), S([ [ .61, .63 ], [ .82, 1 ] ], {
        ends: [ 0, .5 ],
        pin: [ 0 ],
        pd: 1
      }) ]
    },
    I: {
      w: 0,
      strokes: [ S([ [ 0, 0 ], [ 0, 1 ] ], {
        ends: [ .5, .5 ]
      }) ]
    },
    C: {
      w: .82,
      lsb: -.03,
      rsb: -.04,
      strokes: [ S(arc(.41, .5, .41, .5, -.3 * PI, -1.7 * PI, 48)) ]
    },
    E: {
      w: .66,
      strokes: [ S([ [ 0, 0 ], [ 0, 1 ] ], {
        ends: [ .4, .4 ]
      }), S([ [ 0, 0 ], [ .66, 0 ] ], {
        k: .78,
        ends: [ 0, .5 ]
      }), S([ [ 0, .5 ], [ .52, .5 ] ], {
        k: .78,
        ends: [ 0, .5 ]
      }), S([ [ 0, 1 ], [ .66, 1 ] ], {
        k: .78,
        ends: [ 0, .5 ]
      }) ]
    },
    O: {
      w: .9,
      lsb: -.03,
      rsb: -.03,
      strokes: [ S(arc(.45, .5, .45, .5, -PI / 2, 1.5 * PI, 64), {
        closed: true
      }) ]
    },
    Y: {
      w: .95,
      lsb: -.08,
      rsb: -.08,
      strokes: [ S([ [ 0, 0 ], [ .475, .52 ], [ .95, 0 ] ], {
        ends: [ .5, .5 ]
      }), S([ [ .475, .52 ], [ .475, 1 ] ], {
        ends: [ 0, 1 ]
      }) ]
    },
    N: {
      w: .85,
      strokes: [ S([ [ 0, 1 ], [ 0, 0 ], [ .85, 1 ], [ .85, 0 ] ], {
        ends: [ .5, .5 ]
      }) ]
    },
    H: {
      w: .82,
      strokes: [ S([ [ 0, 0 ], [ 0, 1 ] ], {
        ends: [ .5, .5 ]
      }), S([ [ .82, 0 ], [ .82, 1 ] ], {
        ends: [ .5, .5 ]
      }), S([ [ 0, .5 ], [ .82, .5 ] ], {
        k: .85,
        ends: [ 0, 0 ]
      }) ]
    }
  };
  function layout(text, Wc, o) {
    var r = o.r, lines = text.split("|"), L = [], i, j, ch, g, pen;
    var pad = r * ((1 + o.bulge + CFG.term) * 1.06 + PHY.max) - r + UNIT.wob;
    for (i = 0; i < lines.length; i++) {
      var row = [], wi = -1, ws = 0;
      pen = 0;
      for (j = 0; j < lines[i].length; j++) {
        ch = lines[i].charAt(j);
        if (ch === " ") {
          pen += o.space;
          wi = -1;
          continue;
        }
        g = GL[ch];
        if (!g) continue;
        pen += g.lsb || 0;
        if (wi < 0) wi = row.length;
        row.push({
          g: g,
          x: pen + r,
          seed: row.length === wi ? (L.length * 9 + row.length) * 2.7 : ws + (o.seedstep || SEEDSTEP) * (row.length - wi),
          ch: ch
        });
        if (row.length - 1 === wi) ws = row[wi].seed;
        pen += g.w + 2 * r + (g.rsb || 0) + o.track;
      }
      pen -= o.track;
      L.push({
        row: row,
        w: pen,
        H: Wc / (pen + 2 * pad)
      });
    }
    var strokes = [], base = 0, y = 0, Hsum = 0, cap = -1, bl = 0;
    for (i = 0; i < L.length; i++) Hsum += L[i].H;
    var Hm = Hsum / L.length, lead = o.lead * Hm, head = (o.head || 0) * Hm;
    for (i = 0; i < L.length; i++) {
      var H = L[i].H, x0 = pad * H, top = (i ? y : pad * H + head) + r * H, by = top + H;
      for (j = 0; j < L[i].row.length; j++) {
        var it = L[i].row[j], gx = x0 + H * it.x, gy = by - H;
        for (var s = 0; s < it.g.strokes.length; s++) {
          var st = it.g.strokes[s], pts = [], p;
          for (p = 0; p < st.pts.length; p++) pts.push([ gx + st.pts[p][0] * H, gy + st.pts[p][1] * H ]);
          var len = polylen(pts) / H, cnt = Math.max(6, Math.round(len * DENS));
          var sp = sample(pts, cnt);
          strokes.push({
            k: st.k,
            closed: st.closed,
            ends: st.ends,
            spts: sp,
            n: sp.length,
            b: base,
            seed: it.seed + s * 1.1,
            H: H,
            L: len,
            pin: st.pin || PIN,
            pinch: st.pin ? st.pd : Math.max(0, Math.min(1, len - 2)),
            ch: it.ch,
            si: s,
            gx: gx,
            gy: gy
          });
          base += sp.length;
        }
      }
      if (cap < 0) cap = by - H;
      bl = by;
      y = by + r * H + (i < L.length - 1 ? lead : pad * H);
    }
    return {
      strokes: strokes,
      N: base,
      height: y,
      H: Hm,
      pad: pad,
      head: head,
      cap: cap,
      bl: bl
    };
  }
  var LM = polylen(skel(0, MW, 1, CFG.apex));
  var TERM_W = .1 * LM, PINCH_W = .13 * LM, PIN = [ .3, .7 ];
  var SH = [ 0, 0, 0, 0 ];
  function shape(st, i, c, ph) {
    var pt = st.spts[i], t = i / (st.n - 1), L = st.L, s = t * L, u = s / LM, seed = st.seed, term = 1, swell, wobp;
    var r = c.r * st.H, wob = c.wob * st.H;
    if (st.closed) {
      swell = 1 + c.bulge * Math.sin(t * PI * 2 + ph + seed) + c.bulge * .55 * Math.sin(t * 2 * PI * 2 + ph * 2 + seed * 1.9);
      wobp = t * 2 * PI * 2 + ph + seed;
    } else {
      term = 1 + c.term * st.ends[0] * Math.exp(-Math.pow(s / TERM_W, 2)) + c.term * st.ends[1] * Math.exp(-Math.pow((L - s) / TERM_W, 2));
      swell = 1 + c.bulge * Math.sin(u * c.f1 * PI * 2 + ph + seed) + c.bulge * .55 * Math.sin(u * c.f2 * PI * 2 + ph * 2 + seed * 1.9);
      wobp = u * 1.8 * PI * 2 + ph + seed;
    }
    var pa = st.pinch, pinch = 1, pin = st.pin, j;
    if (pa > 0) {
      var g = 0;
      for (j = 0; j < pin.length; j++) g += Math.exp(-Math.pow((t - pin[j]) * L / PINCH_W, 2));
      pinch = 1 - c.pinch * pa * g;
    }
    SH[2] = Math.max(0, r * st.k * swell * term * pinch);
    SH[0] = pt[0] + Math.sin(wobp) * wob;
    SH[1] = pt[1] + Math.cos(wobp) * wob;
    SH[3] = r;
    return SH;
  }
  function water(fx, b, n, lim) {
    var s, i, j, pm, pp;
    for (s = 0; s < PHY.sub; s++) {
      for (i = 0; i < n; i++) {
        j = b + i;
        pm = i > 0 ? fx.ox[j - 1] : fx.ox[j];
        pp = i < n - 1 ? fx.ox[j + 1] : fx.ox[j];
        fx.ax[j] = PHY.couple * (pm + pp - 2 * fx.ox[j]) - PHY.flat * fx.ox[j];
        pm = i > 0 ? fx.oy[j - 1] : fx.oy[j];
        pp = i < n - 1 ? fx.oy[j + 1] : fx.oy[j];
        fx.ay[j] = PHY.couple * (pm + pp - 2 * fx.oy[j]) - PHY.flat * fx.oy[j];
      }
      for (i = 0; i < n; i++) {
        j = b + i;
        fx.vx[j] = (fx.vx[j] + fx.ax[j]) * PHY.damp;
        fx.vy[j] = (fx.vy[j] + fx.ay[j]) * PHY.damp;
        fx.ox[j] += fx.vx[j];
        fx.oy[j] += fx.vy[j];
        var m2 = fx.ox[j] * fx.ox[j] + fx.oy[j] * fx.oy[j];
        if (m2 > lim * lim) {
          var sc = lim / Math.sqrt(m2);
          fx.ox[j] *= sc;
          fx.oy[j] *= sc;
          fx.vx[j] *= sc;
          fx.vy[j] *= sc;
        }
        if (m2 > fx.mo) fx.mo = m2;
        var s2 = fx.vx[j] * fx.vx[j] + fx.vy[j] * fx.vy[j];
        if (s2 > fx.mv) fx.mv = s2;
      }
    }
  }
  var THIN = .7, THIN_FEET = .7, thinNow = 0, thinCap = -1;
  var EXIT_FLOOR = .042;
  var LIFT_AT = .55, LIFT_V = .9, LIFT_A = 7, liftP = 0;
  var NECK = .7, NECK_LEN = 2.2, NECK_BY = .45;
  var RESOLVE = 1, EXIT_FROM = .88, EXIT_VH = .22, EXIT_STAG = .3, EXIT_POW = 1.5, FOOT_ROUND = 1, EXIT_THIN = .6, EXIT_THIN_FROM = .05, EXIT_HOLD = 0;
  var HONEY = 1, THREAD = .25, THREAD_AT = RESOLVE ? .74 : 1, EVEN_FROM = .5, SNAP_AT = RESOLVE ? .74 : 2, SNAP_SPREAD = .4, BEAD = 1.1, BEAD_W = .11, SNAP_EASE = 1.7, FRONT_LO = 1.3, FRONT_HI = -.35;
  var drainNow = 0, honeyNow = false;
  function cutOf(st) {
    var n = st.n, y = new Float32Array(n), cut = new Float32Array(n), i, j, k, lo = 1e9;
    for (i = 0; i < n; i++) {
      y[i] = (st.spts[i][1] - st.gy) / st.H;
      if (y[i] < lo) lo = y[i];
      cut[i] = 1e9;
    }
    for (i = 0; i < n; i++) {
      if (y[i] > lo + .02) continue;
      for (k = -1; k <= 1; k += 2) {
        var m = y[i];
        j = i;
        for (var c = 0; c < n; c++) {
          j += k;
          if (j < 0 || j >= n) {
            if (!st.closed) break;
            j = (j + n) % n;
          }
          if (j === i) break;
          if (y[j] > m) m = y[j];
          if (m < cut[j]) cut[j] = m;
        }
      }
      if (cut[i] > y[i]) cut[i] = y[i];
    }
    return cut;
  }
  function sstep(a, b, x) {
    x = (x - a) / (b - a);
    x = x < 0 ? 0 : x > 1 ? 1 : x;
    return x * x * (3 - 2 * x);
  }
  function thin(st, sh, i) {
    if (!thinNow || Math.abs(st.gy - thinCap) > 1) return;
    var up = (st.gy + st.H - sh[1]) / st.H;
    up = up < 0 ? 0 : up > 1 ? 1 : up;
    if (!honeyNow) {
      sh[2] *= 1 - thinNow * (THIN_FEET + (1 - THIN_FEET) * up);
      return;
    }
    var sm = drainNow, d = Math.min(1, sm / THREAD_AT);
    var feet = THIN_FEET + (1 - THIN_FEET) * sstep(EVEN_FROM, THREAD_AT, sm);
    var f = 1 - (1 - THREAD) * d * (feet + (1 - feet) * up);
    var mix = sstep(EVEN_FROM, THREAD_AT, sm), rt = sh[3] * THREAD;
    var r = sh[2] * f, rf = sh[3] * f;
    r += (rf - r) * mix;
    if (r < rt * mix) r = rt * mix;
    if (sm > SNAP_AT) {
      var s0 = SNAP_AT + (1 - SNAP_AT) * SNAP_SPREAD * hash1(st.seed - st.si * 1.1), u = (sm - s0) / ((1 - SNAP_AT) * (1 - SNAP_SPREAD));
      u = u < 0 ? 0 : u > 1 ? 1 : u;
      u = 1 - Math.pow(1 - u, SNAP_EASE);
      var front = FRONT_LO + (FRONT_HI - FRONT_LO) * u, yb = (sh[1] - st.gy) / st.H;
      if (!st.cut) st.cut = cutOf(st);
      if (st.cut[i] > front) r = 0; else if (u > 0) {
        var p0 = st.spts[i > 0 ? i - 1 : i], p1 = st.spts[i < st.n - 1 ? i + 1 : i], dx = p1[0] - p0[0], dy = p1[1] - p0[1];
        var vert = dy * dy / (dx * dx + dy * dy + 1e-9), dz = (front - yb) / BEAD_W;
        r += rt * BEAD * vert * Math.min(1, u * 6) * Math.exp(-dz * dz);
      }
    }
    sh[2] = r;
  }
  function blobStroke(g, st, c, ph, fx) {
    var n = st.n, i, sh;
    if (!(fx && fx.on)) {
      for (i = 0; i < n; i++) {
        sh = shape(st, i, c, ph);
        thin(st, sh, i);
        g.moveTo(sh[0] + sh[2], sh[1]);
        g.arc(sh[0], sh[1], sh[2], 0, PI * 2);
      }
      return;
    }
    var b = st.b;
    for (i = 0; i < n; i++) {
      var j = b + i;
      sh = shape(st, i, c, ph);
      thin(st, sh, i);
      fx.bx[j] = sh[0];
      fx.by[j] = sh[1];
      fx.br[j] = sh[2];
      var dx = sh[0] + fx.ox[j] - fx.cx, dy = sh[1] + fx.oy[j] - fx.cy, d2 = dx * dx + dy * dy;
      var near = Math.exp(-d2 / (fx.reach * fx.reach));
      fx.nr[j] = near;
      if (near > .002) {
        var inv = 1 / Math.max(Math.sqrt(d2), .001);
        fx.vx[j] += (dx * inv * fx.push + fx.dx * PHY.carry) * near;
        fx.vy[j] += (dy * inv * fx.push + fx.dy * PHY.carry) * near;
      }
    }
    water(fx, b, n, c.r * st.H * PHY.max);
    for (i = 0; i < n; i++) {
      var k = b + i, px = fx.bx[k] + fx.ox[k], py = fx.by[k] + fx.oy[k];
      var rr = fx.br[k] * (1 - PHY.dip * fx.nr[k]);
      g.moveTo(px + rr, py);
      g.arc(px, py, rr, 0, PI * 2);
    }
  }
  var SMEAR_BAND = .16, TAPER = .5, STRETCH = .3, Q_MIN = .7, BAND = 0, BEND = 0;
  var INKMAP = {
    d: null,
    w: 0,
    h: 0,
    band: 0,
    bh: 0
  };
  function hash1(i) {
    var v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return v - Math.floor(v);
  }
  function vnoise(u) {
    var i = Math.floor(u), f = u - i;
    f = f * f * (3 - 2 * f);
    var a = hash1(i);
    return a + (hash1(i + 1) - a) * f;
  }
  function smearLen(u) {
    return .55 + .45 * vnoise(u / 1.15);
  }
  var GRAIN = 0;
  function makeGrain(Wc, capC, unit) {
    var t = document.createElement("canvas");
    t.width = Wc;
    t.height = Math.max(1, Math.ceil(capC));
    var g = t.getContext("2d"), im = g.createImageData(t.width, t.height), d = im.data, x, y;
    var col = new Float32Array(Wc), bw = Math.max(1, Math.round(unit * .012));
    for (x = 0; x < Wc; x += bw) {
      var r = hash1(x * .731 + 3.3), v = r > .5 ? (r - .5) / .5 : 0;
      for (var j = 0; j < bw && x + j < Wc; j++) col[x + j] = v;
    }
    for (y = 0; y < t.height; y++) {
      var fade = Math.min(1, Math.max(0, (capC - unit * .36 - y) / (unit * .6)));
      if (!fade) continue;
      for (x = 0; x < Wc; x++) {
        var b = col[x];
        if (!b) continue;
        if (vnoise(y / (unit * .4) + Math.floor(x / bw) * 1.37) < .42) continue;
        var i = (y * Wc + x) * 4;
        d[i] = d[i + 1] = d[i + 2] = 255;
        d[i + 3] = Math.round(b * fade * GRAIN * 255);
      }
    }
    g.putImageData(im, 0, 0);
    return t;
  }
  function probeRuns(w, h, lay, c, scratch) {
    var cv = scratch.r || (scratch.r = document.createElement("canvas")), g, i;
    if (cv.width !== w || cv.height !== h) {
      cv.width = w;
      cv.height = h;
    }
    g = cv.getContext("2d");
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, w, h);
    var keep = thinNow;
    thinNow = 0;
    g.fillStyle = "#000";
    g.beginPath();
    for (i = 0; i < lay.strokes.length; i++) blobStroke(g, lay.strokes[i], c, 0, null);
    g.fill("nonzero");
    thinNow = keep;
    var pr = scratch.p || (scratch.p = document.createElement("canvas")), pg;
    if (pr.width !== w || pr.height !== 1) {
      pr.width = w;
      pr.height = 1;
    }
    pg = pr.getContext("2d");
    pg.clearRect(0, 0, w, 1);
    var bt = Math.max(0, lay.cap - c.r * lay.H * 1.6), bb = Math.min(h, lay.cap + SMEAR_BAND * lay.H);
    if (bb > bt) pg.drawImage(cv, 0, bt, w, bb - bt, 0, 0, w, 1);
    var row = pg.getImageData(0, 0, w, 1).data, all = [], runs = [], x, x0 = -1, gap = 0, minw = lay.H * .08;
    for (x = 0; x <= w; x++) {
      var on = x < w && row[x * 4 + 3] > 24;
      if (on) {
        if (x0 < 0) x0 = x;
        gap = 0;
      } else if (x0 >= 0) {
        if (++gap > 2 || x === w) {
          all.push([ x0, x - gap ]);
          x0 = -1;
          gap = 0;
        }
      }
    }
    for (i = 0; i < all.length; i++) if (all[i][1] - all[i][0] >= minw) runs.push(all[i]);
    var lt = {}, keys = [], st, k, sh, Lr;
    for (i = 0; i < lay.strokes.length; i++) {
      st = lay.strokes[i];
      if (Math.abs(st.gy - lay.cap) > 1) continue;
      Lr = lt[st.gx];
      if (!Lr) {
        Lr = lt[st.gx] = {
          x0: 1e9,
          x1: -1e9,
          ty: 1e9,
          tx: 0,
          seed: st.seed - st.si * 1.1
        };
        keys.push(st.gx);
      }
      for (k = 0; k < st.n; k++) {
        sh = shape(st, k, c, 0);
        if (sh[0] - sh[2] < Lr.x0) Lr.x0 = sh[0] - sh[2];
        if (sh[0] + sh[2] > Lr.x1) Lr.x1 = sh[0] + sh[2];
        if (sh[1] - sh[2] < Lr.ty) {
          Lr.ty = sh[1] - sh[2];
          Lr.tx = sh[0];
        }
      }
    }
    for (i = 0; i < keys.length; i++) {
      Lr = lt[keys[i]];
      var hit = false;
      for (k = 0; k < runs.length; k++) if (runs[k][0] - lay.H * .2 < Lr.tx && Lr.tx < runs[k][1] + lay.H * .2) {
        hit = true;
        break;
      }
      if (!hit) runs.push([ Lr.tx - minw / 2, Lr.tx + minw / 2 ]);
    }
    g.clearRect(0, 0, w, h);
    var keepCap = thinCap, keepHoney = honeyNow;
    thinNow = THIN;
    thinCap = lay.cap;
    honeyNow = false;
    g.fillStyle = "#000";
    g.beginPath();
    for (i = 0; i < lay.strokes.length; i++) blobStroke(g, lay.strokes[i], c, 0, null);
    g.fill("nonzero");
    thinNow = keep;
    thinCap = keepCap;
    honeyNow = keepHoney;
    var bh2 = Math.max(1, Math.round(bb - bt)), band = bb > bt ? g.getImageData(0, Math.round(bt), w, bh2).data : null, col = new Uint8Array(w), y;
    if (band) for (y = 0; y < bh2; y++) for (x = 0; x < w; x++) if (band[(y * w + x) * 4 + 3] > 128) col[x] = 1;
    for (i = 0; i < runs.length; i++) {
      var a0 = Math.max(0, Math.floor(runs[i][0])), a1 = Math.min(w - 1, Math.ceil(runs[i][1])), t0 = -1, t1 = -1;
      for (x = a0; x <= a1; x++) if (col[x]) {
        if (t0 < 0) t0 = x;
        t1 = x;
      }
      runs[i] = [ runs[i][0], runs[i][1], t0 < 0 ? 0 : (t1 - t0 + 1) / 2 ];
      var mid = (runs[i][0] + runs[i][1]) / 2, own = mid;
      for (k = 0; k < keys.length; k++) {
        Lr = lt[keys[k]];
        if (Lr.x0 <= mid && mid <= Lr.x1) {
          own = Lr.seed;
          break;
        }
      }
      runs[i].push(own);
    }
    return runs;
  }
  function buildMask(w, h, lay, c, p, scratch, fx, sm, ex) {
    var cv = scratch.a, g = cv.getContext("2d"), ph = p * PI * 2, i;
    ex = RESOLVE ? ex || 0 : 0;
    if (cv.width !== w || cv.height !== h) {
      cv.width = w;
      cv.height = h;
    } else g.clearRect(0, 0, w, h);
    var sy = 1 + STRETCH * sm, capS = lay.bl + (lay.cap - lay.bl) * sy;
    thinNow = THIN * sm;
    thinCap = lay.cap;
    drainNow = sm;
    honeyNow = !!HONEY;
    g.fillStyle = "#000";
    g.beginPath();
    if (sy !== 1) g.setTransform(1, 0, 0, sy, 0, lay.bl * (1 - sy));
    for (i = 0; i < lay.strokes.length; i++) blobStroke(g, lay.strokes[i], c, ph, fx);
    g.fill("nonzero");
    g.setTransform(1, 0, 0, 1, 0, 0);
    var blur = c.goo * lay.H, dist = sm * (lay.drip || 0), src = cv;
    BAND = Math.max(0, Math.floor(capS - dist - c.r * lay.H * sy - (lay.cap - lay.head) - 3 * blur));
    BEND = h;
    if (sm > 0 && dist > .5) {
      var sc = scratch.c, sg = sc.getContext("2d");
      if (sc.width !== w || sc.height !== h) {
        sc.width = w;
        sc.height = h;
      } else sg.clearRect(0, 0, w, h);
      if (scratch.runsLay !== lay) {
        scratch.runs = probeRuns(w, h, lay, c, scratch);
        scratch.runsLay = lay;
      }
      var runs = scratch.runs;
      sg.fillStyle = "#000";
      sg.beginPath();
      var base = capS + SMEAR_BAND * lay.H * .5, N = 14, k, t, yy, hw, cx, L, top, half, wv;
      var round = RESOLVE && FOOT_ROUND ? sstep(SNAP_AT, 1, sm) : 0, xl = 0, xr = 0, rise;
      for (var ri = 0; ri < runs.length; ri++) {
        cx = (runs[ri][0] + runs[ri][1]) / 2;
        hw = (runs[ri][1] - runs[ri][0]) / 2;
        var hw0 = hw;
        hw = hw + (Math.min(hw, runs[ri][2]) - hw) * sm;
        L = dist * smearLen(cx / lay.H);
        top = capS - L;
        if (top >= base - 1) continue;
        rise = 0;
        var slim = 1, rnd = round;
        if (RESOLVE) {
          var sS = SNAP_AT + (1 - SNAP_AT) * SNAP_SPREAD * hash1(runs[ri][3]), sD = (1 - SNAP_AT) * (1 - SNAP_SPREAD), lA = sS + sD * LIFT_AT, dd = liftP - lA;
          if (EXIT_THIN) slim = 1 - EXIT_THIN * sstep(sS, sS + sD * (LIFT_AT + .4), liftP);
          rnd = FOOT_ROUND ? sstep(sS, lA, liftP) : 0;
          if (dd > 0) rise = Math.min(base + hw0 + L + 4, (lay.drip || 0) * (LIFT_V * dd + LIFT_A * dd * dd));
        }
        var nk = RESOLVE && NECK && rise > 0 ? NECK * sstep(0, NECK_BY, rise / (base + hw0 + 2)) : 0, nL = NECK_LEN * lay.H;
        var sp = cx / lay.H * 7, mh = lay.H * .065;
        hw = Math.max(hw, mh) * slim;
        mh = Math.max(mh * slim, lay.H * EXIT_FLOOR);
        hw = Math.max(hw, mh);
        var tp = TAPER * Math.min(1, hw / hw0);
        for (k = 0; k <= N; k++) {
          t = k / N;
          yy = base + (top - base) * t;
          wv = 1 + .07 * Math.sin(yy / lay.H * 5.1 + sp) + .04 * Math.sin(yy / lay.H * 11.3 + sp * 1.7);
          half = Math.max(mh, hw * (1 - tp * Math.pow(t, 1.15)) * wv);
          if (nk) {
            var q0 = 1 - Math.min(1, (yy < base ? base - yy : 0) / nL);
            half = Math.max(lay.H * EXIT_FLOOR, half * (1 - nk * q0 * q0));
          }
          if (k === 0) {
            xl = cx - half;
            sg.moveTo(cx - half, yy - rise);
          } else sg.lineTo(cx - half, yy - rise);
        }
        var rt = Math.max(mh, hw * (1 - tp));
        sg.arc(cx, top - rise, rt, Math.PI, Math.PI * 2, false);
        for (k = N; k >= 0; k--) {
          t = k / N;
          yy = base + (top - base) * t;
          wv = 1 + .07 * Math.sin(yy / lay.H * 5.3 + sp * 1.3) + .04 * Math.sin(yy / lay.H * 10.7 + sp * .6);
          half = Math.max(mh, hw * (1 - tp * Math.pow(t, 1.15)) * wv);
          if (nk) {
            var q1 = 1 - Math.min(1, (yy < base ? base - yy : 0) / nL);
            half = Math.max(lay.H * EXIT_FLOOR, half * (1 - nk * q1 * q1));
          }
          sg.lineTo(cx + half, yy - rise);
        }
        xr = cx + half;
        if (rnd > 0) sg.ellipse((xl + xr) / 2, base - rise, (xr - xl) / 2, (xr - xl) / 2 * rnd, 0, 0, Math.PI, false);
        sg.closePath();
      }
      sg.fill("nonzero");
      sg.drawImage(cv, 0, 0);
      src = sc;
    }
    var goo = scratch.b, gg = goo.getContext("2d"), bh = BEND - BAND;
    if (goo.width !== w || goo.height !== h) {
      goo.width = w;
      goo.height = h;
    } else gg.clearRect(0, 0, w, h);
    gg.filter = "blur(" + blur.toFixed(2) + "px)";
    gg.drawImage(src, 0, BAND, w, bh, 0, BAND, w, bh);
    gg.filter = "none";
    var im = gg.getImageData(0, BAND, w, bh), d = im.data;
    for (i = 3; i < d.length; i += 4) {
      var a = (d[i] - 112) * 8;
      d[i] = a < 0 ? 0 : a > 255 ? 255 : a;
    }
    gg.putImageData(im, 0, BAND);
    INKMAP.d = d;
    INKMAP.w = w;
    INKMAP.h = h;
    INKMAP.band = BAND;
    INKMAP.bh = bh;
    return goo;
  }
  function init(cv) {
    var h1 = cv.parentNode, block = h1.parentNode;
    var scratch = {
      a: document.createElement("canvas"),
      b: document.createElement("canvas"),
      c: document.createElement("canvas")
    };
    var still = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    var phone = window.matchMedia("(max-width:768px)");
    var o = {
      r: NAME_R,
      bulge: NAME_BULGE,
      track: TRACK,
      space: SPACE,
      lead: LEAD
    };
    var c = {
      r: o.r,
      wob: UNIT.wob,
      goo: UNIT.goo,
      bulge: o.bulge,
      f1: CFG.f1,
      f2: CFG.f2,
      term: CFG.term,
      pinch: CFG.pinch
    };
    var BUDGET = parseFloat((location.search.match(/[?&]liquidbudget=([0-9]+)/) || [])[1]) || 3e5;
    var w = 0, h = 0, lay = null, fx = null, visible = true, last = 0, dpr = 1, sdpr = 1;
    var stat = {
      n: 0,
      ms: 0,
      peak: 0
    };
    var grain = null, SMEAR_VH = .45, SMEAR_RATE = 1, smear = 0, dirty = false, q = 1, text = "", Wcss = 0, Hcss = 0, headCss = 0, inkCss = 0;
    var forcedSmear = (location.search.match(/[?&]liquidsmear=([0-9.]+)/) || [])[1];
    var touchPhone = phone.matches && !window.matchMedia("(hover:hover) and (pointer:fine)").matches;
    if (touchPhone && forcedSmear === undefined) forcedSmear = "0";
    if (forcedSmear !== undefined) smear = Math.max(0, Math.min(1, parseFloat(forcedSmear)));
    var exitNow = 0, forcedExit = (location.search.match(/[?&]liquidexit=([0-9.]+)/) || [])[1];
    if (forcedExit !== undefined) exitNow = Math.max(0, Math.min(1, parseFloat(forcedExit)));
    if (forcedSmear !== undefined) liftP = smear;
    if (forcedExit !== undefined) liftP = 1 + exitNow * .4;
    var base = 0, extra = 0, vel = 0, prevY = null, prevT = 0, KICK_MAX = .4, KICK_V = 1.6, KICK_UP = 60, KICK_DOWN = 420;
    function onScroll() {
      if (forcedSmear !== undefined) return;
      var y = window.scrollY || 0, pf = headCss ? y * SMEAR_RATE / headCss : 0;
      pf = Math.max(0, Math.min(1, pf));
      if (pf !== base) {
        base = pf;
        dirty = true;
      }
      if (forcedExit === undefined) {
        var lp = (headCss ? y * SMEAR_RATE / headCss : 0) + extra;
        if (lp !== liftP) {
          if (lp > SNAP_AT || liftP > SNAP_AT) dirty = true;
          liftP = lp;
        }
      }
      if (forcedExit !== undefined || !RESOLVE) return;
      var ef = headCss ? (y - headCss * EXIT_FROM) / (window.innerHeight * EXIT_VH) : 0;
      ef = Math.max(0, Math.min(1, ef));
      if (ef !== exitNow) {
        exitNow = ef;
        dirty = true;
      }
    }
    function kick(t) {
      if (forcedSmear !== undefined) return false;
      var y = window.scrollY || 0, dt = prevY === null ? 0 : t - prevT, v = 0;
      if (dt > 0 && dt < 200) v = Math.abs(y - prevY) / dt;
      prevY = y;
      prevT = t;
      if (!dt || dt >= 200) dt = 16;
      vel += (v - vel) * (1 - Math.exp(-dt / 40));
      var want = KICK_MAX * (1 - Math.exp(-vel / KICK_V));
      extra += (want - extra) * (1 - Math.exp(-dt / (want > extra ? KICK_UP : KICK_DOWN)));
      if (extra < .002 && want < .002) extra = 0;
      var s = Math.min(1, base + extra), moved = s !== smear;
      smear = s;
      if (forcedExit === undefined) {
        var lp = (headCss ? y * SMEAR_RATE / headCss : 0) + extra;
        if (lp !== liftP) {
          liftP = lp;
          moved = true;
        }
      }
      if (moved && extra) window.dispatchEvent(new Event("liquidsmear"));
      return extra > 0 || vel > .01;
    }
    function size() {
      var vw = document.documentElement.clientWidth, W = Math.min(h1.offsetWidth, vw * .96);
      if (!W) {
        w = h = 0;
        return;
      }
      text = phone.matches ? "MAURICE|MOYNIHAN" : "MAURICE MOYNIHAN";
      o.head = 0;
      headCss = Math.round(window.innerHeight * SMEAR_VH);
      o.head = headCss / layout(text, W, o).H;
      var probe = layout(text, W, o);
      Wcss = W;
      Hcss = probe.height;
      inkCss = Hcss - headCss;
      dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(BUDGET / (W * inkCss)));
      sdpr = Math.min(window.devicePixelRatio || 1, 2);
      q = 0;
      fit();
      cv.width = Math.round(W * sdpr);
      cv.height = Math.round(Hcss * sdpr);
      cv.style.width = W + "px";
      cv.style.height = Hcss + "px";
      cv.style.top = "calc(50% - " + (headCss / 2).toFixed(1) + "px)";
      cv.dataset.inkTop = (headCss / Hcss).toFixed(4);
      grain = still || !GRAIN ? null : makeGrain(cv.width, probe.cap * sdpr, probe.H * sdpr);
    }
    function fit() {
      var nq = smear > 0 ? Q_MIN : 1;
      if (nq === q) return;
      q = nq;
      w = Math.round(Wcss * dpr * q);
      h = Math.round(Hcss * dpr * q);
      lay = layout(text, w, o);
      lay.drip = headCss * dpr * q;
      if (fx) {
        fx = null;
      }
    }
    function wake() {
      if (fx) return fx;
      var N = lay.N, f32 = function() {
        return new Float32Array(N);
      };
      fx = {
        ox: f32(),
        oy: f32(),
        vx: f32(),
        vy: f32(),
        ax: f32(),
        ay: f32(),
        bx: f32(),
        by: f32(),
        br: f32(),
        nr: f32(),
        cx: -1e4,
        cy: -1e4,
        dx: 0,
        dy: 0,
        on: false,
        mo: 0,
        mv: 0,
        seen: 0,
        reach: PHY.reach * lay.H / REF_H,
        push: PHY.push * lay.H / REF_H
      };
      return fx;
    }
    function paint(p) {
      if (!w || !h || !lay) return;
      var t0 = performance.now(), g = cv.getContext("2d"), W = cv.width, H = cv.height;
      fit();
      var mask = buildMask(w, h, lay, c, p, scratch, fx, smear, exitNow), k = H / h;
      g.clearRect(0, 0, W, H);
      g.imageSmoothingEnabled = true;
      g.imageSmoothingQuality = "high";
      g.drawImage(mask, 0, BAND, w, BEND - BAND, 0, BAND * k, W, (BEND - BAND) * k);
      g.globalCompositeOperation = "source-in";
      g.fillStyle = INK;
      g.fillRect(0, 0, W, H);
      if (grain && smear > 0) {
        g.globalCompositeOperation = "source-atop";
        g.drawImage(grain, 0, 0);
      }
      g.globalCompositeOperation = "source-over";
      var ms = performance.now() - t0;
      stat.n++;
      stat.ms += ms;
      if (ms > stat.peak) stat.peak = ms;
    }
    size();
    if (!w) {
      return false;
    }
    paint(0);
    document.documentElement.classList.add("liquid-live");
    var bench = parseInt((location.search.match(/[?&]liquidbench=([0-9]+)/) || [])[1] || 0, 10);
    var dbg = /[?&]liquiddebug=1/.test(location.search);
    if (bench || dbg) {
      var tag = document.createElement("div");
      tag.id = "liquid-debug";
      tag.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:9999;font:11px monospace;background:#161511;color:#EFEDE6;padding:4px 7px;white-space:pre";
      var rc = cv.getBoundingClientRect(), rh = h1.getBoundingClientRect(), txt = "";
      if (bench) {
        var i, fr = [];
        for (i = 0; i < 4; i++) paint(i / bench);
        for (i = 0; i < bench; i++) {
          var a = performance.now();
          paint(i / bench);
          fr.push(performance.now() - a);
        }
        fr.sort(function(x, y) {
          return x - y;
        });
        txt = "LIQUID " + w + "x" + h + " mask, band " + (BEND - BAND) + " rows (" + (w * (BEND - BAND) / 1e6).toFixed(2) + " Mpx) dpr " + dpr.toFixed(2) + "x q " + q.toFixed(2) + " of " + (window.devicePixelRatio || 1) + " smear " + smear.toFixed(2) + " exit " + exitNow.toFixed(2) + " | " + lay.N + " circles | frame median " + fr[bench >> 1].toFixed(1) + "ms p90 " + fr[Math.floor(bench * .9)].toFixed(1) + "ms";
      }
      txt += "\ncanvas " + [ rc.left, rc.top, rc.width, rc.height ].map(Math.round).join(",") + " h1 " + [ rh.left, rh.top, rh.width, rh.height ].map(Math.round).join(",") + " clientWidth " + document.documentElement.clientWidth;
      tag.textContent = txt;
      document.body.appendChild(tag);
      document.title = txt;
    }
    var forced = (location.search.match(/[?&]liquidphase=([0-9.]+)/) || [])[1];
    if (forced !== undefined) {
      paint(parseFloat(forced));
      return true;
    }
    if (still) return true;
    var io = window.IntersectionObserver ? new IntersectionObserver(function(e) {
      visible = e[0].isIntersecting;
    }) : null;
    if (io) io.observe(cv);
    function poke(x, y) {
      if (!lay) return;
      var r = cv.getBoundingClientRect();
      if (!r.width) return;
      var m = r.height * .5;
      if (x < r.left - m || x > r.right + m || y < r.top - m || y > r.bottom + m) {
        if (fx) fx.seen = 0;
        return;
      }
      var f = wake(), sx = w / r.width, sy = h / r.height;
      var nx = (x - r.left) * sx, ny = (y - r.top) * sy;
      f.dx = f.seen ? nx - f.cx : 0;
      f.dy = f.seen ? ny - f.cy : 0;
      f.cx = nx;
      f.cy = ny;
      f.on = true;
      f.seen = 1;
    }
    if (window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
      document.addEventListener("pointermove", function(e) {
        poke(e.clientX, e.clientY);
      }, {
        passive: true
      });
      document.addEventListener("pointerleave", function() {
        if (fx) fx.seen = 0;
      }, {
        passive: true
      });
    }
    if ("ontouchstart" in window) {
      var tp = function(e) {
        var t = e.touches[0];
        if (t) poke(t.clientX, t.clientY);
      };
      document.addEventListener("touchstart", function(e) {
        if (fx) fx.seen = 0;
        tp(e);
      }, {
        passive: true
      });
      document.addEventListener("touchmove", tp, {
        passive: true
      });
      document.addEventListener("touchend", function() {
        if (fx) fx.seen = 0;
      }, {
        passive: true
      });
      document.addEventListener("touchcancel", function() {
        if (fx) fx.seen = 0;
      }, {
        passive: true
      });
    }
    document.addEventListener("visibilitychange", function() {
      if (!document.hidden) last = 0;
    });
    var rt = 0;
    function resize() {
      clearTimeout(rt);
      rt = setTimeout(function() {
        size();
        paint(performance.now() % PERIOD / PERIOD);
      }, 80);
    }
    addEventListener("resize", resize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(h1);
    }
    addEventListener("scroll", onScroll, {
      passive: true
    });
    onScroll();
    (function loop(t) {
      requestAnimationFrame(loop);
      if (document.hidden || !visible) return;
      var live = !!(fx && fx.on) || dirty || extra > 0;
      if (t - last < 1e3 / (live ? FPS_LIVE : FPS)) return;
      last = t;
      dirty = false;
      kick(t);
      var p = t % PERIOD / PERIOD;
      if (fx && fx.on) {
        if (!fx.seen) {
          fx.dx *= .8;
          fx.dy *= .8;
          fx.cx = -1e4;
          fx.cy = -1e4;
        }
        fx.mo = 0;
        fx.mv = 0;
        paint(p);
        if (!fx.seen && Math.sqrt(fx.mo) < PHY.still && Math.sqrt(fx.mv) < PHY.slow) {
          fx.on = false;
          fx.ox.fill(0);
          fx.oy.fill(0);
          fx.vx.fill(0);
          fx.vy.fill(0);
          paint(p);
        }
      } else paint(p);
    })(0);
    window.LiquidName = {
      stats: function() {
        return {
          frames: stat.n,
          avg: stat.n ? stat.ms / stat.n : 0,
          peak: stat.peak,
          dpr: dpr,
          buffer: w + "x" + h,
          reset: function() {
            stat.n = 0;
            stat.ms = 0;
            stat.peak = 0;
          }
        };
      },
      dpr: function() {
        return dpr;
      },
      smear: function() {
        return smear;
      },
      exit: function() {
        return exitNow;
      },
      inkAt: function(x, y) {
        var m = INKMAP;
        if (!m.d) return 0;
        var r = cv.getBoundingClientRect();
        if (x < r.left || x >= r.right || y < r.top || y >= r.bottom) return 0;
        var mx = Math.floor((x - r.left) * m.w / r.width), my = Math.floor((y - r.top) * m.h / r.height) - m.band;
        if (my < 0 || my >= m.bh || mx < 0 || mx >= m.w) return 0;
        return m.d[(my * m.w + mx) * 4 + 3] / 255;
      }
    };
    return true;
  }
  function boot() {
    var cv = document.querySelector("canvas.hero__liquid");
    if (cv && cv.getContext) init(cv);
  }
  if (typeof window !== "undefined") window.LiquidCore = {
    GL: GL,
    MW: MW,
    UNIT: UNIT,
    CFG: CFG,
    PHY: PHY,
    DENS: DENS,
    REF_H: REF_H,
    REF_W: REF_W,
    polylen: polylen,
    layout: layout,
    buildMask: buildMask,
    shape: shape,
    arc: arc,
    S: S,
    name: {
      r: NAME_R,
      bulge: NAME_BULGE,
      track: TRACK,
      space: SPACE,
      lead: LEAD,
      seedstep: SEEDSTEP
    }
  };
  if (typeof document === "undefined") return;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
