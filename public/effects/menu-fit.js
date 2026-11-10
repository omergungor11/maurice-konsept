(function() {
  "use strict";
  var titles = [].slice.call(document.querySelectorAll(".item__title"));
  if (!titles.length) return;
  var name = document.querySelector(".wordmark");
  function ceiling() {
    var n = name ? parseFloat(getComputedStyle(name).fontSize) : 0;
    return n ? n * .9 : 168;
  }
  function fit() {
    var CEILING = ceiling(), wants = [], i, t;
    for (i = 0; i < titles.length; i++) {
      t = titles[i];
      t.style.fontSize = "";
      var avail = t.getBoundingClientRect().width;
      var r = document.createRange();
      r.selectNodeContents(t);
      var glyphs = r.getBoundingClientRect().width;
      var base = parseFloat(getComputedStyle(t).fontSize);
      wants.push(avail && glyphs ? Math.min(base * (avail / glyphs) * .995, CEILING) : 0);
    }
    var one = Math.min.apply(null, wants.filter(function(v) {
      return v > 0;
    }));
    for (i = 0; i < titles.length; i++) {
      if (!wants[i]) continue;
      titles[i].style.fontSize = one.toFixed(1) + "px";
    }
  }
  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  addEventListener("resize", fit, {
    passive: true
  });
})();
