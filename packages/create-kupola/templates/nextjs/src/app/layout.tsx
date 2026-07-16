import type { Metadata } from 'next';
import '@kupola/kupola/css';
import './globals.css';

export const metadata: Metadata = {
  title: '{{PROJECT_NAME}}',
  description: 'Built with Kupola 2.0 + Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        {/* Anti-FOUC: blocking theme preload */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('kupola-theme')||'dark';document.documentElement.dataset.theme=t;})()`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
