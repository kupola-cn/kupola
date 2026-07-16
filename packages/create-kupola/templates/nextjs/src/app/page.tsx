import KupolaApp from '@/components/KupolaApp';

export default function Home() {
  return (
    <main>
      <h1>Welcome to {'{{PROJECT_NAME}}'}</h1>
      <p>
        Built with <strong>Kupola 2.0</strong> + <strong>Next.js</strong> — SSR-ready declarative UI.
      </p>
      <KupolaApp />
    </main>
  );
}
