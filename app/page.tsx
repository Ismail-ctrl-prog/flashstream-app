"use client";

import { useWallet } from "./context/WalletContext";
import { useRouter } from "next/navigation";

export default function Home() {
  const { address, connect, isConnecting } = useWallet();
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#001f5b]/10 dark:bg-white/10 border border-[#001f5b]/20 dark:border-white/20 rounded-full px-4 py-1.5 text-[#001f5b] dark:text-white text-sm">
            <span className="w-2 h-2 rounded-full bg-[#001f5b] dark:bg-white inline-block"></span>
            Powered by Shelby Protocol
          </div>
          <h1 className="text-6xl font-bold text-[#001f5b] dark:text-white tracking-tight">
            Flash<span className="text-[#0a3fd4]">Stream</span>
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
            Upload, transcode, and stream video from a decentralized network. No servers. No middlemen.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {address ? (
            <button
              onClick={() => router.push("/upload")}
              className="bg-[#001f5b] hover:bg-[#0a3fd4] text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              Upload a video
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="bg-[#001f5b] hover:bg-[#0a3fd4] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              {isConnecting ? "Connecting..." : "Connect Petra Wallet"}
            </button>
          )}
          <button
            onClick={() => router.push("/library")}
            className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[#001f5b] dark:text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
          >
            Browse Videos
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6 pt-8">
          <div className="bg-[#001f5b]/5 dark:bg-white/5 border border-[#001f5b]/10 dark:border-white/10 rounded-xl p-6 text-left space-y-2">
            <div className="text-2xl">⚡</div>
            <h3 className="text-[#001f5b] dark:text-white font-semibold">Browser transcoding</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Videos are transcoded directly in your browser using FFmpeg</p>
          </div>
          <div className="bg-[#001f5b]/5 dark:bg-white/5 border border-[#001f5b]/10 dark:border-white/10 rounded-xl p-6 text-left space-y-2">
            <div className="text-2xl">🔒</div>
            <h3 className="text-[#001f5b] dark:text-white font-semibold">Decentralized storage</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Files stored on Shelby's distributed network of nodes</p>
          </div>
          <div className="bg-[#001f5b]/5 dark:bg-white/5 border border-[#001f5b]/10 dark:border-white/10 rounded-xl p-6 text-left space-y-2">
            <div className="text-2xl">▶</div>
            <h3 className="text-[#001f5b] dark:text-white font-semibold">Adaptive streaming</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">HLS adaptive bitrate for smooth playback on any connection</p>
          </div>
        </div>
      </div>
    </main>
  );
}
