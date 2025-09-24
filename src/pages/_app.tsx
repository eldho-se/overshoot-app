import type { AppProps } from 'next/app';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="dark min-h-screen bg-gray-950">
      <Component {...pageProps} />
    </div>
  );
}

