'use client';

import { useEffect } from 'react';

const scripts = [
  '/effects/menu-fit.js',
  '/effects/menu-cards.js',
  '/liquid.js?v=ce2db348',
  '/effects/hero-scroll.js',
  '/mark.js?v=343e1ca6',
  '/perf.js?v=7f0c4ce1',
  '/glove.js?v=81480b3c',
  '/fish.js?v=e0316669',
  '/koi.js?v=aa2b5158',
  '/bubbles.js?v=9e8d935d',
  '/lure.js?v=717725fa',
];

export function HomeEffects() {
  useEffect(() => {
    if (document.querySelector('script[data-home-effect]')) return;

    if (location.hash === '#cane-toad-golf') {
      history.replaceState(history.state, '', location.pathname + location.search);
    }

    // The effects share canvas state and globals. Fetch in parallel and execute in order.
    for (const src of scripts) {
      const script = document.createElement('script');
      script.async = false;
      script.src = src;
      script.dataset.homeEffect = '';
      document.body.appendChild(script);
    }
  }, []);

  return scripts.map((src) => <link key={src} rel="preload" href={src} as="script" />);
}
