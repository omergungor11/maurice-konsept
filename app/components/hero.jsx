const restingCards = [
  { name: 'pit-vipers', left: '5%', rotation: -7 },
  { name: 'cassowary', left: '29%', rotation: 5 },
  { name: 'jaguar', left: '53%', rotation: -4 },
  { name: 'platypus', left: '77%', rotation: -5 },
];

function Glasses() {
  return (
    <a className="specs" href="#menu" aria-label="Scroll down to the menu">
      <img src="/assets/ui/glasses.webp" width="1000" height="386" alt="" decoding="async" loading="lazy" />
      <span className="specs__eye specs__eye--l" aria-hidden="true"><i><b /></i></span>
      <span className="specs__eye specs__eye--r" aria-hidden="true"><i><b /></i></span>
    </a>
  );
}

export function Hero() {
  return (
    <div className="hero-stage" id="hero-stage">
      <section className="hero" id="hero" aria-label="Introduction">
        <div className="hero__name">
          <h1 className="wordmark">
            <span>Maurice</span> <span>Moynihan</span>
            <canvas className="hero__liquid" aria-hidden="true" />
          </h1>
          <p className="hero__sub">
            is a Creative Director, Songwriter and{' '}
            <a href="https://en.wikipedia.org/wiki/Maurice_Moynihan" rel="noopener">
              Governor of the Central Bank of&nbsp;Ireland
            </a>.
          </p>
        </div>
        <Glasses />
        <div className="trail" id="trail" aria-hidden="true">
          {restingCards.map(({ name, left, rotation }) => (
            <figure
              className="trail__card trail__card--rest"
              style={{ left, transform: `rotate(${rotation}deg)` }}
              data-r={rotation}
              key={name}
            >
              <img src={`/assets/trail/${name}.webp`} alt="" loading="lazy" decoding="async" />
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
