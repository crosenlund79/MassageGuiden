import { useEffect } from 'react';
import { HashRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { BrandMark, IconBody, IconHands, IconHeart, IconHome, IconQuiz } from './components/Icons';
import { HomePage } from './pages/HomePage';
import { TechniquesPage } from './pages/TechniquesPage';
import { TechniqueDetailPage } from './pages/TechniqueDetailPage';
import { AtlasPage } from './pages/AtlasPage';
import { QuizPage } from './pages/QuizPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { AboutPage } from './pages/AboutPage';
import { DemoGalleryPage } from './pages/DemoGalleryPage';

const NAV = [
  { to: '/', label: 'Forside', icon: IconHome, end: true },
  { to: '/greb', label: 'Massagegreb', short: 'Greb', icon: IconHands },
  { to: '/atlas', label: 'Muskelatlas', short: 'Atlas', icon: IconBody },
  { to: '/quiz', label: 'Quiz', icon: IconQuiz },
  { to: '/favoritter', label: 'Favoritter', icon: IconHeart },
];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

function Brand() {
  return (
    <Link to="/" className="brand" aria-label="MassageAtlas – forside">
      <BrandMark className="brand-mark" />
      <span className="brand-name">Massage<em>Atlas</em></span>
    </Link>
  );
}

function Shell() {
  return (
    <div className="app">
      <ScrollToTop />
      <header className="topbar">
        <Brand />
        <Link to="/om" className="small soft">Om indholdet</Link>
      </header>
      <aside className="sidebar">
        <Brand />
        <nav aria-label="Hovedmenu">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}>
              <Icon /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <p><Link to="/om">Om indholdet og kilder</Link></p>
          <p>Uddannelsesreference – ikke diagnose eller behandlingsanvisning.</p>
        </div>
      </aside>
      <main className="main" id="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/greb" element={<TechniquesPage />} />
          <Route path="/greb/:id" element={<TechniqueDetailPage />} />
          <Route path="/atlas" element={<AtlasPage />} />
          <Route path="/atlas/:muscleId" element={<AtlasPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/favoritter" element={<FavoritesPage />} />
          <Route path="/om" element={<AboutPage />} />
          <Route path="/haandgreb" element={<DemoGalleryPage />} />
          <Route path="*" element={<div className="empty"><h3>Siden findes ikke</h3><Link to="/">Til forsiden</Link></div>} />
        </Routes>
      </main>
      <nav className="tabbar" aria-label="Hovedmenu">
        {NAV.map(({ to, label, short, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}>
            <span className="nav-ico"><Icon /></span>
            {short ?? label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
