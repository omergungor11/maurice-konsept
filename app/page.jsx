import { Hero } from './components/hero';
import { HomeEffects } from './components/home-effects';
import { HomeNavigation, RoomMenu } from './components/rooms';
import { Pond, Underwater } from './components/underwater';

export default function Home() {
  return (
    <>
      <Pond />
      <a className="skip" href="#content">Skip to the content</a>
      <HomeNavigation />
      <main id="content">
        <Hero />
        <RoomMenu />
      </main>
      <footer className="footer" />
      <Underwater />
      <HomeEffects />
    </>
  );
}
