"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/videos")
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setVideos(data.videos);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (str: string) => {
    const num = Number(str);
    const date = num > 1e12 ? new Date(num / 1000) : new Date(num);
    return date.toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  const getUploader = (prefix: string) => {
    const parts = prefix.split("-");
    if (parts.length >= 2) return `0x${parts[1]}...`;
    return "Unknown";
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-[#001f5b] dark:text-white">Video library</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">All videos uploaded to Shelby's decentralized network</p>
          </div>
          <button
            onClick={() => router.push("/upload")}
            className="bg-[#001f5b] hover:bg-[#0a3fd4] dark:bg-[#0a3fd4] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            + Upload video
          </button>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-red-500 dark:text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && videos.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="text-6xl">📭</div>
            <p className="text-xl font-semibold text-[#001f5b] dark:text-white">No videos yet</p>
            <p className="text-gray-500 dark:text-gray-400">Be the first to upload a video!</p>
            <button
              onClick={() => router.push("/upload")}
              className="bg-[#001f5b] hover:bg-[#0a3fd4] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Upload now
            </button>
          </div>
        )}

        {!loading && !error && videos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
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
                    <span>Uploader: {getUploader(video.prefix)}</span>
                    <span>{formatSize(video.size)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                    <span>Uploaded {formatDate(video.createdAt)}</span>
                    <span className="text-orange-500 dark:text-orange-400">Expires {formatDate(video.expiresAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
