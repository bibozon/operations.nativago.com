import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "NativaGo Booking Service",
  description: "NativaGo booking microservice (API-first)",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
