"use client";

import { useWallet } from "../context/WalletContext";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { address, connect, disconnect, isConnecting } = useWallet();
  const router = useRouter();
  const pathname = usePathname();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  const links = [
    { label: "Home", href: "/" },
    { label: "Upload", href: "/upload" },
    { label: "Library", href: "/library" },
    { label: "Watch", href: "/watch" },
  ];

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
      <h1
        className="text-xl font-bold text-[#001f5b] dark:text-white cursor-pointer"
        onClick={() => router.push("/")}
      >
        Flash<span className="text-[#0a3fd4]">Stream</span>
      </h1>

      <div className="flex items-center gap-6">
        {links.map(link => (
          <button
            key={link.href}
            onClick={() => router.push(link.href)}
            className={`text-sm font-medium transition-colors ${
              pathname === link.href
                ? "text-[#001f5b] dark:text-white"
                : "text-gray-400 hover:text-[#001f5b] dark:hover:text-white"
            }`}
          >
            {link.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setDark(!dark)}
          className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:border-[#001f5b] transition-colors"
        >
          {dark ? "☀" : "☾"}
        </button>

        {address ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
            <button
              onClick={() => { disconnect(); router.push("/"); }}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={connect}
            disabled={isConnecting}
            className="bg-[#001f5b] hover:bg-[#0a3fd4] disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>
    </nav>
  );
}
