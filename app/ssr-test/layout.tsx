// Empty layout for SSR test - bypass root layout
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <title>SSR Test</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
