import { Inter, JetBrains_Mono } from "next/font/google";
import "../assets/styles/globals.css";
import StoreProvider from "@/src/lib/storeProvider";

import { APP_DESCRIPTION, APP_NAME, SERVER_URL } from "@/src/lib/constants";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: {
    template: `%s | Yamka`,
    default: APP_NAME,
  },
  description: APP_DESCRIPTION,
  icons: {
    icon: "/favicon.ico",
  },
  metadataBase: new URL(SERVER_URL),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
