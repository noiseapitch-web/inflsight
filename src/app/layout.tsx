import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "INFL.SIGHT",
  description: "인플루언서 인사이트 플랫폼",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ backgroundColor: "#09090f", color: "#e8e8f2", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
