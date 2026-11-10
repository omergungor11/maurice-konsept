(function() {
  "use strict";
  var specs = document.querySelector(".specs");
  var nav = document.querySelector(".nav--home");
  var dup = document.querySelectorAll(".nav--home .nav__dup,.nav--home .nav__hidden");
  var liqCv = document.querySelector("canvas.hero__liquid"), navUl = document.querySelector(".nav--home ul"), NAVCLEAR = 40, NAVFADE = 120;
  var pin = window.matchMedia("(min-width:769px)");
  var still = window.matchMedia("(prefers-reduced-motion:reduce)");
  var block = document.querySelector(".hero__name");
  var subEl = document.querySelector(".hero__sub");
  var mark = document.querySelector(".hero .wordmark");
  var burstCv = document.getElementById("hero-burst");
  var menuEl = document.getElementById("menu");
  var BURST = null;
  var targetP = 0, viewP = 0, vel = 0, raf = 0, lastT = 0, SMOOTH = 900, snapped = false;
  function damp(t) {
    raf = 0;
    var dt = lastT ? Math.min(64, t - lastT) : 16.7;
    lastT = t;
    if (!snapped) {
      snapped = true;
      viewP = targetP;
      vel = 0;
    }
    var d = targetP - viewP;
    if (Math.abs(d) < .0012 && Math.abs(vel) < 4e-4) {
      viewP = targetP;
      vel = 0;
    } else {
      var om = 2 / SMOOTH, x = om * dt, ex = 1 / (1 + x + .48 * x * x + .235 * x * x * x);
      var ch = viewP - targetP, tmp = (vel + om * ch) * dt;
      vel = (vel - om * tmp) * ex;
      viewP = targetP + (ch + tmp) * ex;
      raf = requestAnimationFrame(damp);
    }
    BURST.draw(viewP);
  }
  if (!specs && !nav) return;
  var tick = false;
  var FALL_VH = .15, LEAD = .06;
  var SUBFADE = .12;
  var SPECSFADE = .035;
  var SPECSBEAT = .045;
  var SUCK = 8, OPTAIL = .65;
  var RISE_VH = .18;
  var G = null;
  function measure() {
    G = null;
    document.documentElement.classList.remove("pin-live");
    document.documentElement.classList.remove("burst-live");
    if (BURST) BURST.clear();
    if (!block || still.matches) return;
    if (window.matchMedia("(max-width:768px)").matches && !window.matchMedia("(hover:hover) and (pointer:fine)").matches) return;
    if (!BURST) {
      block.style.transform = "";
      block.style.transformOrigin = "";
      G = {
        fall: window.innerHeight * FALL_VH,
        liquid: true
      };
      return;
    }
    if (!pin.matches) return;
    var pt = block.style.transform, po = block.style.transformOrigin;
    block.style.transform = "";
    block.style.transformOrigin = "";
    var br = block.getBoundingClientRect(), wr = block.querySelector(".wordmark").getBoundingClientRect();
    var oy = wr.top + wr.height / 2 - br.top;
    block.style.transform = pt;
    block.style.transformOrigin = po;
    G = {
      fall: window.innerHeight * FALL_VH,
      oy: oy,
      rise: window.innerHeight * RISE_VH
    };
    block.style.transformOrigin = "50% " + oy.toFixed(1) + "px";
    document.documentElement.classList.add("pin-live");
    block.style.transform = "translateY(" + (-oy).toFixed(1) + "px)";
    document.documentElement.classList.remove("burst-live");
    if (BURST && BURST.measure()) document.documentElement.classList.add("burst-live");
  }
  function paint() {
    tick = false;
    var y = window.scrollY || 0;
    var o = 1 - Math.min(1, y / (window.innerHeight * .25));
    var og = 1 - Math.min(1, y / (window.innerHeight * SPECSFADE));
    if (G && G.fall) {
      var subEnd = G.fall * (LEAD + SUBFADE * (1 - LEAD));
      og = 1 - Math.max(0, Math.min(1, (y - subEnd) / (window.innerHeight * SPECSBEAT)));
    }
    if (specs) {
      specs.style.opacity = og.toFixed(3);
      specs.style.pointerEvents = og < .05 ? "none" : "";
    }
    var shed = pin.matches ? o : 1;
    if (pin.matches && liqCv && liqCv.offsetHeight && navUl) {
      var lr = liqCv.getBoundingClientRect(), inkF = +liqCv.dataset.inkTop || 0;
      var room = inkF * lr.height, LN = window.LiquidName, reach = Math.max(Math.min(y, room), LN && LN.smear ? LN.smear() * room : 0);
      var tip = lr.top + room - reach;
      var nb = navUl.getBoundingClientRect().bottom;
      shed = Math.min(shed, Math.max(0, Math.min(1, (tip - nb - NAVCLEAR) / NAVFADE)));
    }
    for (var i = 0; i < dup.length; i++) {
      dup[i].style.opacity = shed.toFixed(3);
      dup[i].style.visibility = shed < .05 ? "hidden" : "";
    }
    if (!G) {
      if (block) {
        block.style.transform = "";
        block.style.opacity = "";
        block.style.visibility = "";
        block.style.transformOrigin = "";
      }
      if (subEl) {
        subEl.style.opacity = "";
        subEl.style.visibility = "";
      }
    } else if (G.liquid) {
      var pfs = Math.max(0, Math.min(1, (y / G.fall - LEAD) / (1 - LEAD)));
      var so = Math.max(0, 1 - pfs / SUBFADE);
      if (subEl) {
        subEl.style.opacity = so.toFixed(3);
        subEl.style.visibility = so < .02 ? "hidden" : "";
      }
    } else {
      var pf = Math.max(0, Math.min(1, (y / G.fall - LEAD) / (1 - LEAD)));
      var op;
      if (BURST && BURST.isReady()) {
        block.style.transform = "translateY(" + (-G.oy).toFixed(1) + "px)";
        targetP = pf;
        if (!raf) {
          lastT = 0;
          raf = requestAnimationFrame(damp);
        }
        var sub = Math.max(0, 1 - pf / SUBFADE);
        block.style.opacity = sub.toFixed(3);
        block.style.visibility = sub < .02 ? "hidden" : "";
        if (menuEl) {
          var vh = window.innerHeight || 1, mt = menuEl.getBoundingClientRect().top;
          var byPos = Math.max(0, Math.min(1, (mt - vh * .1) / (vh * .3)));
          var byProg = Math.max(0, Math.min(1, (1 - viewP) / .18));
          burstCv.style.opacity = Math.min(byPos, byProg).toFixed(3);
        }
        op = -1;
      } else {
        op = Math.min(1, (1 - pf) / OPTAIL);
        block.style.transform = "translateY(" + (-G.oy).toFixed(1) + "px)";
      }
      if (op >= 0) {
        block.style.opacity = op.toFixed(3);
        block.style.visibility = op < .02 ? "hidden" : "";
      }
    }
    if (nav) nav.classList.remove("nav--stuck");
  }
  addEventListener("scroll", function() {
    if (tick) return;
    tick = true;
    requestAnimationFrame(paint);
  }, {
    passive: true
  });
  addEventListener("liquidsmear", function() {
    if (tick) return;
    tick = true;
    requestAnimationFrame(paint);
  });
  addEventListener("resize", function() {
    measure();
    if (tick) return;
    tick = true;
    requestAnimationFrame(paint);
  }, {
    passive: true
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function() {
    measure();
    paint();
  });
  measure();
  paint();
})();
