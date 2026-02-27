import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Operations Nativago Backoffice",
  description: "Backoffice de NativaGo para operadores y agencias",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
