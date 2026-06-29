import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers.tsx";

export const metadata: Metadata = {
  title: "Flick POS",
  description: "부스 운영자 관리",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
