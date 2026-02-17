import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { readFileSync } from 'fs';
import { join } from 'path';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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

export default function RootLayout({ children }) {
  const uiStrings = getUiStrings();
  return (
    <html lang="sv" suppressHydrationWarning className={inter.variable}>
      <body suppressHydrationWarning>
        <AppShell uiStrings={uiStrings}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
