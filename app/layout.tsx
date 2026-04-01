import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "./context/WalletContext";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "FlashStream",
  description: "Decentralized video streaming on Shelby Protocol",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <Navbar />
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
