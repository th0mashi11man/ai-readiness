import { Libre_Franklin } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { readFileSync } from 'fs';
import { join } from 'path';
import { getPreferredLocaleFromHeader, normalizeLocale } from "@/lib/locale";

const libreFranklin = Libre_Franklin({
  subsets: ["latin"],
  variable: "--font-libre-franklin",
  display: 'swap',
});

export const metadata = {
  title: "AI-beredskap i skolorganisationer",
  description: "Self-assessment and profiling for AI readiness in school organizations",
};

function getUiStrings() {
  const filePath = join(process.cwd(), 'public', 'ui_strings.json');
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

export default async function RootLayout({ children }) {
  const uiStrings = getUiStrings();
  const requestHeaders = await headers();
  const fallbackLocale = normalizeLocale(uiStrings.defaultLocale) || "en";
  const initialLocale = getPreferredLocaleFromHeader(
    requestHeaders.get("accept-language"),
    fallbackLocale
  );

  return (
    <html lang={initialLocale} suppressHydrationWarning className={libreFranklin.variable}>
      <body suppressHydrationWarning>
        <AppShell uiStrings={uiStrings} initialLocale={initialLocale}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
