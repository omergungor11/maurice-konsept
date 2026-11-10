(function() {
  "use strict";
  var cv = document.getElementById("deep");
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext("2d");
  var still = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  var LURE = {
    x: .1204,
    y: .1761
  }, LURE_R = .09;
  var MOUTH = {
    x: .17,
    y: .58
  };
  var img = new Image, ready = false;
  var W = 0, H = 0, dpr = 1, fw = 0, fh = 0;
  var fish = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    dir: 1,
    dirFrom: 1,
    P: 1,
    turnDur: 1400,
    lastTurn: -1e4,
    side: -1,
    phase: 0,
    beat: .7,
    tx: 0,
    ty: 0,
    next: 0
  };
  var JAW = [ [ 70, 245 ], [ 120, 249 ], [ 170, 261 ], [ 214, 278 ], [ 238, 300 ], [ 244, 338 ], [ 200, 350 ], [ 140, 336 ], [ 96, 316 ], [ 71, 290 ] ];
  var JAW_FRONT = [ [ 60, 240 ], [ 120, 249 ], [ 168, 260 ], [ 168, 332 ], [ 140, 340 ], [ 96, 320 ], [ 60, 292 ] ];
  var HINGE = [ 216, 284 ], JAW_DEG = 22, jawPics = [], jaw = 0, jawTo = 0, posed = false;
  var light = 1, lightTo = 1;
  var seen = 1;
  var ptr = {
    x: -1e4,
    y: -1e4,
    in: false,
    still: 0,
    lx: 0,
    ly: 0,
    speed: 0,
    t: 0
  };
  var noteP = {
    x: 0,
    y: 0,
    dead: false,
    landed: false,
    r: 0
  }, lungeNote = false;
  var mode = "wander", modeT = 0, lungeFrom = null, onLure = 0, biteAgain = 0, stalk = 0;
  var running = false, last = 0, visible = false;
  var jready = false, jellies = [], jl = 1;
  var TINTS = [ null, "#8d55ff", "#ff5aa8" ];
  function PL() {
    return window.mmPerf && window.mmPerf.level || 0;
  }
  function NS(n) {
    return still ? 1 : PL() >= 2 ? Math.max(6, Math.round(n / 3)) : n;
  }
  addEventListener("mmperf", function() {
    size();
  });
  function size() {
    var r = cv.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, [ 1.5, 1, 1, .75 ][PL()]);
    W = r.width;
    H = r.height;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    fw = Math.max(135, Math.min(W * .2, 280));
    fh = fw * (img.naturalHeight / img.naturalWidth || .669);
    if (ready && !fish.x) {
      fish.x = W * .72;
      fish.y = H * .55;
      pickSpot();
    }
    if (jready && !cast) makeCast();
    if (!running) draw(performance.now());
  }
  function rnd(a, b) {
    return a + Math.random() * (b - a);
  }
  function pickSpot() {
    fish.tx = rnd(fw * .6, W - fw * .6);
    fish.ty = rnd(H * .3, H * .8);
    fish.next = performance.now() + rnd(5e3, 11e3);
  }
  function cOf(u) {
    if (fish.P >= 1) return fish.dir;
    var L = 0, p = Math.max(0, Math.min(1, (fish.P - u * L) / (1 - L))), e = p * p * (3 - 2 * p);
    return fish.dirFrom * Math.cos(Math.PI * e);
  }
  function lift() {
    return fish.P < 1 ? -Math.sin(Math.PI * fish.P) * fh * .09 : 0;
  }
  function turnTo(d, dur, now, cool) {
    if (d === fish.dir || fish.P < 1) return;
    if (now - fish.lastTurn < cool) return;
    fish.dirFrom = fish.dir;
    fish.dir = d;
    fish.P = 0;
    fish.turnDur = dur;
    fish.lastTurn = now;
    fish.swish = 1;
    fish.beat += 1.2;
  }
  function chainAt(u) {
    var n = 30, a = 0, b = 0, i, c;
    for (i = 0; i < n; i++) {
      c = cOf((i + .5) / n) * fw / n;
      if ((i + .5) / n < u) a += c;
      b += c;
    }
    return a - b / 2;
  }
  function at(p) {
    return {
      x: fish.x + chainAt(p.x),
      y: fish.y + (p.y - .5) * fh + lift()
    };
  }
  function makeJaw() {
    var iw = img.naturalWidth, ih = img.naturalHeight, k = iw / 600, body = tinted(img, null, 0);
    function path(x) {
      x.beginPath();
      JAW.forEach(function(p, i) {
        x[i ? "lineTo" : "moveTo"](p[0] * k, p[1] * k);
      });
      x.closePath();
    }
    for (var f = 0; f < 5; f++) {
      var o = document.createElement("canvas");
      o.width = iw;
      o.height = ih;
      var x = o.getContext("2d");
      x.drawImage(body, 0, 0);
      if (f) {
        x.save();
        path(x);
        x.clip();
        x.globalCompositeOperation = "source-atop";
        x.fillStyle = "#070b1c";
        x.fillRect(0, 0, iw, ih);
        x.restore();
        x.save();
        x.beginPath();
        JAW_FRONT.forEach(function(p, i) {
          x[i ? "lineTo" : "moveTo"](p[0] * k, p[1] * k);
        });
        x.closePath();
        x.clip();
        x.clearRect(0, 0, iw, ih);
        x.restore();
        x.save();
        x.translate(HINGE[0] * k, HINGE[1] * k);
        x.rotate(JAW_DEG * f / 4 * Math.PI / 180);
        x.translate(-HINGE[0] * k, -HINGE[1] * k);
        path(x);
        x.clip();
        x.drawImage(body, 0, 0);
        x.restore();
      }
      jawPics.push(o);
    }
  }
  var layer = null;
  function fishLayer() {
    if (!layer) layer = document.createElement("canvas").getContext("2d");
    var w = Math.ceil(fw * 1.8 * dpr), h = Math.ceil(fh * 2 * dpr);
    if (layer.canvas.width !== w || layer.canvas.height !== h) {
      layer.canvas.width = w;
      layer.canvas.height = h;
    }
    return layer;
  }
  var gloveEl = null, gloveTimer = 0, bites = 0, T = function(n) {
    if (window.mmTrack) window.mmTrack(n);
  };
  function gloveHidden(h) {
    gloveEl = gloveEl || document.getElementById("glove");
    if (gloveEl) gloveEl.style.opacity = h ? "0" : "";
    clearTimeout(gloveTimer);
    if (h) gloveTimer = setTimeout(letGo, 3600);
  }
  function letGo() {
    if (gulp.snack) {
      jawTo = 0;
      gulp.snack = 0;
    }
    if (jawTo === 1) spit(performance.now(), visible);
    gloveHidden(false);
    if (mode === "lunge" || mode === "dark" || mode === "retreat") {
      mode = "wander";
      modeT = performance.now();
    }
  }
  function local(e) {
    var r = cv.getBoundingClientRect();
    return {
      x: e.clientX - r.left,
      y: e.clientY - r.top,
      inside: e.clientY >= r.top && e.clientY <= r.bottom
    };
  }
  function move(e) {
    var p = local(e), now = performance.now(), dt = Math.max(16, now - ptr.t);
    ptr.speed = Math.hypot(p.x - ptr.x, p.y - ptr.y) / dt * 1e3;
    if (Math.hypot(p.x - ptr.lx, p.y - ptr.ly) > 14) {
      ptr.still = now;
      ptr.lx = p.x;
      ptr.ly = p.y;
    }
    ptr.x = p.x;
    ptr.y = p.y;
    ptr.in = p.inside;
    ptr.t = now;
  }
  addEventListener("pointermove", function(e) {
    if (e.pointerType !== "touch") move(e);
  }, {
    passive: true
  });
  addEventListener("pointerdown", function(e) {
    if (e.pointerType !== "touch") {
      move(e);
      poke();
    }
  }, {
    passive: true
  });
  document.addEventListener("pointerleave", function() {
    ptr.in = false;
  });
  var upTimer = 0;
  function touchAt(e, start) {
    var t = e.touches[0];
    if (!t) return;
    if (start) {
      var p = local(t);
      ptr.x = ptr.lx = p.x;
      ptr.y = ptr.ly = p.y;
      ptr.t = performance.now();
    }
    move(t);
    clearTimeout(upTimer);
    if (start && ptr.in) {
      poke();
      ripples.push({
        x: ptr.x,
        y: ptr.y,
        t: performance.now()
      });
    }
  }
  cv.addEventListener("contextmenu", function(e) {
    e.preventDefault();
  });
  addEventListener("touchstart", function(e) {
    touchAt(e, true);
  }, {
    passive: true
  });
  addEventListener("touchmove", function(e) {
    touchAt(e, false);
  }, {
    passive: true
  });
  addEventListener("touchend", function(e) {
    if (!e.touches.length) upTimer = setTimeout(function() {
      ptr.in = false;
    }, 600);
  }, {
    passive: true
  });
  var ripples = [];
  function poke() {
    if (!ptr.in) return;
    var now = performance.now(), hit = false;
    if (ready && (mode === "wander" || mode === "lure") && now > biteAgain && fish.P >= 1 && !bites) {
      var l = at(LURE);
      if (Math.hypot(ptr.x - l.x, ptr.y - l.y) < Math.max(34, fw * .25)) {
        onLure = 0;
        stalk = 0;
        sputterUntil = now + 700;
        setMode("dark", now);
        return;
      }
    }
    if (ready && Math.abs(ptr.x - fish.x) < fw * .48 && Math.abs(ptr.y - fish.y) < fh * .45) {
      hit = true;
      pokeAngler(now);
      return;
    }
    jellies.forEach(function(j) {
      var cx = j.x, cy = j.y + j.h * .3, d = Math.hypot(cx - ptr.x, cy - ptr.y) || 1;
      if (d < Math.max(40, j.w * .9)) {
        hit = true;
        puffBubbles(cx, cy, rnd(3, 6) | 0, (cx - ptr.x) / d * -30, -20);
        j.boost = 1;
        j.vx += (cx - ptr.x) / d * j.w * 1.6;
        j.vy += (cy - ptr.y) / d * j.w * 1.2 - j.w * .3;
        j.ph = 0;
      }
    });
    swimmers.forEach(function(m) {
      if (Math.hypot(m.x - ptr.x, m.y - ptr.y) < Math.max(50, m.w * .6)) {
        hit = true;
        spook(m, now);
      }
    });
    worms.forEach(function(w) {
      var r = wormRect(w);
      if (r && Math.hypot(ptr.x - (w.flip ? 2 * r.bx - r.mx : r.mx), ptr.y - r.my) < Math.max(60, r.h * .7)) {
        hit = true;
        hideWorm(w, now, 0);
      }
    });
    if (ptr.y > groundY() - 30) {
      hit = true;
      kickSilt(ptr.x, Math.max(ptr.y, groundY() - 10), 22, 110);
    }
    if (school) school.fish.forEach(function(f) {
      var d = Math.hypot(f.x - ptr.x, f.y - ptr.y) || 1;
      if (d < 120) {
        if (d < 50) hit = true;
        if (Math.random() < .5) puffBubbles(f.x, f.y, 2, 0, -15);
        f.vx += (f.x - ptr.x) / d * 260;
        f.vy += (f.y - ptr.y) / d * 200;
        f.beat = 4;
      }
    });
    if (ptr.y < groundY() - 20) dropThing(ptr.x, ptr.y, now);
  }
  function setMode(m, now) {
    mode = m;
    modeT = now;
  }
  function step(now, dt) {
    var s = dt / 1e3, l = at(LURE), d = Math.hypot(ptr.x - l.x, ptr.y - l.y);
    var near = ptr.in && Math.hypot(ptr.x - fish.x, ptr.y - fish.y) < fw * .7;
    function nextFlake(R) {
      var fm = at(MOUTH), best = null, bd = R;
      food.forEach(function(f) {
        if (!f.dead && !f.landed) {
          var dd = Math.hypot(f.x - fm.x, f.y - fm.y) + ((f.x - fish.x) * fish.dir > 0 ? fw * .6 : 0);
          if (dd < bd) {
            bd = dd;
            best = f;
          }
        }
      });
      return best;
    }
    var FN = window.mmFreeNote;
    if (FN && FN.live && !FN.dead && ready) {
      var fcr = cv.getBoundingClientRect();
      noteP.x = FN.sx - fcr.left;
      noteP.y = FN.sy - fcr.top;
      noteP.r = fw * .12;
      if (mode === "wander" || mode === "lure") {
        setMode("snack", now);
        fish.prey = noteP;
      }
    }
    if (mode === "snack") {
      var pr = fish.prey, mo = at(MOUTH);
      if (gulp.snack) {
        fish.vx *= .9;
        fish.vy *= .9;
        if (now - gulp.snack > 380) {
          jawTo = 0;
          gulp.snack = 0;
          var nx = nextFlake(fw * 3);
          if (nx) {
            fish.prey = nx;
            modeT = now;
          } else {
            fish.feedUntil = now + 1200;
            setMode("wander", now);
            pickSpot();
          }
        }
      } else if (!pr || pr.dead || pr.landed || now - modeT > 4e3) {
        var nx2 = nextFlake(fw * 3);
        if (nx2 && now - modeT <= 4e3) {
          fish.prey = nx2;
        } else {
          fish.feedUntil = now + 1200;
          setMode("wander", now);
          pickSpot();
        }
      } else {
        fish.tx = fish.x + (pr.x - mo.x);
        fish.ty = fish.y + (pr.y - mo.y);
        if (pr === noteP && fish.P >= 1 && Math.hypot(pr.x - mo.x, pr.y - mo.y) < fw * .85) {
          lungeNote = true;
          onLure = 0;
          stalk = 0;
          sputterUntil = now + 600;
          setMode("dark", now);
          return;
        }
        if (Math.abs(pr.x - fish.x) > fw * .5) turnTo(pr.x < fish.x ? 1 : -1, 150, now, 700);
        if (Math.hypot(pr.x - mo.x, pr.y - mo.y) < Math.max(16, fw * .08, pr.r || 0)) {
          pr.dead = true;
          if (pr === noteP && FN) {
            FN.dead = true;
            gulp.thump = 1;
            for (var nb = 0; nb < 14; nb++) mouthBubble(nb < 3 ? rnd(5, 10) : rnd(2, 5), 1);
          }
          jawTo = 1;
          gulp.snack = now;
          fedOnce();
          for (var q = 0; q < 3; q++) mouthBubble(rnd(2, 4), .25);
        }
      }
    }
    if (mode === "wander" || mode === "lure") {
      if (mode === "wander" && near && ptr.speed > 2600 && now - ptr.t < 80) {
        setMode("flee", now);
        var a = Math.atan2(fish.y - ptr.y, fish.x - ptr.x);
        fish.tx = Math.max(fw * .5, Math.min(W - fw * .5, fish.x + Math.cos(a) * W * .45));
        fish.ty = Math.max(fh * .4, Math.min(H - fh * .4, fish.y + Math.sin(a) * H * .3));
      } else if (ptr.in && now > biteAgain && !bites && now > (fish.feedUntil || 0)) {
        if (mode !== "lure") {
          setMode("lure", now);
          fish.side = ptr.x < fish.x ? -1 : 1;
          stalk = 0;
        }
        if (ptr.x < fish.x - fw * .35) fish.side = -1; else if (ptr.x > fish.x + fw * .35) fish.side = 1;
        var side = fish.side;
        fish.tx = ptr.x - (LURE.x - .5) * fw * -side - side * fw * .1;
        fish.ty = ptr.y - (LURE.y - .5) * fh + fh * .1;
      } else if (mode === "lure") {
        setMode("wander", now);
        pickSpot();
      } else if (now > fish.next) pickSpot();
      var mo = at(MOUTH), dm = Math.hypot(ptr.x - mo.x, ptr.y - mo.y), close = dm < fw * .42;
      if (ptr.in && d < Math.max(26, fw * .17)) {
        onLure += dt;
      } else onLure = Math.max(0, onLure - dt * 2);
      if (mode === "lure" && close) stalk += dt; else stalk = Math.max(0, stalk - dt);
      if (fish.P >= 1 && now > biteAgain && !bites && close && (onLure > 110 || stalk > 900)) {
        onLure = 0;
        stalk = 0;
        sputterUntil = now + 700;
        setMode("dark", now);
      }
    }
    if (mode === "dark") {
      fish.vx = fish.vy = 0;
      var LT = lungeNote ? noteP : ptr, cm = at(MOUTH), cx = cm.x - LT.x, cy = cm.y - LT.y, cd = Math.hypot(cx, cy) || 1, ck = Math.min(1, (now - modeT) / 320) * dt / 1e3 * 30;
      fish.x += cx / cd * ck;
      fish.y += cy / cd * ck;
    }
    if (mode === "dark" && now - modeT > 320) {
      setMode("lunge", now);
      var m = at(MOUTH);
      lungeFrom = {
        x: fish.x,
        y: fish.y
      };
      var LT2 = lungeNote ? noteP : ptr;
      fish.tx = fish.x + (LT2.x - m.x);
      fish.ty = fish.y + (LT2.y - m.y);
    }
    if (mode === "lunge") {
      var k = Math.min(1, (now - modeT) / 110), e = 1 - Math.pow(1 - k, 3);
      fish.x = lungeFrom.x + (fish.tx - lungeFrom.x) * e;
      fish.y = lungeFrom.y + (fish.ty - lungeFrom.y) * e;
      fish.vx = fish.vy = 0;
      fish.beat = 3;
      seen = 1;
      if (lungeNote) {
        if (now - modeT > 90 && jawTo !== 1) {
          jawTo = 1;
          noteP.dead = true;
          var FN2 = window.mmFreeNote;
          if (FN2) FN2.dead = true;
          gulp.thump = 1;
          gulp.ang = rnd(0, 6.28);
          for (var nb2 = 0; nb2 < 30; nb2++) mouthBubble(nb2 < 5 ? rnd(7, 13) : rnd(2, 6), 1.8);
        }
        if (now - modeT > 480 && jawTo === 1) {
          jawTo = 0;
          gulp.recoil = 1;
          for (var nb3 = 0; nb3 < 8; nb3++) mouthBubble(rnd(2, 5), .8);
        }
        if (now - modeT > 800) {
          lungeNote = false;
          setMode("wander", now);
          pickSpot();
          fish.feedUntil = now + 2500;
        }
        return;
      }
      if (now - modeT > 90 && jawTo !== 1) {
        jawTo = 1;
        gloveHidden(true);
        if (!bites++) T("angler_bite");
        for (var bb = 0; bb < 16; bb++) mouthBubble(bb < 3 ? rnd(6, 11) : rnd(2, 5), 1.1);
      }
      if (now - modeT > 900) {
        setMode("retreat", now);
        fish.next = now + 8e3;
        fish.tx = Math.max(fw * .6, Math.min(W - fw * .6, fish.x - fish.dir * W * .3));
        fish.ty = Math.max(H * .25, Math.min(H * .8, fish.y + rnd(-60, 60)));
      }
      return;
    }
    if (mode === "dark") return;
    if (fish.P < 1 && !posed) fish.P = Math.min(1, fish.P + dt / fish.turnDur);
    if (fish.swish) fish.swish = Math.max(0, fish.swish - dt / 520);
    if (mode === "retreat" && jawTo === 1 && now - modeT > 2600) spit(now, true);
    if (jawTo === 1 && (mode === "lunge" && now - modeT > 300 || mode === "retreat") && now > gulp.next) {
      gulp.next = now + rnd(200, 520);
      gulp.thump = 1;
      gulp.ang = rnd(0, 6.28);
      for (var b = 0, nb = Math.random() < .6 ? 1 : 2; b < nb; b++) mouthBubble(rnd(3, 6), .3);
    }
    gulp.thump = Math.max(0, gulp.thump - dt / 150);
    gulp.recoil = Math.max(0, gulp.recoil - dt / 520);
    var fsp = Math.hypot(fish.vx, fish.vy);
    if (!still && fsp > 90 && Math.random() < (fsp - 90) / 110 * dt / 1e3 * 7) {
      var gl = at({
        x: .42,
        y: .42
      });
      mbub.push({
        x: gl.x + rnd(-4, 4),
        y: gl.y + rnd(-6, 6),
        vx: fish.vx * .15,
        vy: rnd(-30, -10),
        r: rnd(1.4, 3.2),
        t: now,
        life: rnd(900, 1500),
        ph: rnd(0, 6)
      });
    }
    if (mode === "retreat" && now - modeT > 3400) setMode("wander", now);
    if (mode === "flee" && now - modeT > 1800) setMode("wander", now);
    if (mode === "hide") {
      if (Math.hypot(fish.tx - fish.x, fish.ty - fish.y) < fw * .25) {
        if (!fish.hidT) fish.hidT = now;
        if (now - fish.hidT > 500) turnTo(fish.hideSide, 300, now, 0);
      }
      if (now > fish.hideUntil) {
        setMode("wander", now);
        fish.tx = fish.hideSide > 0 ? W - fw * .9 : fw * .9;
        fish.ty = rnd(H * .4, H * .65);
        fish.next = now + rnd(6e3, 9e3);
      }
    }
    var max = mode === "hide" ? fish.hidT ? 40 : 330 : mode === "flee" ? 360 : mode === "lure" ? 175 : mode === "snack" ? 210 : mode === "retreat" ? 115 : 26;
    var acc = mode === "hide" ? 900 : mode === "flee" ? 1e3 : mode === "lure" ? 340 : mode === "snack" ? 520 : mode === "retreat" ? 200 : 30;
    var dx = fish.tx - fish.x, dy = fish.ty - fish.y, dist = Math.hypot(dx, dy) || 1;
    var brake = Math.min(1, dist / (fw * .35));
    if (mode === "lure") turnTo(-fish.side, 110, now, 650); else if (Math.abs(dx) > fw * .5 && !(mode === "hide" && fish.hidT)) turnTo(dx < 0 ? 1 : -1, mode === "flee" || mode === "hide" ? 90 : 150, now, mode === "flee" || mode === "hide" ? 0 : 3200);
    var ahead = fish.P >= 1 && (dx * fish.dir < 0 || Math.abs(dx) < fw * .15);
    if (ahead) fish.vx += dx / dist * acc * s; else if (mode === "lure" && fish.P >= 1) fish.vx += dx / dist * acc * s * .35; else fish.vx *= Math.pow(.2, s);
    fish.vy += dy / dist * acc * s * .6;
    var sp = Math.hypot(fish.vx, fish.vy), cap = max * brake + 4;
    if (sp > cap) {
      fish.vx *= cap / sp;
      fish.vy *= cap / sp;
    }
    fish.vx *= Math.pow(.6, s);
    fish.vy *= Math.pow(.5, s);
    fish.x += fish.vx * s;
    fish.y += fish.vy * s;
    sp = Math.hypot(fish.vx, fish.vy);
    var beatTo = .55 + sp / max * 1.6 + (mode === "flee" ? 1.5 : 0) + (fish.P < 1 ? 1.2 : 0);
    fish.beat += (beatTo - fish.beat) * Math.min(1, s * 3);
  }
  var KINDS = {
    jelly: {
      files: [ "jelly_a", "jelly_b", "jelly_c", "jelly_d" ],
      bell: .27,
      w: [ 56, 105 ],
      wp: [ 42, 66 ],
      tint: true
    },
    crown: {
      files: [ "crown_a" ],
      bell: .32,
      w: [ 62, 96 ],
      wp: [ 46, 64 ]
    },
    comb: {
      files: [ "comb_a" ],
      bell: .62,
      w: [ 46, 68 ],
      wp: [ 36, 50 ],
      sq: .03,
      per: [ 4, 5.5 ],
      shimmer: true
    },
    gsquid: {
      files: [ "glasssquid_a", "glasssquid_b" ],
      bell: .42,
      w: [ 58, 86 ],
      wp: [ 44, 60 ],
      per: [ 1.6, 2.2 ]
    },
    dumbo: {
      files: [ "dumbo_a" ],
      bell: .55,
      w: [ 62, 90 ],
      wp: [ 46, 64 ],
      sq: .08,
      per: [ 1.8, 2.4 ]
    },
    hatchet: {
      files: [ "hatchet_a", "hatchet_b", "hatchet_c" ],
      w: [ 44, 68 ],
      wp: [ 34, 50 ]
    },
    giant: {
      files: [ "squid_giant" ]
    },
    vamp: {
      files: [ "vamp_a" ],
      w: [ 70, 120 ],
      wp: [ 56, 80 ]
    },
    gulper: {
      files: [ "gulper_a" ],
      w: [ 130, 210 ],
      wp: [ 100, 140 ]
    },
    siph: {
      files: [ "siph_a" ],
      w: [ 200, 320 ],
      wp: [ 150, 210 ]
    },
    isopod: {
      files: [ "isopod_a" ]
    },
    set: {
      files: [ "sea_far", "sea_floor", "sea_fore_l", "sea_fore_r", "worm_tube", "worm_plume" ]
    },
    weed: {
      files: [ "weed_tall", "weed_low" ]
    },
    bone: {
      files: [ "junk_bone", "junk_bone_b" ]
    },
    sub: {
      files: [ "sub" ]
    },
    sign: {
      files: [ "junk_sign" ]
    },
    junk: {
      files: [ "junk_trolley", "junk_chest", "junk_moai", "junk_cone", "junk_portaloo", "junk_scooter", "junk_besser", "junk_phone" ]
    }
  };
  var DRIFTERS = [ "jelly", "crown", "comb", "gsquid", "dumbo" ];
  var CAST_DESK = {
    jelly: 3,
    crown: 1,
    comb: 1,
    gsquid: 1,
    dumbo: 1,
    hatchet: 5,
    vamp: 1,
    gulper: 1,
    siph: 1
  }, CAST_PHONE = {
    jelly: 1,
    crown: 1,
    comb: 1,
    gsquid: 0,
    dumbo: 1,
    hatchet: 3,
    vamp: 1,
    gulper: 0,
    siph: 1
  };
  var snow = [];
  var pics = {}, cast = false, school = null, giant = {
    on: false,
    next: 0
  };
  var DEEPV = "c43790de";
  function loadDeep(dir) {
    var n = 0, want = 0;
    Object.keys(KINDS).forEach(function(k) {
      KINDS[k].files.forEach(function(f) {
        want++;
        var im = new Image;
        im.onload = function() {
          pics[f] = im;
          if (++n === want) {
            jready = true;
            size();
            start();
          }
        };
        im.onerror = function() {
          if (++n === want) {
            jready = true;
            size();
            start();
          }
        };
        im.src = dir + f + ".webp?v=" + DEEPV;
      });
    });
  }
  function tinted(im, c, dark, grade) {
    var o = document.createElement("canvas");
    o.width = im.naturalWidth || im.width;
    o.height = im.naturalHeight || im.height;
    var x = o.getContext("2d");
    x.drawImage(im, 0, 0);
    if (c) {
      x.globalCompositeOperation = "hue";
      x.fillStyle = c;
      x.fillRect(0, 0, o.width, o.height);
      x.globalCompositeOperation = "destination-in";
      x.drawImage(im, 0, 0);
    }
    if (grade !== false && !off("grade")) return stageGrade(o, dark || 0);
    if (dark) {
      x.globalCompositeOperation = "source-atop";
      x.fillStyle = "rgba(22,21,17," + dark + ")";
      x.fillRect(0, 0, o.width, o.height);
    }
    return o;
  }
  var STAGE = [ .3, .46, .72 ];
  function stageGrade(o, dark) {
    var w = o.width, h = o.height, x = o.getContext("2d"), d = x.getImageData(0, 0, w, h), p = d.data, A = new Uint8Array(w * h);
    for (var i = 0; i < w * h; i++) A[i] = p[i * 4 + 3];
    var amt = .62 + .35 * dark, r = Math.max(2, Math.round(w / 110)), dx = Math.round(r * .6);
    for (var y = 0; y < h; y++) for (var X = 0; X < w; X++) {
      var k = y * w + X, q = k * 4, a = A[k];
      if (!a) continue;
      var R = p[q], G = p[q + 1], B = p[q + 2], lum = R * .3 + G * .59 + B * .11, mx = Math.max(R, G, B), mn = Math.min(R, G, B);
      var lit = Math.min(1, Math.max(0, (lum - 125) / 80)) * Math.min(1, Math.max(0, (mx - mn + 40) / 120));
      var g = amt * (1 - lit * (1 - .75 * dark));
      R = R * (1 - g) + R * STAGE[0] * (1 - dark * .6) * g;
      G = G * (1 - g) + G * STAGE[1] * (1 - dark * .6) * g;
      B = B * (1 - g) + Math.max(B, lum * .8) * STAGE[2] * (1 - dark * .5) * g;
      var up = y - r >= 0 ? A[(y - r) * w + Math.max(0, X - dx)] : 0, rim = a / 255 * (1 - up / 255) * (1 - dark * .7) * .7;
      p[q] = Math.min(255, R + 70 * rim);
      p[q + 1] = Math.min(255, G + 190 * rim);
      p[q + 2] = Math.min(255, B + 240 * rim);
    }
    x.putImageData(d, 0, 0);
    return o;
  }
  var KIND_TINT = {
    gsquid: "#2bb39c",
    hatchet: "#9cc4d8",
    gulper: "#8a52e0",
    siph: "#d6a648",
    vamp: "#c0385a",
    comb: "#4fd0e0"
  };
  function kindTint(c, kind) {
    var col = KIND_TINT[kind];
    if (!col || off("kindtint")) return c;
    var x = c.getContext("2d"), keep = document.createElement("canvas");
    keep.width = c.width;
    keep.height = c.height;
    keep.getContext("2d").drawImage(c, 0, 0);
    x.save();
    x.globalCompositeOperation = "color";
    x.globalAlpha = .42;
    x.fillStyle = col;
    x.fillRect(0, 0, c.width, c.height);
    x.globalAlpha = 1;
    x.globalCompositeOperation = "destination-in";
    x.drawImage(keep, 0, 0);
    x.restore();
    return c;
  }
  function separate(s) {
    var A = [], i, k;
    for (i = 0; i < jellies.length; i++) {
      var j = jellies[i];
      A.push({
        o: j,
        x: j.x,
        y: j.y + j.h * .35,
        r: j.w * .45,
        z: j.z,
        jelly: true
      });
    }
    for (i = 0; i < swimmers.length; i++) {
      var m = swimmers[i];
      A.push({
        o: m,
        x: m.x,
        y: m.y,
        r: m.w * .38,
        z: m.z
      });
    }
    for (i = 0; i < A.length; i++) for (k = i + 1; k < A.length; k++) {
      var a = A[i], b = A[k];
      if (Math.abs(a.z - b.z) > .3) continue;
      var dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, R = (a.r + b.r) * .9;
      if (d >= R) continue;
      var f = (1 - d / R) * 26 * s, ux = dx / d, uy = dy / d;
      push(a, -ux * f, -uy * f);
      push(b, ux * f, uy * f);
    }
    function push(p, fx, fy) {
      if (p.jelly) {
        p.o.vx += fx * 1.6;
        p.o.vy += fy * 1.2;
      } else {
        p.o.vx += fx * 1.2;
        p.o.vy += fy;
        p.o.ty += fy * .6;
      }
    }
  }
  function depthDark(z) {
    return .3 + .6 * (1 - z);
  }
  function depthSpeed(z) {
    return .5 + .5 * z;
  }
  function pick(kind, i) {
    var f = KINDS[kind].files;
    return pics[f[i % f.length]];
  }
  function makeCast() {
    cast = true;
    var small = W <= 700, plan = small ? CAST_PHONE : CAST_DESK, n = 0, total = 0;
    DRIFTERS.forEach(function(k) {
      total += plan[k];
    });
    DRIFTERS.forEach(function(kind) {
      var K = KINDS[kind];
      for (var i = 0; i < plan[kind]; i++, n++) {
        var im = pick(kind, i);
        if (!im) continue;
        var r = small ? K.wp : K.w, z = Math.random() * .5, w = r[0] + (r[1] - r[0]) * (.2 + z), dk = depthDark(z);
        var pic = kindTint(tinted(im, K.tint ? TINTS[(i + 1) % TINTS.length] : null, dk), kind);
        var rainbow = K.shimmer ? [ "#ff4040", "#ffc040", "#60ff80", "#40c0ff", "#8060ff", "#ff50c0" ].map(function(c) {
          return tinted(im, c, dk);
        }) : null;
        jellies.push({
          kind: kind,
          bell: K.bell,
          sq: K.sq || .12,
          pic: pic,
          rainbow: rainbow,
          w: w,
          h: w * im.naturalHeight / im.naturalWidth,
          x: W * (n + .5) / total + rnd(-40, 40),
          y: rnd(H * .15, H * .8),
          vx: rnd(-6, 6),
          vy: 0,
          ph: Math.random(),
          per: K.per ? rnd(K.per[0], K.per[1]) : rnd(2.4, 3.4),
          sw: rnd(0, 6),
          boost: 0,
          z: z,
          sp: depthSpeed(z),
          a: .92,
          halo: haloOf(pic)
        });
      }
    });
    jellies.sort(function(a, b) {
      return a.z - b.z;
    });
    var HK = KINDS.hatchet, hr = small ? HK.wp : HK.w, fishes = [], sz = rnd(.15, .4);
    for (var i = 0; i < plan.hatchet; i++) {
      var im = pick("hatchet", i);
      if (!im) continue;
      var z = Math.max(0, Math.min(1, sz + rnd(-.12, .12))), w = hr[0] + (hr[1] - hr[0]) * z;
      var hp = kindTint(tinted(im, null, depthDark(z)), "hatchet");
      fishes.push({
        pic: hp,
        w: w,
        h: w * im.naturalHeight / im.naturalWidth,
        ox: rnd(-70, 70),
        oy: rnd(-40, 40),
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        turn: -1,
        phase: Math.random() * 6,
        beat: 1.2,
        a: .95,
        z: z,
        halo: haloOf(hp),
        tw: rnd(0, 6)
      });
    }
    fishes.sort(function(a, b) {
      return a.z - b.z;
    });
    school = {
      cx: W * .25,
      cy: H * .4,
      tx: W * .6,
      ty: H * .4,
      next: 0,
      fish: fishes,
      sp: depthSpeed(sz),
      z: sz
    };
    [ "vamp", "gulper", "siph" ].forEach(function(kind) {
      var K = KINDS[kind];
      for (var i = 0; i < (plan[kind] || 0); i++) {
        var im = pick(kind, i);
        if (!im) continue;
        var r = small ? K.wp : K.w, z = kind === "siph" ? rnd(.1, .25) : rnd(.1, .45), w = r[0] + (r[1] - r[0]) * (.2 + z), pic = kindTint(tinted(im, null, depthDark(z)), kind);
        swimmers.push({
          kind: kind,
          pic: pic,
          halo: haloOf(pic),
          w: w,
          h: w * im.naturalHeight / im.naturalWidth,
          z: z,
          sp: depthSpeed(z),
          x: rnd(W * .15, W * .85),
          y: rnd(H * .2, H * .6),
          vx: 0,
          vy: 0,
          dir: Math.random() < .5 ? 1 : -1,
          dirFrom: 1,
          P: 1,
          phase: rnd(0, 6),
          beat: .6,
          tx: 0,
          ty: 0,
          next: 0,
          boost: 0,
          flee: 0,
          amp: kind === "gulper" ? .16 : kind === "siph" ? .09 : .05,
          N: kind === "gulper" || kind === "siph" ? 44 : 28,
          wave: -1,
          waveT: 0
        });
      }
    });
    swimmers.sort(function(a, b) {
      return a.z - b.z;
    });
    makeWorms();
    if (pics.isopod_a) isopod = {
      pic: tinted(pics.isopod_a, null, .42),
      u: .5,
      v: .775,
      dir: Math.random() < .5 ? 1 : -1,
      dirFrom: 1,
      P: 1,
      phase: 0,
      hunker: 0,
      run: 0,
      pause: 0,
      lastTurn: 0
    };
    fishes.forEach(function(f) {
      f.x = school.cx + f.ox;
      f.y = school.cy + f.oy;
    });
    for (var q = 0, nq = Math.round(W * H / (small ? 5500 : 6500)); q < nq; q++) snow.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: rnd(.6, 1.7),
      v: rnd(3, 10),
      ph: rnd(0, 6),
      a: rnd(.1, .27)
    });
    giant.next = performance.now() + (/fishdebug/.test(location.search) ? 500 : rnd(9e3, 16e3));
  }
  function swimStrips(pic, w, h, phase, amp, N) {
    var iw = pic.naturalWidth || pic.width, ih = pic.naturalHeight || pic.height;
    for (var i = 0; i < N; i++) {
      var u0 = i / N, u1 = (i + 1) / N, u = (u0 + u1) / 2, body = Math.max(0, (u - .32) / .68);
      var off = N > 1 ? amp * Math.pow(body, 1.5) * Math.sin(u * Math.PI * 1.8 - phase) : 0;
      ctx.drawImage(pic, u0 * iw, 0, (u1 - u0) * iw, ih, -w / 2 + u0 * w, -h / 2 + off, (u1 - u0) * w + .35, h);
    }
  }
  function stepJellies(now, dt) {
    var s = dt / 1e3;
    if (!cast) makeCast();
    jl = 1;
    for (var i = 0; i < jellies.length; i++) {
      var j = jellies[i], was = j.ph;
      j.ph = (j.ph + s / j.per * (1 + j.boost * 1.6)) % 1;
      if (was < .06 && j.ph >= .06) j.vy -= j.w * .22;
      j.vy += j.w * .035 * s;
      var cx = j.x, cy = j.y + j.h * .15, dx = cx - ptr.x, dy = cy - ptr.y, d = Math.hypot(dx, dy) || 1;
      if (ptr.in && d < j.w * .8 + 20) {
        j.vx += dx / d * j.w * 1.4 * s;
        j.vy += dy / d * j.w * .8 * s;
        j.boost = Math.min(1, j.boost + s * 4);
      } else if ((j.kind === "dumbo" || j.kind === "gsquid") && (j.prey = nearestFood(cx, cy, j.kind === "dumbo" ? 460 : 300))) {
        var px = j.prey.x - cx, py = j.prey.y - cy, pd = Math.hypot(px, py) || 1;
        j.vx += px / pd * j.w * .9 * s;
        j.vy += py / pd * j.w * .6 * s;
        j.boost = Math.min(.6, j.boost + s);
        if (pd < j.w * .45) {
          j.prey.dead = true;
          fedOnce();
        }
      } else if (j.kind === "dumbo" && ptr.in && ptr.speed < 350 && d < 380) {
        j.vx -= dx / d * j.w * .55 * s;
        j.vy -= dy / d * j.w * .3 * s;
        j.boost = Math.min(.5, j.boost + s * .8);
      }
      j.boost = Math.max(0, j.boost - s * .5);
      j.vx *= Math.pow(.55, s);
      j.vy *= Math.pow(.45, s);
      j.x += j.vx * s * j.sp;
      j.y += j.vy * s * j.sp;
      if (j.y < 0) {
        j.y = H + rnd(10, 120);
        j.x = rnd(j.w, W - j.w);
      }
      if (j.y > H + 160) j.y = H + 150;
      if (j.x < -j.w) j.x = W + j.w * .5; else if (j.x > W + j.w) j.x = -j.w * .5;
    }
    for (var q = 0; q < snow.length; q++) {
      var f = snow[q];
      f.y += f.v * s;
      f.x += Math.sin(now / 3e3 + f.ph) * 4 * s;
      var sx = f.x - ptr.x, sy = f.y - ptr.y, sd = Math.hypot(sx, sy) || 1;
      if (ptr.in && sd < 60 && ptr.speed > 200) {
        f.x += sx / sd * 40 * s;
        f.y += sy / sd * 40 * s;
      }
      if (f.y > H + 4) {
        f.y = -4;
        f.x = Math.random() * W;
      }
    }
    if (school) stepSchool(now, s);
    separate(s);
    stepGiant(now, s);
    stepSub(now, s);
    stepSwimmers(now, s);
    stepWorms(now, s);
    stepSmoke(now, s);
    stepIsopod(now, s);
    stepFood(now, s);
    stepBones(s);
    if (ptr.in && ptr.speed > 500 && now - ptr.t < 60 && Math.abs(ptr.y - groundY()) < 40 && Math.random() < .5) kickSilt(ptr.x, ptr.y, 2, ptr.speed * .06);
  }
  function stepSchool(now, s) {
    var S = school;
    if (now > S.next) {
      S.tx = rnd(W * .1, W * .9);
      S.ty = rnd(H * .2, Math.min(H * .85, groundY() - 60));
      S.next = now + rnd(7e3, 13e3);
    }
    if (ptr.in && ptr.speed < 400) {
      var side = S.cx < ptr.x ? -1 : 1;
      S.tx = ptr.x + side * 170;
      S.ty = Math.min(groundY() - 60, ptr.y - 30);
      S.next = now + 4e3;
    }
    var morsel = nearestFood(S.cx, S.cy, 520);
    if (morsel) {
      S.tx = morsel.x;
      S.ty = morsel.y;
      S.next = now + 1500;
    }
    var dx = S.tx - S.cx, dy = S.ty - S.cy, d = Math.hypot(dx, dy) || 1, v = Math.min(morsel ? 90 : ptr.in ? 60 : 26, d * .6) * S.sp;
    S.cx += dx / d * v * s;
    S.cy += dy / d * v * s * .6;
    for (var i = 0; i < S.fish.length; i++) {
      var f = S.fish[i], gx = S.cx + f.ox - f.x, gy = S.cy + f.oy - f.y;
      var mine = food.length ? nearestFood(f.x, f.y, 220) : null;
      if (mine) {
        var mx = mine.x - f.x, my = mine.y - f.y, md = Math.hypot(mx, my) || 1;
        f.vx += mx / md * 260 * s;
        f.vy += my / md * 200 * s;
        f.beat = Math.max(f.beat, 2.4);
        if (md < Math.max(9, f.w * .35)) {
          mine.dead = true;
          fedOnce();
        }
      } else {
        f.vx += gx * .9 * s;
        f.vy += gy * .9 * s;
      }
      var hx = f.x - ptr.x, hy = f.y - ptr.y, hd = Math.hypot(hx, hy) || 1;
      if (ptr.in && hd < 90 && ptr.speed > 300) {
        f.vx += hx / hd * 900 * s;
        f.vy += hy / hd * 700 * s;
        f.beat = 4;
      }
      f.vx *= Math.pow(.35, s);
      f.vy *= Math.pow(.3, s);
      f.x += f.vx * s;
      f.y += f.vy * s;
      if (Math.abs(f.vx) > 4) f.turn += ((f.vx < 0 ? -1 : 1) - f.turn) * Math.min(1, s * 5);
      f.beat += (1.1 + Math.hypot(f.vx, f.vy) / 40 - f.beat) * Math.min(1, s * 3);
      f.phase += s * f.beat * Math.PI * 2;
    }
  }
  var sub = {
    on: false,
    next: 0,
    pings: []
  };
  var SUB_ON = true;
  function stepSub(now, s) {
    if (!SUB_ON) return;
    var im = pics.sub;
    if (!im) return;
    if (!sub.next) sub.next = now + (/fishdebug/.test(location.search) ? 4e3 : rnd(5e4, 9e4));
    if (!sub.on && now > sub.next && !giant.on) {
      sub.on = true;
      sub.t0 = now;
      sub.dur = rnd(42e3, 52e3);
      sub.dir = Math.random() < .5 ? -1 : 1;
      sub.w = Math.min(900, Math.max(380, W * .55));
      sub.h = sub.w * im.naturalHeight / im.naturalWidth;
      sub.y = rnd(H * .3, H * .48);
      sub.ping = now + rnd(4e3, 7e3);
    }
    if (sub.on) {
      var p = (now - sub.t0) / sub.dur;
      if (p >= 1) {
        sub.on = false;
        sub.next = now + rnd(9e4, 18e4);
        return;
      }
      sub.p = p;
      if (now > sub.ping) {
        sub.ping = now + rnd(6e3, 9e3);
        sub.pings.push({
          t: now
        });
      }
    }
    for (var i = sub.pings.length - 1; i >= 0; i--) if (now - sub.pings[i].t > 2600) sub.pings.splice(i, 1);
  }
  function drawSub(now) {
    var im = pics.sub;
    if (!sub.on || !im) return;
    if (!sub.pic) {
      var P = 12, sw = im.naturalWidth + P * 2, sh = im.naturalHeight + P * 2, a = document.createElement("canvas");
      a.width = sw;
      a.height = sh;
      var ax = a.getContext("2d");
      ax.drawImage(im, P, P);
      ax.globalCompositeOperation = "color";
      ax.fillStyle = "#1d4f8f";
      ax.fillRect(0, 0, sw, sh);
      ax.globalCompositeOperation = "destination-in";
      ax.drawImage(im, P, P);
      ax.globalCompositeOperation = "source-atop";
      ax.fillStyle = "rgba(2,6,14,.5)";
      ax.fillRect(0, 0, sw, sh);
      var b = document.createElement("canvas");
      b.width = sw;
      b.height = sh;
      var bx = b.getContext("2d");
      if ("filter" in bx) {
        bx.filter = "blur(3.5px)";
        bx.drawImage(a, 0, 0);
        bx.filter = "none";
      } else bx.drawImage(a, 0, 0);
      sub.pic = b;
      sub.pad = P / im.naturalWidth;
      sub.padY = P / im.naturalHeight;
    }
    var p = sub.p, fade = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, p))), 1.2);
    var x = sub.dir < 0 ? W + sub.w * .6 - (W + sub.w * 1.2) * p : -sub.w * .6 + (W + sub.w * 1.2) * p, y = sub.y + Math.sin(now / 3800) * 4;
    ctx.save();
    ctx.globalAlpha = .3 * fade * jl;
    ctx.translate(x, y);
    if (sub.dir > 0) ctx.scale(-1, 1);
    var pw = sub.w * (1 + 2 * (sub.pad || 0)), ph = sub.h * (1 + 2 * (sub.padY || 0));
    ctx.drawImage(sub.pic, -pw / 2, -ph / 2, pw, ph);
    ctx.restore();
  }
  function stepGiant(now, s) {
    var G = giant, im = pics.squid_giant;
    if (!im) return;
    if (!G.on && now > G.next && !sub.on) {
      G.on = true;
      G.t0 = now;
      G.dur = rnd(28e3, 36e3);
      G.dir = Math.random() < .5 ? -1 : 1;
      G.w = Math.min(1700, Math.max(520, W * 1.15));
      G.h = G.w * im.naturalHeight / im.naturalWidth;
      G.y = rnd(H * .3, H * .6);
      G.phase = 0;
      G.T = rnd(6500, 8500);
    }
    if (G.on) {
      var p = (now - G.t0) / G.dur;
      if (p >= 1) {
        G.on = false;
        G.next = now + rnd(3e4, 55e3);
        return;
      }
      G.p = p;
      var u = (now - G.t0) % G.T / G.T;
      G.u = u;
      G.phase += s * (.26 + .34 * Math.exp(-u * 3)) * Math.PI * 2;
    }
  }
  function drawGiant() {
    var G = giant, im = pics.squid_giant;
    if (!G.on || !im) return;
    var p = G.p, fade = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, p))), 1.6);
    var cyc = G.dur / G.T, n = Math.floor(p * cyc), u = p * cyc - n, g = (1 - Math.exp(-u * 1.6)) / (1 - Math.exp(-1.6)), q = Math.min(1, (n + g) / cyc);
    var x = G.dir < 0 ? W + G.w * .6 - (W + G.w * 1.2) * q : -G.w * .6 + (W + G.w * 1.2) * q;
    var sq = u < .3 ? Math.sin(u / .3 * Math.PI) : 0;
    if (!G.src) {
      var sw = Math.round(im.naturalWidth * .5), sh = Math.round(im.naturalHeight * .5), a = document.createElement("canvas");
      a.width = sw;
      a.height = sh;
      var ax = a.getContext("2d");
      ax.drawImage(im, 0, 0, sw, sh);
      ax.globalCompositeOperation = "color";
      ax.fillStyle = "#1d4f8f";
      ax.fillRect(0, 0, sw, sh);
      ax.globalCompositeOperation = "destination-in";
      ax.drawImage(im, 0, 0, sw, sh);
      ax.globalCompositeOperation = "source-atop";
      ax.fillStyle = "rgba(2,6,14,.35)";
      ax.fillRect(0, 0, sw, sh);
      var b = document.createElement("canvas");
      b.width = Math.round(sw / 2);
      b.height = Math.round(sh / 2);
      var bx = b.getContext("2d");
      bx.imageSmoothingQuality = "high";
      bx.drawImage(a, 0, 0, b.width, b.height);
      ax.globalCompositeOperation = "copy";
      ax.imageSmoothingQuality = "high";
      ax.drawImage(b, 0, 0, sw, sh);
      G.src = a;
    }
    var HS = .5, MG = 1.5, o = G.off || (G.off = document.createElement("canvas")), pw = Math.ceil(G.w * HS), ph = Math.ceil(G.h * MG * HS);
    if (o.width !== pw || o.height !== ph) {
      o.width = pw;
      o.height = ph;
    }
    var oc = o.getContext("2d"), keep = ctx;
    oc.clearRect(0, 0, pw, ph);
    ctx = oc;
    ctx.save();
    ctx.translate(pw / 2, ph / 2);
    if (G.dir > 0) ctx.scale(-1, 1);
    giantStrips(G.src, G.w * HS, G.h * HS, G.phase, u, still);
    ctx.restore();
    ctx = keep;
    ctx.globalAlpha = .16 * fade * jl;
    var sxk = 1 - .025 * sq, syk = 1 + .02 * sq, rise = -Math.sin(u * Math.PI) * G.h * .012;
    ctx.drawImage(o, x - G.w * sxk / 2, G.y + rise + Math.sin(p * Math.PI * 2) * G.h * .02 - G.h * MG / 2 * syk, G.w * sxk, G.h * MG * syk);
    ctx.globalAlpha = 1;
  }
  function giantStrips(pic, w, h, phase, u, still) {
    var iw = pic.naturalWidth || pic.width, ih = pic.naturalHeight || pic.height, N = NS(96), RW = 9, ROOT = .6;
    var push = .7 + .3 * Math.exp(-u * 2.5), amp = h * .1 * push, spr = .11 * push;
    function dy(c, v) {
      var b = Math.max(0, (c - .36) / .64);
      if (!b) return 0;
      return amp * Math.pow(b, 1.3) * (Math.sin(c * Math.PI * 2.4 - phase + v * 2.4) + .35 * Math.sin(c * Math.PI * 6 - phase * 1.8 - v * 3)) + (v - ROOT) * h * spr * Math.pow(b, 1.2) * Math.sin(phase * .6 - c * 1.6);
    }
    for (var i = 0; i < N; i++) {
      var u0 = i / N, u1 = (i + 1) / N, c = (u0 + u1) / 2, x = -w / 2 + u0 * w, cw = (u1 - u0) * w + .35, rows = N > 1 && c > .36 ? RW : 1;
      for (var r = 0; r < rows; r++) {
        var v0 = r / rows, v1 = (r + 1) / rows, y0 = v0 * h + (N > 1 ? dy(c, v0) : 0), y1 = v1 * h + (N > 1 ? dy(c, v1) : 0);
        ctx.drawImage(pic, u0 * iw, v0 * ih, (u1 - u0) * iw, (v1 - v0) * ih, x, -h / 2 + y0, cw, y1 - y0 + (r < rows - 1 ? .35 : 0));
      }
    }
  }
  var SEABED = .45, OFF = (location.search.match(/fishoff=([a-z,]+)/) || [ , "" ])[1].split(",");
  var OLD = {};
  (location.search.match(/fishold=([a-z,]+)/) || [ , "" ])[1].split(",").forEach(function(k) {
    if (k) OLD[k] = 1;
  });
  function off(k) {
    return OFF.indexOf(k) >= 0 || PL() >= 1 && (k === "halo" || k === "smoke") || PL() >= 2 && k === "wave";
  }
  var swimmers = [], worms = [], smoke = [], silt = [], smokeT = 0, rt = 0, pxs = 0, R = {};
  function setRects(now) {
    var r = cv.getBoundingClientRect(), f = pics.sea_floor;
    rt = Math.max(0, r.top);
    pxs += ((ptr.in ? ptr.x / W - .5 : 0) - pxs) * .02;
    function par(k) {
      return -(1 - k) * rt;
    }
    if (f) {
      var fw2 = Math.max(W * 1.06, 1100), fh2 = fw2 * f.naturalHeight / f.naturalWidth;
      R.floor = {
        x: (W - fw2) / 2 - pxs * 4,
        y: H - fh2 + par(.85),
        w: fw2,
        h: fh2
      };
    }
    var a = pics.sea_far;
    if (a && R.floor) {
      var aw = Math.max(W * 1.12, 1150), ah = aw * a.naturalHeight / a.naturalWidth;
      R.far = {
        x: (W - aw) / 2 - pxs * 2,
        y: R.floor.y + R.floor.h * .62 - ah + par(.6) - par(.85),
        w: aw,
        h: ah
      };
    }
  }
  function groundY() {
    return R.floor ? R.floor.y + R.floor.h * .68 : H;
  }
  function drawFar() {
    var a = pics.sea_far;
    if (!a || !R.far) return;
    if (OLD.far || giant.on && pics.squid_giant && !off("giant") || sub.on && pics.sub && !off("sub")) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.globalAlpha = .92 * jl;
      ctx.drawImage(a, R.far.x, R.far.y, R.far.w, R.far.h);
    }
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = .26 * jl;
    ctx.drawImage(a, R.far.x, R.far.y, R.far.w, R.far.h);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
  function drawFloor(t) {
    var f = pics.sea_floor;
    if (!f || !R.floor) return;
    ctx.drawImage(f, R.floor.x, R.floor.y, R.floor.w, R.floor.h);
    if (!off("worm")) drawWorms(t);
    if (SIGN_ON) drawSign();
    if (!off("smoke")) drawSmoke();
    if (!off("iso")) drawIsopod();
  }
  function drawFore() {
    var l = pics.sea_fore_l, r = pics.sea_fore_r, k = Math.max(.75, Math.min(1.3, W / 1440)), dy = .25 * rt;
    if (l) {
      var lw = l.naturalWidth * .62 * k, lh = lw * l.naturalHeight / l.naturalWidth;
      ctx.drawImage(l, -lw * .34 - pxs * 10, H - lh * .82 + dy, lw, lh);
    }
    if (r && W > 700) {
      var rw = r.naturalWidth * .62 * k, rh = rw * r.naturalHeight / r.naturalWidth;
      ctx.drawImage(r, W - rw * .62 - pxs * 10, H - rh * .78 + dy, rw, rh);
    }
  }
  function haloOf(src) {
    var iw = src.naturalWidth || src.width, ih = src.naturalHeight || src.height, pad = Math.round(Math.max(iw, ih) * .22), k = 1 / 7;
    var a = document.createElement("canvas");
    a.width = Math.max(2, Math.round((iw + pad * 2) * k));
    a.height = Math.max(2, Math.round((ih + pad * 2) * k));
    var x = a.getContext("2d");
    x.imageSmoothingQuality = "high";
    x.drawImage(src, pad * k, pad * k, iw * k, ih * k);
    var b = document.createElement("canvas");
    b.width = a.width * 2;
    b.height = a.height * 2;
    var y = b.getContext("2d");
    y.imageSmoothingQuality = "high";
    y.drawImage(a, 0, 0, b.width, b.height);
    return {
      c: b,
      px: pad / iw,
      py: pad / ih
    };
  }
  function drawHalo(h, x, y, w, hh, a) {
    if (a <= .005 || off("halo")) return;
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = Math.min(1, a);
    ctx.drawImage(h.c, x - w * h.px, y - hh * h.py, w * (1 + 2 * h.px), hh * (1 + 2 * h.py));
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }
  function stepSwimmers(now, s) {
    for (var i = 0; i < swimmers.length; i++) {
      var m = swimmers[i];
      if (now > m.next) {
        m.tx = rnd(m.w, W - m.w);
        m.ty = rnd(H * .15, Math.min(H * .7, groundY() - m.h));
        m.next = now + rnd(9e3, 16e3);
      }
      var hx = m.x - ptr.x, hy = m.y - ptr.y, hd = Math.hypot(hx, hy) || 1;
      if (m.kind === "siph") {
        if (ptr.in && hd < m.w * .45 && m.wave < 0 && now > m.waveT) spook(m, now);
      } else if (ptr.in && hd < m.w * .8 && ptr.speed > 500 && now - ptr.t < 80) spook(m, now);
      if (m.wave >= 0) {
        m.wave += s;
        if (m.wave > SIPH_T) {
          m.wave = -1;
          m.waveT = now + 1500;
        }
      }
      m.flee = Math.max(0, m.flee - s);
      m.boost = Math.max(0, m.boost - s * .6);
      var eating = false;
      if (m.kind !== "siph" && m.flee <= 0 && food.length) {
        var mf = nearestFood(m.x, m.y, m.w * 3 + 120);
        if (mf) {
          eating = true;
          m.tx = mf.x;
          m.ty = mf.y;
          m.next = now + 2500;
          var mo = m.x - m.dir * m.w * .4;
          if (Math.hypot(mf.x - mo, mf.y - m.y) < Math.max(10, m.w * .18)) {
            mf.dead = true;
            fedOnce();
            m.boost = Math.min(1, m.boost + .3);
          }
        }
      }
      var dx = (eating ? m.tx + m.dir * m.w * .4 : m.tx) - m.x, dy = m.ty - m.y, d = Math.hypot(dx, dy) || 1;
      if (m.P < 1) m.P = Math.min(1, m.P + s / .45); else if (Math.abs(dx) > m.w * .6 && (dx < 0 ? 1 : -1) !== m.dir && now - (m.lastTurn || 0) > 2500) {
        m.dirFrom = m.dir;
        m.dir = -m.dir;
        m.P = 0;
        m.lastTurn = now;
      }
      var max = (m.flee > 0 ? 150 : eating ? 42 : m.kind === "gulper" ? 16 : 20) * m.sp, acc = m.flee > 0 ? 600 : eating ? 70 : 22;
      if (m.P >= 1 && dx * m.dir < 0) m.vx += dx / d * acc * s; else m.vx *= Math.pow(.3, s);
      m.vy += dy / d * acc * s * .5;
      var sp = Math.hypot(m.vx, m.vy), cap = max * Math.min(1, d / (m.w * .5)) + 2;
      if (sp > cap) {
        m.vx *= cap / sp;
        m.vy *= cap / sp;
      }
      m.vx *= Math.pow(.7, s);
      m.vy *= Math.pow(.5, s);
      m.x += m.vx * s;
      m.y += m.vy * s;
      m.beat += (.45 + Math.hypot(m.vx, m.vy) / (20 * m.sp) * .5 + (m.flee > 0 ? 1.8 : 0) - m.beat) * Math.min(1, s * 3);
      m.phase += s * m.beat * Math.PI * 2;
    }
  }
  function spook(m, now) {
    if (m.kind === "siph") {
      if (m.wave < 0) m.wave = 0;
      m.boost = .6;
      m.shT = now;
      return;
    }
    puffBubbles(m.x, m.y, rnd(3, 6) | 0, 0, -20);
    var a = Math.atan2(m.y - ptr.y, m.x - ptr.x);
    m.tx = Math.max(m.w * .5, Math.min(W - m.w * .5, m.x + Math.cos(a) * W * .5));
    m.ty = Math.max(H * .1, Math.min(groundY() - m.h, m.y + Math.sin(a) * H * .25));
    m.flee = 1.6;
    m.boost = 1;
    m.next = now + rnd(6e3, 9e3);
    if ((m.tx < m.x ? 1 : -1) !== m.dir && m.P >= 1) {
      m.dirFrom = m.dir;
      m.dir = -m.dir;
      m.P = 0;
      m.lastTurn = now;
    }
  }
  function drawSwimmers(z0, z1) {
    for (var i = 0; i < swimmers.length; i++) {
      var m = swimmers[i];
      if (m.z < z0 || m.z >= z1) continue;
      var e = m.P * m.P * (3 - 2 * m.P), sx = m.P < 1 ? m.dirFrom * Math.cos(Math.PI * e) : m.dir;
      if (Math.abs(sx) < .05) sx = sx < 0 ? -.05 : .05;
      var fade = Math.max(0, Math.min(1, m.y / (H * .15))) * jl;
      drawHalo(m.halo, m.x - m.w * Math.abs(sx) / 2, m.y - m.h / 2, m.w * Math.abs(sx), m.h, (.14 + m.boost * .4 + (m.kind === "siph" ? .1 + .06 * Math.sin(performance.now() / 600) : 0)) * (.5 + .5 * m.z) * fade);
      var shN = performance.now(), sh = m.shT && !still ? Math.pow(Math.max(0, 1 - (shN - m.shT) / 750), 2) : 0;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(m.x + sh * Math.sin(shN / 11) * 2.2, m.y + sh * Math.sin(shN / 15) * 1.4);
      ctx.scale(sx, 1 + sh * .05 * Math.sin(shN / 19));
      swimStrips(m.pic, m.w, m.h, m.phase + sh * Math.sin(shN / 24) * 1.6, m.h * m.amp * (1 + sh * 1.8), NS(m.N));
      if (m.wave >= 0 && !off("wave")) lightWave(m, performance.now() / 1e3);
      ctx.restore();
    }
  }
  var SIPH_T = 4.5;
  function siphBands(m, u) {
    if (m.wave < 0) return 0;
    var k = m.wave, env = Math.min(1, k / .35) * Math.min(1, (SIPH_T - k) / 1.4);
    return Math.pow(Math.max(0, Math.sin(Math.PI * 2 * (k * 1.15 - u * 2.4))), 4) * Math.max(0, env);
  }
  function lightWave(m, t) {
    var pic = m.pic, iw = pic.width, ih = pic.height, N = NS(m.N), amp = m.h * m.amp, pad = Math.ceil(amp) + 2;
    var c = m.lw || (m.lw = document.createElement("canvas")), cw = Math.ceil(m.w * dpr), ch = Math.ceil((m.h + pad * 2) * dpr);
    if (c.width !== cw || c.height !== ch) {
      c.width = cw;
      c.height = ch;
    }
    var x = c.getContext("2d");
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = "source-over";
    x.clearRect(0, 0, cw, ch);
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (var i = 0; i < N; i++) {
      var u0 = i / N, u1 = (i + 1) / N, u = (u0 + u1) / 2, body = Math.max(0, (u - .32) / .68);
      var off = N > 1 ? amp * Math.pow(body, 1.5) * Math.sin(u * Math.PI * 1.8 - m.phase) : 0;
      x.drawImage(pic, u0 * iw, 0, (u1 - u0) * iw, ih, u0 * m.w, pad + off, (u1 - u0) * m.w + .35, m.h);
    }
    var g = x.createLinearGradient(0, 0, m.w, 0);
    for (var k = 0; k <= 48; k++) {
      var uu = k / 48, a = Math.max(0, Math.min(1, .1 + .08 * Math.sin(t * 1.7 - uu * 9) + siphBands(m, uu) * .9));
      g.addColorStop(uu, "rgba(0,0,0," + a.toFixed(3) + ")");
    }
    x.globalCompositeOperation = "destination-in";
    x.fillStyle = g;
    x.fillRect(0, 0, m.w, m.h + pad * 2);
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(c, -m.w / 2, -m.h / 2 - pad, m.w, m.h + pad * 2);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }
  var isopod = null;
  function isoRect() {
    var F = R.floor, I = isopod;
    if (!F || !I) return null;
    var w = Math.max(80, Math.min(170, F.h * .4)), h = w * I.pic.height / I.pic.width;
    return {
      x: F.x + F.w * I.u,
      y: F.y + F.h * I.v - h / 2,
      w: w,
      h: h
    };
  }
  function stepIsopod(now, s) {
    var I = isopod, F = R.floor;
    if (!I || !F) return;
    var r = isoRect(), u0 = Math.max(.06, -F.x / F.w + .06), u1 = Math.min(.94, (W - F.x) / F.w - .06);
    var near = ptr.in && Math.hypot(ptr.x - r.x, ptr.y - r.y) < r.w * .6;
    if (near && I.hunker < .5 && now > I.pause) {
      I.hunker = 1;
      I.pause = now + 1400;
      I.run = 0;
    }
    if (now < I.pause) {
      I.hunker = Math.min(1, I.hunker + s * 8);
      return;
    }
    if (I.hunker > 0) {
      I.hunker = Math.max(0, I.hunker - s * 3);
      if (I.hunker === 0 && !I.run) {
        I.run = 2.5;
        var away = ptr.x < r.x ? -1 : 1;
        if (away !== I.dir && I.P >= 1) {
          I.dirFrom = I.dir;
          I.dir = away;
          I.P = 0;
        }
      }
      return;
    }
    if (I.P < 1) {
      I.P = Math.min(1, I.P + s / .5);
      return;
    }
    I.run = Math.max(0, I.run - s);
    var seek = null, sd = F.w * .25;
    if (I.run <= 0) for (var q = 0; q < food.length; q++) {
      var fq = food[q];
      if (fq.landed && !fq.dead) {
        var dq = Math.abs(fq.x - r.x);
        if (dq < sd) {
          sd = dq;
          seek = fq;
        }
      }
    }
    if (seek) {
      var want = seek.x < r.x ? 1 : -1;
      if (want !== I.dir && sd > r.w * .3) {
        I.dirFrom = I.dir;
        I.dir = want;
        I.P = 0;
        return;
      }
      if (sd < r.w * .35) {
        seek.dead = true;
        fedOnce();
        I.pause = now + 500;
        return;
      }
    }
    var v = (I.run > 0 ? 60 : seek ? 22 : 11) / F.w;
    I.u -= I.dir * v * s;
    I.phase += s * (I.run > 0 ? 3.2 : 1.1);
    if (I.u < u0 && I.dir > 0 || I.u > u1 && I.dir < 0) {
      I.dirFrom = I.dir;
      I.dir = -I.dir;
      I.P = 0;
    }
  }
  function drawIsopod() {
    var I = isopod, r = isoRect();
    if (!r) return;
    var pic = I.pic, iw = pic.width, ih = pic.height;
    var e = I.P * I.P * (3 - 2 * I.P), sx = I.P < 1 ? I.dirFrom * Math.cos(Math.PI * e) : I.dir;
    if (Math.abs(sx) < .05) sx = sx < 0 ? -.05 : .05;
    var sq = 1 - .14 * I.hunker, N = NS(22), walking = I.P >= 1 && I.hunker === 0;
    ctx.save();
    ctx.translate(r.x, r.y + r.h / 2);
    ctx.scale(sx, sq);
    for (var i = 0; i < N; i++) {
      var v0 = i / N, v1 = (i + 1) / N, v = (v0 + v1) / 2, legs = Math.max(0, (v - .5) / .5);
      var off = walking ? r.w * .022 * legs * Math.sin(I.phase * Math.PI * 2 - v * 7) : 0;
      var bob = walking ? Math.sin(I.phase * Math.PI * 4) * r.h * .01 : 0;
      ctx.drawImage(pic, 0, v0 * ih, iw, (v1 - v0) * ih, -r.w / 2 + off, -r.h + v0 * r.h + bob, r.w, (v1 - v0) * r.h + .35);
    }
    ctx.restore();
  }
  var WORM_MOUTH = {
    x: .37,
    y: .17
  }, WORM_BASE = {
    x: .42,
    y: .97
  };
  function makeWorms() {
    worms = [];
    [ [ .415, .7, 4 ], [ .635, .665, 3 ], [ .2, .8, 2 ] ].forEach(function(c, ci) {
      for (var i = 0; i < c[2]; i++) worms.push({
        u: c[0] + rnd(-.022, .022),
        v: c[1] + rnd(-.008, .025),
        s: rnd(.5, 1),
        flip: Math.random() < .5,
        out: 1,
        hide: 0,
        trig: 0,
        sw: rnd(0, 6),
        c: ci
      });
    });
    worms.sort(function(a, b) {
      return a.v - b.v;
    });
  }
  function wormRect(w) {
    var F = R.floor, tb = pics.worm_tube;
    if (!F || !tb) return null;
    var hh = F.h * .34 * w.s, ww = hh * tb.naturalWidth / tb.naturalHeight, bx = F.x + F.w * w.u, by = F.y + F.h * w.v;
    var x = bx - ww * WORM_BASE.x, y = by - hh * WORM_BASE.y;
    return {
      x: x,
      y: y,
      w: ww,
      h: hh,
      mx: x + ww * WORM_MOUTH.x,
      my: y + hh * WORM_MOUTH.y,
      bx: bx
    };
  }
  function stepWorms(now, s) {
    for (var i = 0; i < worms.length; i++) {
      var w = worms[i], r = wormRect(w);
      if (!r) return;
      var mx = w.flip ? 2 * r.bx - r.mx : r.mx;
      var near = ptr.in && Math.hypot(ptr.x - mx, ptr.y - (r.my - r.h * .08)) < Math.max(46, r.h * .55);
      if (near && w.out > .3) hideWorm(w, now, 0);
      if (w.out > .8 && !w.hide || w.out > .8 && now > w.hide) for (var q = 0; q < food.length; q++) {
        var fq = food[q];
        if (!fq.dead && !fq.landed && Math.hypot(fq.x - mx, fq.y - r.my) < Math.max(14, r.h * .22)) {
          fq.dead = true;
          fedOnce();
          w.hide = now + rnd(500, 800);
          break;
        }
      }
      if (w.trig && now >= w.trig) {
        w.trig = 0;
        w.hide = now + rnd(1300, 2600);
      }
      if (now < w.hide || near) {
        w.out = Math.max(0, w.out - s / .11);
        if (near) w.hide = Math.max(w.hide, now + 900);
      } else w.out = Math.min(1, w.out + s / rnd(1.3, 1.6));
    }
  }
  function hideWorm(w, now, delay) {
    if (delay) {
      if (!w.trig && w.out > .3) w.trig = now + delay;
      return;
    }
    w.hide = now + rnd(1300, 2600);
    worms.forEach(function(o) {
      if (o !== w && o.c === w.c) hideWorm(o, now, 80 + Math.abs(o.u - w.u) * 9e3);
    });
  }
  function drawWorms(t) {
    var tb = pics.worm_tube, pl = pics.worm_plume;
    if (!tb || !pl) return;
    for (var i = 0; i < worms.length; i++) {
      var w = worms[i], r = wormRect(w);
      if (!r) continue;
      ctx.save();
      if (w.flip) {
        ctx.translate(2 * r.bx, 0);
        ctx.scale(-1, 1);
      }
      if (w.out > .02) {
        var e = 1 - Math.pow(1 - w.out, 3), k = .12 + .88 * e, sway = still ? 0 : Math.sin(t * .9 + w.sw) * .07 * e;
        ctx.save();
        ctx.globalAlpha = Math.min(1, w.out * 3);
        ctx.translate(r.mx, r.my + (1 - e) * r.h * .04);
        ctx.rotate(sway);
        ctx.scale(k, k);
        ctx.translate(-r.mx, -r.my);
        ctx.drawImage(pl, r.x, r.y, r.w, r.h);
        ctx.restore();
      }
      ctx.drawImage(tb, r.x, r.y, r.w, r.h);
      ctx.restore();
    }
  }
  var puff = null, dust = null;
  function puffSprite(c0, c1) {
    var c = document.createElement("canvas");
    c.width = c.height = 64;
    var x = c.getContext("2d");
    var g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(" + c0 + ",1)");
    g.addColorStop(.5, "rgba(" + c1 + ",.45)");
    g.addColorStop(1, "rgba(" + c1 + ",0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    return c;
  }
  function stepSmoke(now, s) {
    var F = R.floor;
    if (!F) return;
    if (!still && now > smokeT) {
      smokeT = now + rnd(160, 280);
      smoke.push({
        u: .522 + rnd(-.006, .006),
        y: 0,
        dx: 0,
        r: F.h * rnd(.03, .05),
        v: F.h * rnd(.055, .085),
        a: rnd(.1, .16),
        t: now,
        life: rnd(5500, 7500),
        ph: rnd(0, 6)
      });
    }
    for (var i = smoke.length - 1; i >= 0; i--) {
      var p = smoke[i], k = (now - p.t) / p.life;
      if (k >= 1) {
        smoke.splice(i, 1);
        continue;
      }
      p.y -= p.v * s;
      p.r += F.h * .022 * s;
      p.dx += Math.sin(now / 1400 + p.ph) * F.h * .012 * s;
      var px = F.x + F.w * p.u + p.dx, py = F.y + F.h * .6 + p.y, hx = px - ptr.x, hy = py - ptr.y, hd = Math.hypot(hx, hy) || 1;
      if (ptr.in && hd < p.r * 1.6 && ptr.speed > 150) {
        p.dx += hx / hd * ptr.speed * .05 * s;
        p.y += hy / hd * ptr.speed * .03 * s;
      }
    }
    for (var j = silt.length - 1; j >= 0; j--) {
      var q = silt[j];
      q.t += s;
      if (q.t > q.life) {
        silt.splice(j, 1);
        continue;
      }
      q.vy += 14 * s;
      q.vx *= Math.pow(.3, s);
      q.vy *= Math.pow(.4, s);
      q.x += q.vx * s;
      q.y += q.vy * s;
    }
  }
  function kickSilt(x, y, n, force) {
    for (var i = 0; i < n; i++) {
      var a = -Math.PI * rnd(.08, .92);
      silt.push({
        x: x + rnd(-10, 10),
        y: y + rnd(-3, 3),
        vx: Math.cos(a) * force * rnd(.3, 1),
        vy: Math.sin(a) * force * rnd(.4, 1.1),
        r: rnd(7, 16),
        t: 0,
        life: rnd(2, 3.6),
        a: rnd(.18, .28)
      });
    }
    if (silt.length > 220) silt.splice(0, silt.length - 220);
  }
  function drawSmoke() {
    var F = R.floor;
    if (!F || !smoke.length) return;
    puff = puff || puffSprite("120,170,235", "70,120,200");
    var now = performance.now();
    for (var i = 0; i < smoke.length; i++) {
      var p = smoke[i], k = (now - p.t) / p.life, a = p.a * Math.sin(Math.PI * Math.min(1, k * 1.4)) * (1 - k) * jl;
      if (!(a > .002)) continue;
      ctx.globalAlpha = a;
      ctx.drawImage(puff, F.x + F.w * p.u + p.dx - p.r, F.y + F.h * .6 + p.y - p.r, p.r * 2, p.r * 2);
    }
    ctx.globalAlpha = 1;
  }
  function drawSilt() {
    if (!silt.length) return;
    dust = dust || puffSprite("95,112,110", "60,76,78");
    for (var i = 0; i < silt.length; i++) {
      var q = silt[i], k = q.t / q.life, a = q.a * Math.min(1, k * 6) * (1 - k);
      if (!(a > .002)) continue;
      ctx.globalAlpha = a;
      ctx.drawImage(dust, q.x - q.r * (1 + k), q.y - q.r * (1 + k), q.r * 2 * (1 + k), q.r * 2 * (1 + k));
    }
    ctx.globalAlpha = 1;
  }
  var FINE = matchMedia("(hover:hover) and (pointer:fine)").matches, handGlow = 0;
  var DARK_BASE = .21, setLayer = null, lightMap = null, LK = .25;
  var POOLS = [ [ .58, .6, .42, .2 ], [ .44, .5, .34, .12 ], [ .53, .42, .42, .08 ], [ .29, .37, .32, .14 ], [ .83, .3, .36, .14 ], [ .12, .55, .3, .1 ], [ .94, .55, .3, .1 ] ];
  function pool(m, x, y, r, a) {
    if (a <= .005 || r <= 1) return;
    var g = m.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(0,0,0," + a + ")");
    g.addColorStop(.45, "rgba(0,0,0," + a * .5 + ")");
    g.addColorStop(1, "rgba(0,0,0,0)");
    m.fillStyle = g;
    m.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function makeLight(t) {
    if (!lightMap) lightMap = document.createElement("canvas").getContext("2d");
    var lw = Math.max(2, Math.round(W * LK)), lh = Math.max(2, Math.round(H * LK));
    if (lightMap.canvas.width !== lw || lightMap.canvas.height !== lh) {
      lightMap.canvas.width = lw;
      lightMap.canvas.height = lh;
    }
    var m = lightMap;
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.globalCompositeOperation = "source-over";
    m.clearRect(0, 0, lw, lh);
    m.fillStyle = "rgba(0,0,0," + DARK_BASE + ")";
    m.fillRect(0, 0, lw, lh);
    m.setTransform(LK, 0, 0, LK, 0, 0);
    m.globalCompositeOperation = "lighter";
    var F = R.floor;
    if (F) POOLS.forEach(function(p, i) {
      pool(m, F.x + F.w * p[0], F.y + F.h * p[1], F.h * p[2], p[3] * (still ? 1 : .85 + .15 * Math.sin(t * (.7 + i * .23) + i)));
    });
    for (var i = 0; i < jellies.length; i++) {
      var j = jellies[i];
      pool(m, j.x, j.y + j.h * .3, j.w * 1.6, (.22 + j.boost * .3) * (.4 + .6 * j.z));
    }
    for (i = 0; i < swimmers.length; i++) {
      var w = swimmers[i];
      pool(m, w.x, w.y, w.w * .9, w.kind === "siph" ? .2 + (w.wave >= 0 ? .35 : 0) : .1 + w.boost * .2);
    }
    var sr = SIGN_ON && signRect();
    if (sr) pool(m, sr.x, sr.y - sr.h * .2, sr.w * .95, .55);
    for (i = 0; i < junk.length; i++) pool(m, junk[i].x, junk[i].y, junk[i].w * 1.1, junk[i].name === "junk_phone" ? .22 + .3 * phoneLit(junk[i]) : .22);
    var hg = FINE && ptr.in && jawTo !== 1 ? 1 : 0;
    handGlow += (hg - handGlow) * .08;
    if (handGlow > .01) pool(m, ptr.x, ptr.y, 90, .13 * handGlow);
    if (ready && light > .01 && fish.lx != null) pool(m, fish.lx, fish.ly, fw * 1.4, .38 * light * gm);
  }
  var SK = 1;
  function inTheDark(fn) {
    if (!setLayer) setLayer = document.createElement("canvas").getContext("2d");
    var L = setLayer, y0 = Math.max(0, Math.floor(R.floor ? R.floor.y : 0)), bh = Math.max(1, H - y0);
    var lw = Math.max(1, Math.round(W * SK)), lh = Math.max(1, Math.round(bh * SK));
    if (L.canvas.width !== lw || L.canvas.height !== lh) {
      L.canvas.width = lw;
      L.canvas.height = lh;
    }
    L.setTransform(1, 0, 0, 1, 0, 0);
    L.globalCompositeOperation = "source-over";
    L.globalAlpha = 1;
    L.clearRect(0, 0, lw, lh);
    L.setTransform(SK, 0, 0, SK, 0, -y0 * SK);
    var keep = ctx;
    ctx = L;
    fn();
    ctx = keep;
    if (!OLD.dark) {
      L.setTransform(1, 0, 0, 1, 0, 0);
      L.globalAlpha = 1;
      L.globalCompositeOperation = "source-atop";
      var dm = darkMap();
      L.drawImage(dm, 0, y0 * LK, dm.width, bh * LK, 0, 0, lw, lh);
      L.globalCompositeOperation = "source-over";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.drawImage(L.canvas, 0, y0, W, bh);
      return;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "destination-out";
    ctx.drawImage(L.canvas, 0, y0, W, bh);
    ctx.globalCompositeOperation = "source-over";
    L.setTransform(1, 0, 0, 1, 0, 0);
    L.globalAlpha = 1;
    L.globalCompositeOperation = "destination-in";
    var m = lightMap.canvas;
    L.drawImage(m, 0, y0 * LK, m.width, bh * LK, 0, 0, lw, lh);
    L.globalCompositeOperation = "source-over";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(L.canvas, 0, y0, W, bh);
  }
  var darkC = null;
  function darkMap() {
    var m = lightMap.canvas;
    darkC = darkC || document.createElement("canvas");
    if (darkC.width !== m.width || darkC.height !== m.height) {
      darkC.width = m.width;
      darkC.height = m.height;
    }
    var x = darkC.getContext("2d");
    x.globalCompositeOperation = "copy";
    x.fillStyle = "#000";
    x.fillRect(0, 0, m.width, m.height);
    x.globalCompositeOperation = "destination-out";
    x.drawImage(m, 0, 0);
    x.globalCompositeOperation = "source-over";
    return darkC;
  }
  var food = [], junk = [], drops = 0, fedT = false, JUNK = [ "junk_trolley", "junk_chest", "junk_moai", "junk_cone", "junk_portaloo", "junk_scooter", "junk_besser", "junk_phone" ], JW = {
    junk_trolley: 118,
    junk_chest: 96,
    junk_moai: 130,
    junk_cone: 52,
    junk_portaloo: 155,
    junk_scooter: 88,
    junk_besser: 86,
    junk_phone: 54
  };
  function fedOnce() {
    if (!fedT) {
      fedT = true;
      T("fed_fish");
    }
  }
  function nearestFood(x, y, R) {
    var b = null, bd = R;
    for (var i = 0; i < food.length; i++) {
      var f = food[i];
      if (f.dead) continue;
      var d = Math.hypot(f.x - x, f.y - y);
      if (d < bd) {
        bd = d;
        b = f;
      }
    }
    return b;
  }
  function dropThing(x, y, now) {
    drops++;
    sprinkle.junkAt = now + rnd(1100, 1400);
    sprinkle.held = 0;
    if ((drops === 3 || drops > 3 && Math.random() < .25) && dropJunk(x, y, now)) return;
    sprinkle.on = true;
    sprinkle.next = 0;
    for (var i = 0, n = rnd(9, 13); i < n; i++) flake(x, y, 24);
  }
  var lastJunk = -1e9;
  function dropJunk(x, y, now, gap) {
    if (now - lastJunk < (gap || 4e3)) return false;
    lastJunk = now;
    var left = JUNK.filter(function(n) {
      return pics[n] && !junk.some(function(j) {
        return j.name === n;
      });
    });
    if (!left.length) return false;
    var n = left[Math.floor(Math.random() * left.length)], im = pics[n], w = JW[n] * (W <= 700 ? .75 : 1);
    junk.push({
      name: n,
      pic: tinted(im, null, .5),
      x: x,
      y: y,
      w: w,
      h: w * im.naturalHeight / im.naturalWidth,
      vy: 40,
      rot: rnd(-.35, .35),
      vr: rnd(-.35, .35),
      landed: false,
      t: now,
      next: now + rnd(800, 1600)
    });
    if (n === "junk_phone") junk[junk.length - 1].h = w * 2.05 * .42 / .84;
    T("junk_" + n.slice(5));
    return junk[junk.length - 1];
  }
  var sprinkle = {
    on: false,
    next: 0,
    junkAt: 0,
    held: 0
  }, FLAKE = [ "#683619", "#5c2019", "#665222", "#37461f", "#4f2d16", "#655a37" ];
  function flake(x, y, spread) {
    if (food.length > 220) {
      var k = food.findIndex(function(f) {
        return f.landed || f.dead;
      });
      food.splice(k < 0 ? 0 : k, 1);
    }
    var r = rnd(2.2, 4.2), n = 4 + (Math.random() * 3 | 0), pts = [];
    for (var i = 0; i < n; i++) {
      var a = i / n * 6.283 + rnd(-.4, .4);
      pts.push([ Math.cos(a) * r * rnd(.6, 1.2), Math.sin(a) * r * rnd(.5, 1) ]);
    }
    food.push({
      x: x + rnd(-spread, spread),
      y: y + rnd(-spread * .5, spread * .5),
      vy: rnd(4, 14),
      vx: rnd(-40, 40),
      ph: rnd(0, 6),
      rot: rnd(0, 6.28),
      vr: rnd(-3, 3),
      dx: rnd(-14, 14),
      sw: rnd(8, 24),
      sf: rnd(280, 620),
      flip: rnd(0, 6),
      c: FLAKE[Math.random() * FLAKE.length | 0],
      pts: pts,
      t: performance.now(),
      landed: 0,
      dead: false
    });
  }
  addEventListener("pointerup", function() {
    sprinkle.on = false;
  }, {
    passive: true
  });
  addEventListener("touchend", function(e) {
    if (!e.touches.length) sprinkle.on = false;
  }, {
    passive: true
  });
  function stepFood(now, s) {
    var gy = groundY();
    if (sprinkle.on && ptr.in && now > sprinkle.next && ptr.y < gy - 20) {
      sprinkle.next = now + 45;
      flake(ptr.x, ptr.y, 6);
      if (now > sprinkle.junkAt) {
        sprinkle.junkAt = now + rnd(1700, 2500);
        if (!sprinkle.held++ || Math.random() < .85) dropJunk(ptr.x, ptr.y, now, 1600);
      }
    }
    for (var i = food.length - 1; i >= 0; i--) {
      var f = food[i];
      if (f.dead || f.landed && now - f.landed > 6e3) {
        food.splice(i, 1);
        continue;
      }
      if (!f.landed) {
        f.vy += (16 - f.vy) * Math.min(1, s * 1.5);
        f.vx *= Math.pow(.35, s);
        f.y += f.vy * s;
        f.x += (f.vx + f.dx + Math.sin(now / f.sf + f.ph) * f.sw) * s;
        f.rot += f.vr * s;
        f.flip += s * 3;
        if (f.y >= gy - 2) {
          f.y = gy - 2 + rnd(-2, 2);
          f.landed = now;
        }
      }
    }
    for (var k = 0; k < junk.length; k++) {
      var j = junk[k];
      if (!j.landed) {
        j.vy += (150 - j.vy) * Math.min(1, s * 1.5);
        j.y += j.vy * s;
        j.rot += j.vr * s;
        j.vr *= Math.pow(.6, s);
        j.rot *= Math.pow(.35, s);
        if (j.vx) {
          j.x += j.vx * s;
          j.vx *= Math.pow(.15, s);
        }
        if (j.y + j.h * .42 >= gy + 6) {
          j.y = gy + 6 - j.h * .42;
          j.landed = true;
          kickSilt(j.x, gy, 18, 120);
          j.vy = 0;
        }
      } else {
        j.rot *= Math.pow(.02, s);
        if (j.buzz) j.buzz = Math.max(0, j.buzz - s / 1.1);
        if (now > j.next) {
          if (j.name === "junk_diver") {
            j.next = now + rnd(1100, 2e3);
            puffBubbles(j.x + j.w * .18, j.y - j.h * .42, rnd(1, 3) | 0, 0, -20);
          } else if (j.name === "junk_chest") {
            j.next = now + rnd(3500, 6e3);
            puffBubbles(j.x + j.w * .05, j.y - j.h * .08, rnd(4, 7) | 0, 0, -30);
          } else if (j.name === "junk_phone") {
            j.next = now + rnd(6500, 9500);
            j.calls = (j.calls || 87) + 1 + (Math.random() < .3 ? 1 : 0);
            if (j.calls % 10 === 0) j.calls++;
            j.buzz = 1;
            j.wake = now;
          } else j.next = now + 1e9;
        }
      }
    }
  }
  function puffBubbles(x, y, n, vx, vy) {
    for (var i = 0; i < n; i++) mbub.push({
      x: x + rnd(-4, 4),
      y: y + rnd(-4, 4),
      vx: vx + rnd(-25, 25),
      vy: vy + rnd(-30, 0),
      r: rnd(1.5, 4),
      t: performance.now(),
      life: rnd(900, 1600),
      ph: rnd(0, 6)
    });
    if (mbub.length > 90) mbub.splice(0, mbub.length - 90);
  }
  function drawFood(t) {
    var now = performance.now();
    ctx.lineWidth = .8;
    ctx.strokeStyle = "rgba(8,6,4,.9)";
    for (var i = 0; i < food.length; i++) {
      var f = food[i];
      if (f.dead) continue;
      var a = f.landed ? Math.max(0, 1 - (now - f.landed) / 6e3) : 1;
      if (!(a > .01)) continue;
      ctx.save();
      ctx.globalAlpha = a * .8;
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      ctx.scale(1, f.landed ? .45 : .35 + .65 * Math.abs(Math.cos(f.flip)));
      ctx.beginPath();
      for (var k = 0; k < f.pts.length; k++) ctx[k ? "lineTo" : "moveTo"](f.pts[k][0], f.pts[k][1]);
      ctx.closePath();
      ctx.fillStyle = f.c;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  function floatRope(j) {
    var t = performance.now() / 1e3, x0 = j.w * .12, y0 = j.h * .02, L = j.w * .95, n = 16, pts = [];
    for (var i = 0; i <= n; i++) {
      var u = i / n, sway = Math.sin(t * 1.3 + u * 2.6 + j.w) * j.w * .09 * u * u + Math.sin(t * .7) * j.w * .03 * u;
      pts.push([ x0 + sway + u * j.w * .06, y0 - u * L ]);
    }
    function path() {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    path();
    ctx.strokeStyle = "#15110d";
    ctx.lineWidth = j.w * .075;
    ctx.stroke();
    path();
    ctx.strokeStyle = "#8f877b";
    ctx.lineWidth = j.w * .045;
    ctx.stroke();
    ctx.strokeStyle = "rgba(30,24,18,.8)";
    ctx.lineWidth = 1;
    for (var k = 1; k < n; k++) {
      var p = pts[k], q = pts[k + 1] || p, dx = q[0] - p[0], dy = q[1] - p[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d, r = j.w * .022;
      ctx.beginPath();
      ctx.moveTo(p[0] + nx * r - dx * .3, p[1] + ny * r - dy * .3);
      ctx.lineTo(p[0] - nx * r + dx * .3, p[1] - ny * r + dy * .3);
      ctx.stroke();
    }
    var e = pts[n];
    ctx.strokeStyle = "#8f877b";
    ctx.lineWidth = 1.3;
    for (var f = -1; f <= 1; f++) {
      ctx.beginPath();
      ctx.moveTo(e[0], e[1]);
      ctx.lineTo(e[0] + f * j.w * .035 + Math.sin(t * 2 + f) * 2, e[1] - j.w * .05);
      ctx.stroke();
    }
  }
  var weed = null, wl = null, wpx = null;
  function makeWeed() {
    var T = pics.weed_tall, Lo = pics.weed_low;
    weed = [];
    if (!T || !Lo) return;
    var small = W <= 700, th = H * (small ? .5 : .66), tw = th * T.naturalWidth / T.naturalHeight;
    weed.push({
      im: T,
      x: -tw * .18,
      w: tw,
      h: th,
      flip: false,
      ph: rnd(0, 6),
      b: 0,
      v: 0,
      a: .95
    });
    if (!small) weed.push({
      im: T,
      x: W - tw * .78,
      w: tw * .85,
      h: th * .85,
      flip: true,
      ph: rnd(0, 6),
      b: 0,
      v: 0,
      a: .92
    });
    var lh = H * (small ? .12 : .15), lw = lh * Lo.naturalWidth / Lo.naturalHeight;
    for (var x = -lw * .15, k = 0; x < W; x += lw * .82, k++) weed.push({
      im: Lo,
      x: x,
      w: lw,
      h: lh,
      flip: !!(k % 2),
      ph: rnd(0, 6),
      b: 0,
      v: 0,
      a: .97,
      low: true
    });
  }
  function drawWeed(t) {
    if (!weed || weed.W !== W || weed.H !== H) {
      makeWeed();
      if (!weed) return;
      weed.W = W;
      weed.H = H;
    }
    if (!weed.length) return;
    var dt = Math.min(.05, t - (drawWeed.t || t));
    drawWeed.t = t;
    var pvx = 0;
    if (ptr.in && wpx != null) pvx = (ptr.x - wpx) / Math.max(.008, dt);
    wpx = ptr.x;
    if (!wl) wl = document.createElement("canvas").getContext("2d");
    for (var i = 0; i < weed.length; i++) {
      var s = weed[i], ww = Math.ceil(s.w * dpr), hh = Math.ceil(s.h * dpr), pad = Math.ceil(s.w * .06 * dpr);
      if (ptr.in && Math.abs(pvx) > 60 && ptr.y > H - s.h && ptr.x > s.x && ptr.x < s.x + s.w) s.v += Math.max(-1.2, Math.min(1.2, pvx / 1400)) * dt * 30 * (s.low ? .7 : 1);
      s.v += (-s.b * 2.2 - s.v * .75) * dt;
      s.b += s.v * dt;
      s.b = Math.max(-.9, Math.min(.9, s.b));
      if (!s.hist) {
        s.hist = [];
        for (var hh0 = 0; hh0 < 48; hh0++) s.hist.push(0);
      }
      s.hist.unshift(s.b);
      s.hist.length = 48;
      var iw = s.im.naturalWidth, ih = s.im.naturalHeight, N = NS(s.low ? 8 : 22), amp = s.w * (s.low ? .025 : .035) * dpr;
      var direct = !OLD.weed, X0 = Math.round((s.x - pad / dpr) * dpr), Y0 = Math.round((H - s.h + 2) * dpr), L = direct ? ctx : wl;
      if (direct) {
        ctx.globalAlpha = s.a * jl;
      } else {
        if (wl.canvas.width < ww + pad * 2 || wl.canvas.height < hh) {
          wl.canvas.width = Math.max(wl.canvas.width, ww + pad * 2);
          wl.canvas.height = Math.max(wl.canvas.height, hh);
        }
        wl.setTransform(1, 0, 0, 1, 0, 0);
        wl.clearRect(0, 0, ww + pad * 2, hh);
      }
      for (var k = 0; k < N; k++) {
        var y0 = Math.round(k / N * hh), y1 = Math.round((k + 1) / N * hh), up = 1 - (y0 + y1) / 2 / hh;
        var bl = s.hist[Math.min(47, Math.round(up * up * 40))];
        var sw = still ? 0 : (Math.sin(t * .8 + s.ph - up * 1.1) * .75 + Math.sin(t * .47 + s.ph * 1.7) * .25 + bl * 6) * amp * up * up;
        L.save();
        L.setTransform(1, 0, 0, 1, direct ? X0 : 0, direct ? Y0 : 0);
        L.translate(pad + Math.round(sw), 0);
        if (s.flip) {
          L.translate(ww, 0);
          L.scale(-1, 1);
        }
        L.drawImage(s.im, 0, y0 / hh * ih, iw, (y1 - y0) / hh * ih, 0, y0, ww, y1 - y0);
        L.restore();
      }
      if (!direct) {
        ctx.globalAlpha = s.a * jl;
        ctx.drawImage(wl.canvas, 0, 0, ww + pad * 2, hh, s.x - pad / dpr, H - s.h + 2, s.w + pad * 2 / dpr, s.h);
      }
    }
    ctx.globalAlpha = 1;
  }
  function phoneTime() {
    var d = new Date, h = d.getHours() % 12 || 12, m = d.getMinutes();
    return h + ":" + (m < 10 ? "0" : "") + m;
  }
  function phoneLit(j) {
    var k = (performance.now() - (j.wake || j.t)) / 1e3;
    return k < 6 ? 1 : Math.max(.35, 1 - (k - 6) / 3 * .65);
  }
  function roundRect(x, X, Y, w, h, r) {
    x.beginPath();
    x.moveTo(X + r, Y);
    x.arcTo(X + w, Y, X + w, Y + h, r);
    x.arcTo(X + w, Y + h, X, Y + h, r);
    x.arcTo(X, Y + h, X, Y, r);
    x.arcTo(X, Y, X + w, Y, r);
    x.closePath();
  }
  function phoneArt(j) {
    var S = 3, PW = Math.round(j.w * S), PH = Math.round(PW * 2.05), c = j.art || (j.art = document.createElement("canvas"));
    if (c.width !== PW) {
      c.width = PW;
      c.height = PH;
    }
    var x = c.getContext("2d");
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.clearRect(0, 0, PW, PH);
    var R = PW * .17, lw = Math.max(2, PW * .025);
    roundRect(x, 0, 0, PW, PH, R);
    x.fillStyle = "#0c0e12";
    x.fill();
    var rim = x.createLinearGradient(0, 0, PW, 0);
    rim.addColorStop(0, "#6d7684");
    rim.addColorStop(.15, "#2a2f37");
    rim.addColorStop(1, "#1a1d22");
    x.lineWidth = lw * 1.6;
    x.strokeStyle = rim;
    x.stroke();
    x.lineWidth = lw * .6;
    x.strokeStyle = "#050608";
    roundRect(x, lw * .5, lw * .5, PW - lw, PH - lw, R * .95);
    x.stroke();
    var sx = PW * .07, sy = PH * .13, sw = PW * .86, sh = PH * .74;
    x.save();
    x.beginPath();
    x.rect(sx, sy, sw, sh);
    x.clip();
    var sky = x.createLinearGradient(0, sy, 0, sy + sh);
    sky.addColorStop(0, "#2b3f8f");
    sky.addColorStop(.38, "#e2577a");
    sky.addColorStop(.58, "#ffb15c");
    sky.addColorStop(.62, "#1d6f86");
    sky.addColorStop(1, "#0d3b52");
    x.fillStyle = sky;
    x.fillRect(sx, sy, sw, sh);
    x.fillStyle = "rgba(255,236,170,.95)";
    x.beginPath();
    x.arc(sx + sw * .62, sy + sh * .6, sw * .17, Math.PI, 0);
    x.fill();
    x.fillStyle = "rgba(255,220,150,.35)";
    for (var k = 0; k < 5; k++) x.fillRect(sx + sw * (.5 + k * .02), sy + sh * (.63 + k * .05), sw * (.24 - k * .04), sh * .012);
    x.strokeStyle = "#120a14";
    x.fillStyle = "#120a14";
    x.lineWidth = sw * .03;
    x.beginPath();
    x.moveTo(sx + sw * .05, sy + sh);
    x.quadraticCurveTo(sx + sw * .12, sy + sh * .6, sx + sw * .24, sy + sh * .42);
    x.stroke();
    for (var f = 0; f < 6; f++) {
      var a = -2.6 + f * .55;
      x.beginPath();
      x.moveTo(sx + sw * .24, sy + sh * .42);
      x.quadraticCurveTo(sx + sw * .24 + Math.cos(a) * sw * .2, sy + sh * .42 + Math.sin(a) * sw * .12 - sw * .06, sx + sw * .24 + Math.cos(a) * sw * .34, sy + sh * .42 + Math.sin(a) * sw * .2 + sw * .04);
      x.lineWidth = sw * .05 * (1 - f * .06);
      x.stroke();
    }
    x.fillStyle = "rgba(0,0,0,.18)";
    x.fillRect(sx, sy, sw, sh);
    x.textAlign = "center";
    x.fillStyle = "#fff";
    x.font = "300 " + (sw * .34).toFixed(1) + 'px -apple-system,"Helvetica Neue",Helvetica,Arial,sans-serif';
    x.fillText(phoneTime(), sx + sw / 2, sy + sh * .22);
    var nx = sx + sw * .04, ny = sy + sh * .33, nw = sw * .92, nh = sh * .17;
    roundRect(x, nx, ny, nw, nh, sw * .05);
    x.fillStyle = "rgba(240,242,248,.9)";
    x.fill();
    x.fillStyle = "#34c759";
    roundRect(x, nx + nh * .18, ny + nh * .2, nh * .6, nh * .6, nh * .14);
    x.fill();
    x.textAlign = "left";
    x.fillStyle = "#111";
    x.font = "700 " + (sw * .12).toFixed(1) + 'px -apple-system,"Helvetica Neue",Helvetica,Arial,sans-serif';
    x.fillText("Mum", nx + nh * .9, ny + nh * .44);
    x.font = "500 " + (sw * .092).toFixed(1) + 'px -apple-system,"Helvetica Neue",Helvetica,Arial,sans-serif';
    x.fillText(j.calls + " Missed Calls", nx + nh * .9, ny + nh * .82);
    x.strokeStyle = "#fff";
    x.lineWidth = sw * .008;
    x.strokeRect(sx + sw * .83, sy + sh * .012, sw * .11, sw * .05);
    x.fillStyle = "#ff3b30";
    x.fillRect(sx + sw * .84, sy + sh * .012 + sw * .01, sw * .018, sw * .03);
    x.strokeStyle = "rgba(255,255,255,.55)";
    x.lineWidth = sw * .008;
    x.beginPath();
    x.moveTo(sx + sw, sy + sh * .7);
    x.lineTo(sx + sw * .78, sy + sh * .78);
    x.lineTo(sx + sw * .7, sy + sh * .9);
    x.moveTo(sx + sw * .78, sy + sh * .78);
    x.lineTo(sx + sw * .9, sy + sh);
    x.stroke();
    x.restore();
    var gl = x.createLinearGradient(0, 0, PW, PH * .5);
    gl.addColorStop(0, "rgba(255,255,255,.12)");
    gl.addColorStop(.4, "rgba(255,255,255,0)");
    x.fillStyle = gl;
    roundRect(x, 0, 0, PW, PH, R);
    x.fill();
    x.fillStyle = "#22262d";
    roundRect(x, PW * .38, PH * .06, PW * .24, PW * .035, PW * .017);
    x.fill();
    x.beginPath();
    x.arc(PW * .29, PH * .065, PW * .025, 0, 7);
    x.fill();
    x.beginPath();
    x.arc(PW / 2, PH * .935, PW * .085, 0, 7);
    x.fillStyle = "#07080a";
    x.fill();
    x.lineWidth = PW * .012;
    x.strokeStyle = "#4a525e";
    x.stroke();
    x.beginPath();
    roundRect(x, PW / 2 - PW * .03, PH * .935 - PW * .03, PW * .06, PW * .06, PW * .012);
    x.lineWidth = PW * .006;
    x.strokeStyle = "#3a414b";
    x.stroke();
    j.artCalls = j.calls;
    j.artTime = phoneTime();
  }
  function drawPhone(j) {
    if (!j.calls) j.calls = 87;
    if (!j.art || j.artCalls !== j.calls || j.artTime !== phoneTime()) phoneArt(j);
    var c = j.art, PW = c.width, PH = c.height, L = j.w, D = L * 2.05 * .42, N = NS(30);
    ctx.fillStyle = "#050608";
    ctx.beginPath();
    ctx.moveTo(-L * .5, D * .5);
    ctx.lineTo(L * .5, D * .5);
    ctx.lineTo(L * .5, D * .5 + L * .035);
    ctx.lineTo(-L * .5, D * .5 + L * .035);
    ctx.fill();
    for (var k = 0; k < N; k++) {
      var v0 = k / N, v1 = (k + 1) / N, sc = .72 + .28 * (v0 + v1) / 2;
      var y0 = -D / 2 + v0 * D, y1 = -D / 2 + v1 * D;
      ctx.drawImage(c, 0, v0 * PH, PW, (v1 - v0) * PH, -L * sc / 2, y0, L * sc, y1 - y0 + .6);
    }
    var lit = phoneLit(j);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = .18 * lit;
    var g = ctx.createRadialGradient(0, 0, 0, 0, 0, L * .7);
    g.addColorStop(0, "rgba(255,170,140,1)");
    g.addColorStop(1, "rgba(255,120,120,0)");
    ctx.fillStyle = g;
    ctx.fillRect(-L * .7, -L * .7, L * 1.4, L * 1.4);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }
  var sign = null;
  function signRect() {
    var F = R.floor, im = pics.junk_sign;
    if (!F || !im) return null;
    var w = Math.max(84, Math.min(118, W * .076)), h = w * im.naturalHeight / im.naturalWidth;
    return {
      x: F.x + F.w * .575,
      y: groundY() + 10 - h * .5,
      w: w,
      h: h
    };
  }
  function drawSign() {
    var r = signRect();
    if (!r) return;
    if (!sign) {
      sign = tinted(pics.junk_sign, null, .2);
      var sx = sign.getContext("2d"), g = sx.createLinearGradient(0, sign.height * .66, 0, sign.height);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,1)");
      sx.globalCompositeOperation = "destination-out";
      sx.fillStyle = g;
      sx.fillRect(0, 0, sign.width, sign.height);
    }
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.drawImage(sign, -r.w / 2, -r.h / 2, r.w, r.h);
    ctx.restore();
  }
  var SIGN_ON = true;
  function drawJunk() {
    for (var i = 0; i < junk.length; i++) {
      var j = junk[i];
      ctx.save();
      ctx.translate(j.x, j.y);
      ctx.rotate(j.rot);
      if (j.name === "junk_besser") floatRope(j);
      if (j.name === "junk_phone" && j.buzz > 0) ctx.translate(Math.sin(performance.now() * .09) * 2 * j.buzz, 0);
      if (j.name === "junk_phone") drawPhone(j); else ctx.drawImage(j.pic, -j.w / 2, -j.h / 2, j.w, j.h);
      ctx.restore();
    }
  }
  function drawRipples(now) {
    for (var i = ripples.length - 1; i >= 0; i--) {
      var r = ripples[i], k = (now - r.t) / 700;
      if (k >= 1) {
        ripples.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = .3 * (1 - k);
      ctx.strokeStyle = "#cfe3ea";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 6 + 34 * Math.sqrt(k), 0, 7);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  var snowB = null;
  function drawSnow() {
    var l = ready ? at(LURE) : null, R = fw * .9;
    ctx.fillStyle = "#cfe3ea";
    if (OLD.snow) {
      for (var q = 0; q < snow.length; q++) {
        var f = snow[q], a = f.a * jl;
        if (l) {
          var d = Math.hypot(f.x - l.x, f.y - l.y);
          if (d < R) a += (1 - d / R) * .6 * light;
        }
        ctx.globalAlpha = Math.min(1, a);
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, 7);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      return;
    }
    var B = snowB || (snowB = {}), k, ks = [];
    for (var q = 0; q < snow.length; q++) {
      var f = snow[q], a = f.a * jl;
      if (l) {
        var d = Math.hypot(f.x - l.x, f.y - l.y);
        if (d < R) a += (1 - d / R) * .6 * light;
      }
      k = Math.round(Math.min(1, a) * 200);
      if (!k) continue;
      (B[k] || (B[k] = [])).push(f);
    }
    for (k in B) {
      var L = B[k];
      if (!L.length) continue;
      ctx.globalAlpha = k / 200;
      ctx.beginPath();
      for (q = 0; q < L.length; q++) {
        f = L[q];
        ctx.moveTo(f.x + f.r, f.y);
        ctx.arc(f.x, f.y, f.r, 0, 7);
      }
      ctx.fill();
      L.length = 0;
    }
    ctx.globalAlpha = 1;
  }
  function drawSchool(t) {
    if (!school) return;
    for (var i = 0; i < school.fish.length; i++) {
      var f = school.fish[i], sx = -f.turn;
      if (Math.abs(sx) < .06) sx = sx < 0 ? -.06 : .06;
      ctx.save();
      ctx.globalAlpha = f.a * jl * Math.max(0, Math.min(1, f.y / (H * .12)));
      ctx.translate(f.x, f.y);
      ctx.scale(sx, 1);
      swimStrips(f.pic, f.w, f.h, f.phase, f.h * .06, still ? 1 : 14);
      ctx.restore();
    }
  }
  function drawJellies(t, z0, z1) {
    for (var i = 0; i < jellies.length; i++) {
      var j = jellies[i], p = j.ph, BELLj = j.bell;
      if (j.z < z0 || j.z >= z1) continue;
      var c = p < .3 ? Math.sin(p / .3 * Math.PI) : 0;
      var bx = 1 - j.sq * c, by = 1 + j.sq * .5 * c;
      if (j.halo) drawHalo(j.halo, j.x - j.w * bx / 2, j.y, j.w * bx, j.h, (.09 + .12 * c + j.boost * .22) * (.45 + .55 * j.z) * jl * Math.max(0, Math.min(1, j.y / (H * .18))));
      var pic = j.pic, iw = pic.width, ih = pic.height, N = NS(44);
      ctx.globalAlpha = j.a * jl * Math.max(0, Math.min(1, j.y / (H * .18)));
      var y = j.y;
      for (var k = 0; k < N; k++) {
        var v0 = k / N, v1 = (k + 1) / N, v = (v0 + v1) / 2;
        var tail = Math.max(0, (v - BELLj) / (1 - BELLj));
        var sx = v < BELLj ? bx : bx + (1 - bx) * Math.min(1, tail / .2);
        var hh = (v1 - v0) * j.h * (v < BELLj ? by : 1);
        var off = still ? 0 : Math.pow(tail, 1.3) * (j.w * .06 * Math.sin(v * Math.PI * 2.2 - t * 1.1 + j.sw) - j.vx * .5 * tail);
        var ww = j.w * sx;
        var ya = Math.round(y * dpr) / dpr, yb = Math.round((y + hh) * dpr) / dpr;
        if (yb > ya) ctx.drawImage(pic, 0, v0 * ih, iw, (v1 - v0) * ih, j.x - ww / 2 + off, ya, ww, yb - ya);
        y += hh;
      }
      if (j.rainbow && !still) {
        var hp = (t * .6 + j.sw) % 6, h0 = Math.floor(hp), fr = hp - h0;
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = .35 * (1 - fr) * jl;
        ctx.drawImage(j.rainbow[h0], j.x - j.w * bx / 2, j.y, j.w * bx, j.h);
        ctx.globalAlpha = .35 * fr * jl;
        ctx.drawImage(j.rainbow[(h0 + 1) % 6], j.x - j.w * bx / 2, j.y, j.w * bx, j.h);
        ctx.globalCompositeOperation = "source-over";
      }
      if (j.boost > .01) {
        if (!j.glow) {
          var g = document.createElement("canvas");
          g.width = iw;
          g.height = ih;
          var gx = g.getContext("2d");
          gx.drawImage(pic, 0, 0);
          gx.globalCompositeOperation = "destination-in";
          var lg = gx.createLinearGradient(0, 0, 0, ih);
          lg.addColorStop(0, "#000");
          lg.addColorStop(Math.min(.9, BELLj * .8), "#000");
          lg.addColorStop(Math.min(1, BELLj * 1.9), "rgba(0,0,0,0)");
          lg.addColorStop(1, "rgba(0,0,0,0)");
          gx.fillStyle = lg;
          gx.fillRect(0, 0, iw, ih);
          j.glow = g;
        }
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = j.boost * .35 * jl;
        ctx.drawImage(j.glow, j.x - j.w * bx / 2, j.y, j.w * bx, j.h + j.h * BELLj * (by - 1));
        ctx.globalCompositeOperation = "source-over";
      }
    }
    ctx.globalAlpha = 1;
  }
  var PROF = /fishprof/.test(location.search) ? {} : null, pT = 0;
  function mark(k) {
    if (!PROF) return;
    var t = performance.now();
    PROF[k] = (PROF[k] || 0) + t - pT;
    pT = t;
  }
  if (PROF) window.__prof = function() {
    var o = PROF;
    PROF = {
      n: 0
    };
    return o;
  };
  function draw(now) {
    if (PROF) {
      pT = performance.now();
      PROF.n = (PROF.n || 0) + 1;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var t = now / 1e3;
    if (jready && cast) {
      setRects(now);
      if (!off("dark")) makeLight(t);
      mark("light");
      if (!off("sub")) drawSub(now);
      if (!off("giant")) drawGiant();
      mark("giant");
      if (!off("far")) drawFar();
      mark("far");
      if (!off("snow")) drawSnow();
      mark("snow");
      if (!off("jelly")) drawJellies(t, 0, SEABED);
      mark("jelly");
      if (!off("swim")) drawSwimmers(0, SEABED);
      mark("swim");
      if (school && school.z < SEABED && !off("school")) drawSchool(t);
      mark("school");
      if (off("dark")) drawFloor(t); else if (!off("set")) inTheDark(function() {
        drawFloor(t);
      });
      drawSilt();
      mark("set");
      drawJunk();
      drawBones();
      drawFood(t);
      mark("junk");
      if (!off("jelly")) drawJellies(t, SEABED, 2);
      mark("jelly");
      if (!off("swim")) drawSwimmers(SEABED, 2);
      mark("swim");
      if (school && school.z >= SEABED && !off("school")) drawSchool(t);
      mark("school");
    }
    if (ready && !off("angler")) drawAngler(now, t);
    mark("angler");
    if (window.mmRigDraw) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      window.mmRigDraw(ctx, now);
    }
    if (jready && cast && !off("fore")) drawFore();
    mark("fore");
    if (jready && cast && !off("weed")) drawWeed(t);
    mark("weed");
    if (ripples.length) drawRipples(now);
  }
  var gulp = {
    next: 0,
    thump: 0,
    ang: 0,
    recoil: 0,
    spat: -1e4
  }, mbub = [];
  function mouthBubble(r, push) {
    if (!ready) return;
    var m = at(MOUTH), sp = rnd(40, 140) * push * 3;
    mbub.push({
      x: m.x - fish.dir * fw * .04,
      y: m.y,
      vx: -fish.dir * sp + rnd(-20, 20),
      vy: rnd(-60, -10) * push * 2 - 20,
      r: r,
      t: performance.now(),
      life: rnd(1200, 2200),
      ph: rnd(0, 6)
    });
    if (mbub.length > 60) mbub.splice(0, mbub.length - 60);
  }
  function spit(now, show) {
    jawTo = 0;
    lightTo = 1;
    biteAgain = now + 2200;
    gulp.spat = now;
    gulp.recoil = 1;
    gulp.thump = 0;
    var m = at(MOUTH);
    for (var i = 0; i < 24; i++) mouthBubble(i < 4 ? rnd(10, 17) : rnd(3, 8), 1.3);
    fish.vx += fish.dir * 90;
    gloveHidden(false);
    if (show) flyGlove(m.x - ptr.x, m.y - ptr.y);
  }
  function flyGlove(dx, dy) {
    gloveEl = gloveEl || document.getElementById("glove");
    if (!gloveEl || still) return;
    var el = gloveEl, t0 = performance.now(), HOLD = 90, D = 620, spin = -fish.dir * (280 + Math.random() * 140);
    var cx = dx - fish.dir * Math.max(140, fw * .8), cy = dy - 60;
    (function go() {
      var ms = performance.now() - t0, k = Math.max(0, Math.min(1, (ms - HOLD) / D)), t = 1 - Math.pow(1 - k, 2.2), o = 1 - t;
      var x = o * o * dx + 2 * o * t * cx, y = o * o * dy + 2 * o * t * cy;
      el.style.translate = x.toFixed(1) + "px " + y.toFixed(1) + "px";
      el.style.rotate = (spin * o).toFixed(1) + "deg";
      el.style.scale = (.45 + .55 * Math.min(1, k * 2.2)).toFixed(3);
      if (k < 1) requestAnimationFrame(go); else {
        el.style.translate = "";
        el.style.rotate = "";
        el.style.scale = "";
      }
    })();
  }
  function drawMouthBubbles(now) {
    if (!mbub.length) return;
    var s = Math.min(.05, (now - (drawMouthBubbles.t || now)) / 1e3);
    drawMouthBubbles.t = now;
    for (var i = mbub.length - 1; i >= 0; i--) {
      var b = mbub[i], k = (now - b.t) / b.life;
      if (k >= 1) {
        mbub.splice(i, 1);
        continue;
      }
      b.vx *= Math.pow(.15, s);
      b.vy += (-(30 + b.r * 5) - b.vy) * Math.min(1, s * 2.5);
      b.x += (b.vx + Math.sin(now / 180 + b.ph) * b.r * 2) * s;
      b.y += b.vy * s;
      var a = (1 - k) * Math.min(1, k * 8);
      if (!(a > .01)) continue;
      ctx.globalAlpha = a * .7;
      ctx.strokeStyle = "rgba(175,210,240,1)";
      ctx.lineWidth = Math.max(.6, b.r * .14);
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, 7);
      ctx.stroke();
      if (b.r > 3) {
        ctx.globalAlpha = a * .85;
        ctx.fillStyle = "rgba(225,240,250,1)";
        ctx.beginPath();
        ctx.arc(b.x + b.r * .38, b.y - b.r * .4, Math.max(.5, b.r * .18), 0, 7);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
  var gImg = null;
  function gloveInMouth(now) {
    if (jawTo !== 1 || gulp.snack || mode === "dark" || lungeNote) return;
    gImg = gImg || document.querySelector("#glove img");
    if (!gImg || !gImg.naturalWidth) return;
    var M = at(MOUTH), dd = fish.dir, gw = fw * .38, gh = gw * gImg.naturalHeight / gImg.naturalWidth;
    var th = gulp.thump * gulp.thump, wig = Math.sin(now / 110) * .08 + th * Math.sin(gulp.ang) * .5;
    var tx = M.x + dd * fw * .17 + Math.cos(gulp.ang) * 5 * th, ty = M.y + fh * .02 + Math.sin(gulp.ang) * 4 * th;
    var rot = Math.atan2(.3, dd) + 2.356 + wig;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = seen;
    ctx.translate(tx, ty);
    ctx.rotate(rot);
    ctx.drawImage(gImg, -gw * .17, -gh * .15, gw, gh);
    ctx.restore();
  }
  var sputterUntil = 0, gm = 1, gmNext = 0, gmTo = 1;
  function glowMul(now) {
    if (now >= sputterUntil) {
      gm += (1 - gm) * .15;
      return gm;
    }
    if (now > gmNext) {
      gmNext = now + rnd(50, 160);
      gmTo = Math.random() < .22 ? rnd(.7, 1) : rnd(.05, .3);
    }
    gm += (gmTo - gm) * .5;
    return gm;
  }
  var EYE = {
    x: .383,
    y: .399
  }, coughs = 0, pokes = 0, lastPoke = 0, eyeFlare = 0, bones = [];
  function pokeAngler(now) {
    if (now - lastPoke < 350 || mode === "lunge" || mode === "dark" || jawTo === 1) return;
    lastPoke = now;
    pokes++;
    var away = fish.x < ptr.x ? -1 : 1;
    if (pokes === 1) {
      gulp.thump = 1;
      gulp.ang = away > 0 ? 0 : Math.PI;
      eyeFlare = 1;
      fish.vx += away * 70;
      turnTo(ptr.x < fish.x ? 1 : -1, 150, now, 0);
      biteAgain = Math.max(biteAgain, now + 1500);
      T("angler_poke_1");
    } else if (pokes === 2) {
      sputterUntil = now + 2600;
      eyeFlare = .6;
      gulp.thump = .6;
      fish.vx *= .2;
      fish.vy *= .2;
      biteAgain = Math.max(biteAgain, now + 3500);
      setMode("wander", now);
      fish.next = now + 3500;
      fish.tx = fish.x;
      fish.ty = fish.y;
      T("angler_poke_2");
    } else {
      pokes = 0;
      var m = at(MOUTH);
      gulp.recoil = 1;
      gulp.spat = now;
      gulp.thump = 1;
      jawTo = 0;
      for (var i = 0; i < 18; i++) mouthBubble(i < 3 ? rnd(8, 14) : rnd(2.5, 6), 1.2);
      bones.push({
        x: m.x,
        y: m.y,
        vx: -fish.dir * rnd(120, 170),
        vy: -30,
        rot: 0,
        vr: -fish.dir * rnd(1.5, 2.5),
        landed: false,
        w: Math.max(46, fw * .3),
        flip: fish.dir < 0,
        kind: coughs++ % 2 ? "junk_bone_b" : "junk_bone"
      });
      if (bones.length > 6) bones.splice(bones.findIndex(function(b) {
        return b.landed;
      }) >>> 0, 1);
      lightTo = 1;
      biteAgain = Math.max(biteAgain, now + 5e3);
      var side = fish.x < W / 2 ? -1 : 1;
      setMode("hide", now);
      fish.hideSide = side;
      fish.hideUntil = now + rnd(9e3, 12e3);
      fish.hidT = 0;
      fish.tx = side > 0 ? W + fw * .05 : -fw * .05;
      fish.ty = Math.max(H * .5, Math.min(H * .66, groundY() - fh * .9));
      T("angler_poke_3");
    }
  }
  function stepBones(s) {
    var gy = groundY();
    for (var i = 0; i < bones.length; i++) {
      var b = bones[i];
      if (b.landed) continue;
      b.vy += (70 - b.vy) * Math.min(1, s * 1.5);
      b.x += b.vx * s;
      b.vx *= Math.pow(.2, s);
      b.y += b.vy * s;
      b.rot += b.vr * s;
      b.vr *= Math.pow(.5, s);
      if (b.y >= gy - 2) {
        b.y = gy - 2;
        b.landed = true;
        b.rot = Math.round(b.rot / Math.PI) * Math.PI * .05;
        kickSilt(b.x, gy, 6, 40);
      }
    }
  }
  function drawBones() {
    for (var i = 0; i < bones.length; i++) {
      var b = bones[i];
      var im = pics[b.kind || "junk_bone"];
      if (!im) {
        continue;
      }
      if (!b.pic) {
        var c = document.createElement("canvas");
        c.width = im.naturalWidth;
        c.height = im.naturalHeight;
        var x = c.getContext("2d");
        x.drawImage(im, 0, 0);
        x.globalCompositeOperation = "color";
        x.fillStyle = "#d6cdb4";
        x.fillRect(0, 0, c.width, c.height);
        x.globalCompositeOperation = "destination-in";
        x.drawImage(im, 0, 0);
        x.globalCompositeOperation = "source-atop";
        x.fillStyle = "rgba(18,16,12,.32)";
        x.fillRect(0, 0, c.width, c.height);
        b.pic = c;
        b.h = b.w * im.naturalHeight / im.naturalWidth;
      }
      ctx.save();
      ctx.translate(b.x, b.y - b.h * .35);
      ctx.rotate(b.rot);
      if (b.flip) ctx.scale(-1, 1);
      ctx.drawImage(b.pic, -b.w / 2, -b.h / 2, b.w, b.h);
      ctx.restore();
    }
  }
  function drawEyeFlare(bob) {
    if (eyeFlare < .01) return;
    var e = at(EYE), r = fw * .09 * (1 + eyeFlare * .6);
    e.y += bob;
    ctx.globalCompositeOperation = "lighter";
    var g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r * 2.2);
    g.addColorStop(0, "rgba(170,250,255," + .8 * eyeFlare + ")");
    g.addColorStop(.35, "rgba(80,200,240," + .35 * eyeFlare + ")");
    g.addColorStop(1, "rgba(20,80,120,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(e.x, e.y, r * 2.2, 0, 7);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }
  function drawAngler(now, t) {
    fish.phase += (now - (draw.t || now)) / 1e3 * fish.beat * Math.PI * 2;
    draw.t = now;
    var bob = still ? 0 : Math.sin(t * .8) * fh * .012;
    var X = fish.x, Y = fish.y + bob + lift(), K = mode === "lunge" ? 1.06 : 1;
    if (!jawPics.length) makeJaw();
    jaw += (jawTo - jaw) * (jawTo > jaw ? .55 : now - gulp.spat < 400 ? .5 : .08);
    var pic = jawPics[Math.round(jaw * 4)] || img;
    var fc = fishLayer(), out = ctx;
    ctx = fc;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, fc.canvas.width, fc.canvas.height);
    var bx0 = Math.floor((X - fw * .9) * dpr), by0 = Math.floor((Y - fh) * dpr);
    var iw = pic.width || img.naturalWidth, ih = pic.height || img.naturalHeight, N = NS(96);
    var amp = fh * (.022 + Math.min(.03, fish.beat * .012)) * (1 + 1.8 * (fish.swish || 0));
    var cs = [], xs = [], acc = 0, sw = fw / N, i, mid;
    for (i = 0; i < N; i++) {
      var c = still ? fish.dir : cOf((i + .5) / N);
      cs.push(c);
      xs.push(acc);
      acc += c * sw;
    }
    mid = acc / 2;
    for (i = N - 1; i >= 0; i--) {
      var u0 = i / N, u1 = (i + 1) / N, u = (u0 + u1) / 2, body = Math.max(0, (u - .32) / .68);
      var off = still ? 0 : amp * Math.pow(body, 1.5) * Math.sin(u * Math.PI * 1.8 - fish.phase);
      var E = X + (xs[i] - mid) * K;
      ctx.setTransform(dpr * K * cs[i], 0, 0, dpr * K, dpr * (E + cs[i] * K * fw / 2) - bx0, dpr * Y - by0);
      ctx.globalAlpha = fish.P < 1 ? Math.min(1, Math.abs(cs[i]) / .45) : 1;
      ctx.drawImage(pic, u0 * iw, 0, (u1 - u0) * iw, ih, -fw / 2, -fh / 2 + off, sw + .35, fh);
    }
    var GM = glowMul(now), eraseA = light < .999 ? 1 - light : (1 - GM) * .7;
    if (eraseA > .001) {
      var el = at(LURE), Rc0 = fw * .16;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = eraseA;
      ctx.globalCompositeOperation = "destination-out";
      var ex = el.x * dpr - bx0, ey = (el.y + bob) * dpr - by0, er = Rc0 * dpr, g0 = ctx.createRadialGradient(ex, ey, 0, ex, ey, er);
      g0.addColorStop(0, "#000");
      g0.addColorStop(.8, "#000");
      g0.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g0;
      ctx.beginPath();
      ctx.arc(ex, ey, er, 0, 7);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.globalAlpha = 1;
    ctx = out;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    gloveInMouth(now);
    ctx.globalAlpha = seen * (fish.P < 1 ? 1 - .2 * Math.sin(Math.PI * fish.P) : 1);
    if (gulp.thump > .01 || gulp.recoil > .01) {
      var cw = fc.canvas.width, ch = fc.canvas.height, th = gulp.thump * gulp.thump, bu = 1 + .07 * th;
      var jx = Math.cos(gulp.ang) * 5 * dpr * th, jy = Math.sin(gulp.ang) * 4 * dpr * th, rot = gulp.recoil * .11 * Math.sin((now - gulp.spat) * .045);
      ctx.translate(bx0 + cw / 2 + jx, by0 + ch / 2 + jy);
      ctx.rotate(rot);
      ctx.drawImage(fc.canvas, -cw * bu / 2, -ch * (2 - bu) / 2, cw * bu, ch * (2 - bu));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    } else ctx.drawImage(fc.canvas, bx0, by0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
    drawMouthBubbles(now);
    eyeFlare = Math.max(0, eyeFlare - .012);
    drawEyeFlare(bob);
    light += (lightTo - light) * (lightTo > light ? .025 : 1);
    var l = at(LURE);
    l.y += bob;
    if (fish.lx == null || Math.hypot(l.x - fish.lx, l.y - fish.ly) > fw * 2) {
      fish.lx = l.x;
      fish.ly = l.y;
    } else {
      fish.lx += (l.x - fish.lx) * .3;
      fish.ly += (l.y - fish.ly) * .3;
    }
    l = {
      x: fish.lx,
      y: fish.ly
    };
    var R = fw * LURE_R * 1.25, Rc = fw * .16;
    if (light * gm > .01) {
      var pulse = (still ? 1 : .75 + .25 * Math.sin(t * 2.1) + .08 * Math.sin(t * 7.3)) * gm;
      ctx.globalCompositeOperation = "lighter";
      var g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, R * 2.2);
      g.addColorStop(0, "rgba(140,240,255," + .35 * pulse * light + ")");
      g.addColorStop(.25, "rgba(60,170,210," + .14 * pulse * light + ")");
      g.addColorStop(1, "rgba(20,60,90,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(l.x, l.y, R * 2.2, 0, 7);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }
  }
  function frame(now) {
    if (!visible) {
      running = false;
      return;
    }
    requestAnimationFrame(frame);
    var dt = Math.min(50, now - (last || now));
    last = now;
    var p0 = PROF && performance.now();
    if (ready) step(now, dt);
    if (jready) stepJellies(now, dt);
    if (PROF) PROF.step = (PROF.step || 0) + performance.now() - p0;
    draw(now);
    if (ready) {
      var mo = at(MOUTH), cr = cv.getBoundingClientRect();
      window.mmAngler = {
        ok: true,
        x: cr.left + mo.x,
        y: cr.top + mo.y,
        dir: fish.dir
      };
    }
  }
  window.mmAnglerSnap = function() {
    var now = performance.now();
    if (!ready) return false;
    if ((mode === "wander" || mode === "lure") && now > biteAgain && fish.P >= 1 && !bites) {
      onLure = 0;
      stalk = 0;
      sputterUntil = now + 700;
      setMode("dark", now);
      return "bite";
    }
    if (jawTo !== 1) {
      jawTo = 1;
      gulp.thump = 1;
      gulp.ang = 0;
      for (var i = 0; i < 6; i++) mouthBubble(rnd(2, 5), .5);
      setTimeout(function() {
        if (mode !== "lunge" && mode !== "retreat") jawTo = 0;
      }, 420);
    }
    return "gulp";
  };
  function start() {
    if (running || still || !(ready || jready)) return;
    running = true;
    last = 0;
    requestAnimationFrame(frame);
  }
  var io = new IntersectionObserver(function(es) {
    visible = es[0].isIntersecting;
    if (!visible && jawTo === 1) letGo();
    if (visible && !img.src) {
      img.onload = function() {
        ready = true;
        size();
        start();
      };
      img.src = cv.getAttribute("data-src");
      loadDeep(cv.getAttribute("data-dir"));
    }
    if (visible) start();
  }, {
    rootMargin: "400px 0px"
  });
  io.observe(cv);
  layer = document.createElement("canvas").getContext("2d");
  lightMap = document.createElement("canvas").getContext("2d");
  setLayer = document.createElement("canvas").getContext("2d");
  wl = document.createElement("canvas").getContext("2d");
  darkC = document.createElement("canvas");
  addEventListener("resize", function() {
    if (ready || jready) size();
  }, {
    passive: true
  });
  if (/fishdebug/.test(location.search)) {
    window.__fish = function() {
      var l = at(LURE), r = cv.getBoundingClientRect();
      return {
        x: l.x + r.left,
        y: l.y + r.top,
        mode: mode,
        light: light,
        P: fish.P,
        dir: fish.dir,
        fx: fish.x + r.left,
        fy: fish.y + r.top
      };
    };
    window.__drifters = function() {
      var r = cv.getBoundingClientRect();
      return jellies.map(function(j) {
        return {
          kind: j.kind,
          x: j.x + r.left,
          y: j.y + j.h * .3 + r.top,
          boost: j.boost,
          vx: j.vx,
          vy: j.vy
        };
      });
    };
    window.__sea = function() {
      return {
        silt: silt.length,
        smoke: smoke.length,
        ground: groundY(),
        floor: R.floor,
        worms: worms.map(function(w) {
          return +w.out.toFixed(2);
        }),
        swim: swimmers.map(function(m) {
          return [ m.kind, m.x | 0, m.y | 0, m.flee ];
        })
      };
    };
    window.__junk = function() {
      JUNK.forEach(function(n, i) {
        lastJunk = -1e9;
        dropJunk(W * (.08 + .115 * i), H * .2, performance.now());
      });
      return junk.length;
    };
    window.__sub = function(go) {
      if (go) {
        giant.on = false;
        giant.next = performance.now() + 1e9;
        sub.next = 1;
      }
      return {
        on: sub.on,
        p: sub.p,
        next: sub.next,
        w: sub.w,
        y: sub.y,
        pic: !!pics.sub
      };
    };
    window.__school = function() {
      return school ? {
        x: school.cx,
        y: school.cy
      } : null;
    };
    window.__feed = function(x, y) {
      for (var i = 0; i < 6; i++) flake(x, y, 10);
    };
    window.__food = function() {
      return {
        food: food.filter(function(f) {
          return !f.dead;
        }).length,
        junk: junk.map(function(j) {
          return [ j.name, j.landed, Math.round(j.x), Math.round(j.y) ];
        }),
        mode: mode
      };
    };
    window.__boostAll = function() {
      jellies.forEach(function(j) {
        j.boost = 1;
      });
    };
    window.__jaw = function() {
      if (!jawPics.length) makeJaw();
      return jawPics.map(function(c) {
        return c.toDataURL();
      });
    };
    window.__pose = function(P, d) {
      fish.dirFrom = d;
      fish.dir = -d;
      fish.P = P;
      posed = true;
      draw(performance.now());
    };
    window.__turn = function() {
      fish.lastTurn = -1e9;
      fish.tx = fish.dir > 0 ? W - fw : fw;
      fish.ty = fish.y;
      fish.next = performance.now() + 6e4;
    };
  }
})();
