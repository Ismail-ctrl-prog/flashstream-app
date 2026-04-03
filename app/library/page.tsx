"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "../context/WalletContext";

interface Video {
  id: string;
  prefix: string;
  playbackUrl: string;
  createdAt: string;
  expiresAt: string;
  size: number;
}

export default function LibraryPage() {
  const router = useRouter();
  const { address, connect, isConnecting } = useWallet();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/videos?address=${address}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setVideos(data.videos);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [address]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (str: string) => {
    const num = Number(str);
    const date = num > 1e12 ? new Date(num / 1000) : new Date(str);
    return date.toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  const displayedVideos = showAll ? videos : videos.slice(0, 12);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-[#001f5b] dark:text-white">My library</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {address ? `Videos uploaded by ${address.slice(0, 6)}...${address.slice(-4)}` : "Connect your wallet to see your videos"}
            </p>
          </div>
          {address && (
            <button
              onClick={() => router.push("/upload")}
              className="bg-[#001f5b] hover:bg-[#0a3fd4] dark:bg-[#0a3fd4] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              + Upload video
            </button>
          )}
        </div>

        {!address && (
          <div className="text-center py-20 space-y-4">
            <div className="text-6xl">🔒</div>
            <p className="text-xl font-semibold text-[#001f5b] dark:text-white">Connect your wallet</p>
            <p className="text-gray-500 dark:text-gray-400">Connect your Petra wallet to see your uploaded videos</p>
            <button
              onClick={connect}
              disabled={isConnecting}
              className="bg-[#001f5b] hover:bg-[#0a3fd4] disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              {isConnecting ? "Connecting..." : "Connect Petra Wallet"}
            </button>
          </div>
        )}

        {address && loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        )}

        {address && error && (
          <div className="text-center py-20">
            <p className="text-red-500 dark:text-red-400">{error}</p>
          </div>
        )}

        {address && !loading && !error && videos.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="text-6xl">📭</div>
            <p className="text-xl font-semibold text-[#001f5b] dark:text-white">No videos yet</p>
            <p className="text-gray-500 dark:text-gray-400">Upload your first video to get started!</p>
            <button
              onClick={() => router.push("/upload")}
              className="bg-[#001f5b] hover:bg-[#0a3fd4] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Upload now
            </button>
          </div>
        )}

        {address && !loading && !error && videos.length > 0 && (
          <div className="space-y-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">{videos.length} video{videos.length !== 1 ? "s" : ""} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => router.push(`/watch?url=${encodeURIComponent(video.playbackUrl)}`)}
                  className="bg-[#001f5b]/5 dark:bg-white/5 border border-[#001f5b]/10 dark:border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-[#0a3fd4] dark:hover:border-[#0a3fd4] transition-all hover:shadow-md group"
                >
                  <div className="bg-[#001f5b]/10 dark:bg-white/10 h-40 flex items-center justify-center group-hover:bg-[#001f5b]/20 dark:group-hover:bg-white/20 transition-colors">
                    <div className="w-14 h-14 rounded-full bg-[#001f5b] dark:bg-[#0a3fd4] flex items-center justify-center">
                      <span className="text-white text-xl ml-1">▶</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-sm font-mono text-[#001f5b] dark:text-white truncate">{video.prefix}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Uploaded {formatDate(video.createdAt)}</span>
                      <span>{formatSize(video.size)}</span>
                    </div>
                    <div className="text-xs text-orange-500 dark:text-orange-400">
                      Expires {formatDate(video.expiresAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {videos.length > 12 && !showAll && (
              <div className="text-center">
                <button
                  onClick={() => setShowAll(true)}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-[#001f5b] dark:hover:border-white text-[#001f5b] dark:text-white font-semibold px-8 py-3 rounded-xl transition-colors"
                >
                  Show all {videos.length} videos
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
