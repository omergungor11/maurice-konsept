(function() {
  "use strict";
  var KEY = "mm_perf", forced = (location.search.match(/[?&]perf=(\d)/) || [])[1];
  var level = 0;
  try {
    level = +(sessionStorage.getItem(KEY) || 0);
  } catch (e) {}
  if (forced != null) level = +forced;
  var P = window.mmPerf = {
    level: level
  };
  P.dirty = function(g) {
    var all = /[?&]dirty=0/.test(location.search), cur = null, pb = null, cv = g.canvas, sz = cv.width + "x" + cv.height;
    function grow(b, x, y) {
      if (!b) return {
        x0: x,
        y0: y,
        x1: x,
        y1: y
      };
      if (x < b.x0) b.x0 = x;
      if (x > b.x1) b.x1 = x;
      if (y < b.y0) b.y0 = y;
      if (y > b.y1) b.y1 = y;
      return b;
    }
    function ptIn(b, x, y) {
      var m = g.getTransform();
      return grow(b, m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f);
    }
    function box(b, x, y, w, h) {
      b = ptIn(b, x, y);
      b = ptIn(b, x + w, y);
      b = ptIn(b, x, y + h);
      return ptIn(b, x + w, y + h);
    }
    function add(b, pad) {
      if (!b) return;
      cur = grow(cur, b.x0 - pad, b.y0 - pad);
      cur = grow(cur, b.x1 + pad, b.y1 + pad);
    }
    function scl() {
      var m = g.getTransform();
      return Math.sqrt(Math.max(m.a * m.a + m.b * m.b, m.c * m.c + m.d * m.d));
    }
    function wrap(name, f) {
      var o = g[name];
      g[name] = function() {
        f.apply(null, arguments);
        return o.apply(g, arguments);
      };
    }
    wrap("beginPath", function() {
      pb = null;
    });
    wrap("moveTo", function(x, y) {
      pb = ptIn(pb, x, y);
    });
    wrap("lineTo", function(x, y) {
      pb = ptIn(pb, x, y);
    });
    wrap("quadraticCurveTo", function(cx, cy, x, y) {
      pb = ptIn(pb, cx, cy);
      pb = ptIn(pb, x, y);
    });
    wrap("bezierCurveTo", function(a, b, c, d, x, y) {
      pb = ptIn(pb, a, b);
      pb = ptIn(pb, c, d);
      pb = ptIn(pb, x, y);
    });
    wrap("arc", function(x, y, r) {
      pb = box(pb, x - r, y - r, 2 * r, 2 * r);
    });
    wrap("rect", function(x, y, w, h) {
      pb = box(pb, x, y, w, h);
    });
    wrap("fill", function() {
      add(pb, 2);
    });
    wrap("stroke", function() {
      add(pb, g.lineWidth * scl() + 2);
    });
    wrap("fillRect", function(x, y, w, h) {
      add(box(null, x, y, w, h), 2);
    });
    wrap("strokeRect", function(x, y, w, h) {
      add(box(null, x, y, w, h), g.lineWidth * scl() + 2);
    });
    wrap("drawImage", function(im) {
      var a = arguments, x, y, w, h;
      if (a.length === 3) {
        x = a[1];
        y = a[2];
        w = im.width;
        h = im.height;
      } else if (a.length === 5) {
        x = a[1];
        y = a[2];
        w = a[3];
        h = a[4];
      } else {
        x = a[5];
        y = a[6];
        w = a[7];
        h = a[8];
      }
      add(box(null, x, y, w, h), 2);
    });
    return function wipe() {
      var s = cv.width + "x" + cv.height, b = all ? {
        x0: 0,
        y0: 0,
        x1: cv.width,
        y1: cv.height
      } : cur;
      if (s !== sz) {
        sz = s;
        b = null;
      }
      cur = null;
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      if (b) {
        var x0 = Math.max(0, Math.floor(b.x0) - 1), y0 = Math.max(0, Math.floor(b.y0) - 1), x1 = Math.min(cv.width, Math.ceil(b.x1) + 1), y1 = Math.min(cv.height, Math.ceil(b.y1) + 1);
        if (x1 > x0 && y1 > y0) g.clearRect(x0, y0, x1 - x0, y1 - y0);
      }
      g.restore();
    };
  };
  function set(l) {
    if (l <= P.level) return;
    P.level = l;
    try {
      sessionStorage.setItem(KEY, l);
    } catch (e) {}
    try {
      dispatchEvent(new Event("mmperf"));
    } catch (e) {}
    if (window.mmTrack) window.mmTrack("perf_level_" + l);
  }
  if (forced != null || matchMedia("(prefers-reduced-motion:reduce)").matches) return;
  var t0 = 0, n = 0, slow = 0, wait = 0, inDeep = false, deep = document.getElementById("deep");
  if (!deep || !("IntersectionObserver" in window)) return;
  new IntersectionObserver(function(es) {
    var v = es[0].intersectionRatio > .35;
    if (v && !inDeep) wait = performance.now() + 1500;
    inDeep = v;
  }, {
    threshold: [ 0, .35, .6 ]
  }).observe(deep);
  function f(now) {
    if (P.level >= 3) return;
    requestAnimationFrame(f);
    if (document.hidden || !inDeep || now < wait) {
      t0 = now;
      n = 0;
      return;
    }
    if (!t0) {
      t0 = now;
      n = 0;
      return;
    }
    n++;
    var el = now - t0;
    if (el >= 2e3) {
      var fps = n * 1e3 / el;
      t0 = now;
      n = 0;
      if (fps < 20) {
        if (++slow >= 2) {
          slow = 0;
          set(P.level + 1);
          wait = now + 3e3;
        }
      } else slow = 0;
    }
  }
  requestAnimationFrame(f);
})();
