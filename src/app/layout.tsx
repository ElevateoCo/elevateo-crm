import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Elevateoco CRM',
  description: 'Hierarchy, projects, tasks, approvals — built for Elevateoco.',
};

const THEME_INIT_SCRIPT = `
(function(){try{
  var s = localStorage.getItem('theme');
  var sys = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var dark = s === 'dark' || (s !== 'light' && sys);
  if (dark) document.documentElement.classList.add('dark');
}catch(e){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-fg">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-fg)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            },
          }}
        />
      </body>
    </html>
  );
}
