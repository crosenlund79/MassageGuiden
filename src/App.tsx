import { useEffect } from 'react';
import { HashRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { BrandMark, IconBody, IconBook, IconHands, IconHeart, IconHome, IconQuiz } from './components/Icons';
import { HomePage } from './pages/HomePage';
import { TechniquesPage } from './pages/TechniquesPage';
import { TechniqueDetailPage } from './pages/TechniqueDetailPage';
import { AtlasPage } from './pages/AtlasPage';
import { QuizPage } from './pages/QuizPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { AboutPage } from './pages/AboutPage';
import { DemoGalleryPage } from './pages/DemoGalleryPage';
import { I18nProvider, LanguageSwitch, useI18n } from './i18n/I18nProvider';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

function Brand() {
  const { s } = useI18n();
  return (
    <Link to="/" className="brand" aria-label={s.brandHome}>
      <BrandMark className="brand-mark" />
      <span className="brand-name">Massage<em>Atlas</em></span>
    </Link>
  );
}

function Shell() {
  const { s } = useI18n();
  const NAV = [
    { to: '/', label: s.nav.home, short: s.nav.home, icon: IconHome, end: true },
    { to: '/greb', label: s.nav.techniques, short: s.nav.techniquesShort, icon: IconHands },
    { to: '/atlas', label: s.nav.atlas, short: s.nav.atlasShort, icon: IconBody },
    { to: '/quiz', label: s.nav.quiz, short: s.nav.quiz, icon: IconQuiz },
    { to: '/favoritter', label: s.nav.favorites, short: s.nav.favorites, icon: IconHeart },
  ];
  return (
    <div className="app">
      <ScrollToTop />
      <header className="topbar">
        <Brand />
        <div className="row topbar-actions">
          <Link to="/om" className="icon-btn topbar-about" aria-label={s.nav.aboutLong} title={s.nav.aboutLong}><IconBook /></Link>
          <LanguageSwitch className="compact" />
        </div>
      </header>
      <aside className="sidebar">
        <Brand />
        <nav aria-label={s.nav.main}>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}>
              <Icon /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="sidebar-lang">
            <span className="small muted">{s.lang.label}</span>
            <LanguageSwitch className="compact" />
          </div>
          <p><Link to="/om">{s.nav.aboutLong}</Link></p>
          <p>{s.nav.disclaimer}</p>
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
          <Route path="*" element={<div className="empty"><h3>{s.nav.notFound}</h3><Link to="/">{s.nav.toHome}</Link></div>} />
        </Routes>
      </main>
      <nav className="tabbar" aria-label={s.nav.main}>
        {NAV.map(({ to, short, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}>
            <span className="nav-ico"><Icon /></span>
            {short}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function App() {
  return (
    <I18nProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </I18nProvider>
  );
}
