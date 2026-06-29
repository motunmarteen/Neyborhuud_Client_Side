import './globals.css';
import { ThemeProvider } from './components/ThemeProvider';
import { ThemeToggle } from './components/ThemeToggle';
import { DoodleBackground } from './components/DoodleBackground';

export const metadata = {
  title: "NeyborHuud - The Operating System for Your Neighborhood",
  description: "Join a verified community built for real-time safety, local commerce, and neighbors helping neighbors.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <DoodleBackground />
          <nav className="glass" style={{ position: 'fixed', top: 0, width: '100%', zIndex: 100, padding: '16px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--primary)', letterSpacing: '-0.02em' }}>
                NeyborHuud
              </div>
              <div className="nav-links">
                <a href="#safety" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>Safety</a>
                <a href="#marketplace" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>Marketplace</a>
                <a href="#trust" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>TrustOS</a>
                <ThemeToggle />
                <a href="https://app.neyborhuud.com/" className="btn-glass-primary" style={{ padding: '12px 24px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center' }}>
                  Join Now
                </a>
              </div>
            </div>
          </nav>
          <main style={{ paddingTop: '80px' }}>
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
