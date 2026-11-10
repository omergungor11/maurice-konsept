const googleFonts = 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap';

export const metadata = {
  title: 'Maurice Moynihan',
  description: 'A concept recreation of Maurice Moynihan’s creative portfolio.',
  icons: {
    icon: '/assets/favicon-96.png',
    apple: '/assets/apple-touch-icon.png',
  },
  robots: { index: false, follow: false },
};

const prepareWordmark = `
  document.documentElement.classList.add('trail-live');
  if (document.createElement('canvas').getContext('2d')) {
    document.documentElement.classList.add('liquid-wait');
    setTimeout(function () {
      if (!document.documentElement.classList.contains('liquid-live')) {
        document.documentElement.classList.remove('liquid-wait');
      }
    }, 3000);
  }
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={googleFonts} />
        <link rel="stylesheet" href="/style.css?v=1a00c197" />
        <script dangerouslySetInnerHTML={{ __html: prepareWordmark }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
