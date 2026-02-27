import "./globals.css";
import { ReactNode } from "react";
import { ClientProviders } from "./ClientProviders";

export const metadata = {
  title: "Operations Nativago Backoffice",
  description: "Panel administrativo para operaciones Nativago",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
