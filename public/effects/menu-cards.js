(function() {
  "use strict";
  var DECKS = {
    "01": [ "assets/thumb/mcdonalds-im-amazing-cover.jpg", "assets/thumb/23570403-0832-4e79-b262-8bbcc8378b7e_rwc_62x279x865x617x865.jpg", "assets/thumb/6aa05718-6837-4034-a67a-76ab42923041_rwc_0x0x2174x1552x1920.jpg", "assets/thumb/dbe9f955-ea92-418a-8210-61bca0eaec4a_rwc_0x0x2174x1552x1920.jpg", "assets/thumb/75b8d797-cd27-4351-92d8-3fbb405c63d8_carw_7x5x1920.jpg", "assets/thumb/c9c9dd86-208d-4947-8198-4bd043fd263a_carw_7x5x1920.jpg", "assets/thumb/d2853f65-fa01-4761-837a-a57be005d2a0_carw_7x5x1920.jpg", "assets/thumb/661f45c1-4716-4b8f-9094-30708507cfb7_carw_7x5x1920.jpg", "assets/thumb/fd34b058-4dde-4595-8448-9c6862f3a94c_carw_7x5x1920.jpg", "assets/thumb/744d642e-d561-46ba-b661-792b19ad0f0e_rwc_0x0x2174x1552x1920.jpg", "assets/thumb/83193e68-52fd-4c6f-97b2-f6b643e796a0_carw_7x5x1920.jpg", "assets/thumb/d14aecba-321d-44d8-b574-f4eded2b0a60_rwc_0x0x2174x1552x1920.jpg" ],
    "02": [ "assets/thumb/adnauseum-ads/ad00.jpg", "assets/thumb/adnauseum-ads/ad01.jpg", "assets/thumb/adnauseum-ads/ad02.jpg", "assets/thumb/adnauseum-ads/ad03.jpg", "assets/thumb/adnauseum-ads/ad04.jpg", "assets/thumb/adnauseum-ads/ad05.jpg", "assets/thumb/adnauseum-ads/ad06.jpg", "assets/thumb/adnauseum-ads/ad07.jpg", "assets/thumb/adnauseum-ads/ad08.jpg", "assets/thumb/adnauseum-ads/ad09.jpg", "assets/thumb/adnauseum-ads/ad10.jpg", "assets/thumb/adnauseum-ads/ad11.jpg" ],
    "03": [ "assets/thumb/rhinella-marina-cover.jpg" ]
  };
  var fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  var still = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  [].slice.call(document.querySelectorAll(".item--cards")).forEach(function(row) {
    var slot = row.querySelector(".item__cards");
    if (!slot) return;
    var noEl = row.querySelector(".item__no");
    var CARDS = DECKS[noEl ? noEl.textContent.trim() : ""];
    if (!CARDS || !CARDS.length) return;
    if (!fine) return;
    var N = +(row.getAttribute("data-cards") || 0) || 11, els = [], loaded = false, timer = null, k = 0;
    for (var i = 0; i < N; i++) {
      var im = document.createElement("img");
      im.alt = "";
      im.decoding = "async";
      im.className = "card";
      slot.appendChild(im);
      els.push(im);
    }
    var ORDER = CARDS.slice();
    for (var q = ORDER.length - 1; q > 0; q--) {
      var r = Math.random() * (q + 1) | 0, tmp = ORDER[q];
      ORDER[q] = ORDER[r];
      ORDER[r] = tmp;
    }
    function deal() {
      for (var i = 0; i < N; i++) {
        var pick = ORDER[(k + i) % ORDER.length];
        if (els[i].getAttribute("src") !== pick) els[i].src = pick;
        var left = i / (N - 1) * 100;
        var rot = (Math.random() * 8 - 4).toFixed(1);
        var top = (Math.random() * 22 - 11).toFixed(1);
        els[i].style.left = left.toFixed(1) + "%";
        els[i].style.transform = "translateY(calc(-50% + " + top + "px)) rotate(" + rot + "deg)";
        els[i].style.zIndex = String(i);
      }
      k += 1;
    }
    function warm() {
      if (loaded) return;
      loaded = true;
      CARDS.forEach(function(u) {
        var p = new Image;
        p.src = u;
      });
    }
    if (fine) (window.requestIdleCallback || function(f) {
      setTimeout(f, 1800);
    })(warm, {
      timeout: 4e3
    });
    row.addEventListener("pointerenter", function() {
      if (!fine) return;
      warm();
      deal();
      if (!still && !timer) timer = setInterval(deal, 125);
    });
    row.addEventListener("pointerleave", function() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    });
  });
})();
