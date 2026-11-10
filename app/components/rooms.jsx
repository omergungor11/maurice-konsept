const rooms = [
  {
    number: '01',
    href: '/advertising.html',
    title: 'Advertising',
    description: 'Things that made people buy other things.',
    cards: 'photo',
  },
  {
    number: '02',
    href: '/adnauseum.html',
    title: 'adnauseum',
    navTitle: 'adnauseum.ai',
    description: "It's not stealing if they put it in an award annual.",
    cards: 'wide',
  },
  {
    number: '03',
    href: '/music.html',
    title: 'Music',
    description: 'Moy Moy',
    cards: 'sleeve',
  },
  {
    number: '04',
    href: '/about.html',
    title: 'About',
    description: 'Get to know me on a deep, intimate, strictly professional level.',
  },
];

export function HomeNavigation() {
  return (
    <header className="nav nav--home">
      <nav aria-label="Site">
        <ul>
          {rooms.map(({ href, title, navTitle }) => (
            <li className="nav__dup" key={href}>
              <a href={href}>{navTitle ?? title}</a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export function RoomMenu() {
  return (
    <nav className="menu" id="menu" aria-label="Rooms">
      {rooms.map(({ number, href, title, description, cards }) => (
        <a
          className={cards ? `item item--cards item--${cards}` : 'item item--cards'}
          data-cards={cards ? '8' : undefined}
          href={href}
          key={href}
        >
          <span className="item__cards" aria-hidden="true" />
          <span className="item__no" data-nosnippet="">{number}</span>
          <span className="item__title" data-nosnippet="">{title}</span>
          <span className="item__meta m m--soft" data-nosnippet="">{description}</span>
        </a>
      ))}
    </nav>
  );
}
