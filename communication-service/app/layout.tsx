import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "NativaGo Communication Service",
  description: "NativaGo communication microservice (API-first)",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
