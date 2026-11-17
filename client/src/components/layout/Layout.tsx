import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Footer from './Footer';
import ChatbotLauncher from './ChatbotLauncher';
import Header from './Header';

/** Scrolls to the top on page change, or to #anchor when the link has one. */
function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // wait a tick so the target page has rendered
      const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 80);
      return () => clearTimeout(t);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
}

export default function Layout() {
  const { pathname } = useLocation();
  return (
    <>
      <ScrollManager />
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <Header />
      {/* keyed by path so every page fades in on navigation */}
      <main id="main" key={pathname} className="page-enter">
        <Outlet />
      </main>
      <Footer />
      <ChatbotLauncher />
    </>
  );
}
