import type { Metadata } from "next";
import "./globals.css";

const themeScript = `
(() => {
  try {
    const storedTheme = localStorage.getItem("hubcontabil-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = storedTheme || (prefersDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  } catch {
  }
})();
`;

export const metadata: Metadata = {
  title: "HubContabil",
  description: "Sistema interno para operação contábil."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
