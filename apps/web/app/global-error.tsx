'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          background: '#fafaf9',
          color: '#1c1917',
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            maxWidth: 480,
            textAlign: 'center',
            border: '1px dashed #d6d3d1',
            borderRadius: 12,
            padding: '48px 24px',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>
            Something went wrong
          </div>
          <div style={{ color: '#78716c', fontSize: 13, marginBottom: 20 }}>
            The app failed to load. Refresh to try again.
          </div>
          <button
            type="button"
            onClick={reset}
            style={{
              border: '1px solid #d6d3d1',
              borderRadius: 7,
              padding: '7px 14px',
              fontSize: 13,
              fontWeight: 500,
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
