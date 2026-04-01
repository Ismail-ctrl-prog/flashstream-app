"use client";

import { useSearchParams } from "next/navigation";
import { VideoPlayer } from "@shelby-protocol/player";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

function WatchContent() {
  const params = useSearchParams();
  const router = useRouter();
  const url = params.get("url") || "";

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {url ? (
          <div className="space-y-6">
            <VideoPlayer
              src={url}
              title="FlashStream Video"
              config={{
                abr: { enabled: true, defaultBandwidthEstimate: 2_000_000 },
                streaming: { bufferingGoal: 30, rebufferingGoal: 2 },
              }}
            />
            <div className="bg-[#001f5b]/5 dark:bg-white/5 border border-[#001f5b]/10 dark:border-white/10 rounded-xl p-4 space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Playback URL</p>
              <p className="text-xs font-mono text-[#001f5b] dark:text-blue-400 break-all">{url}</p>
              <button
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="text-xs text-[#0a3fd4] hover:underline"
              >
                Copy shareable link
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 space-y-4">
            <div className="text-6xl">📭</div>
            <p className="text-xl font-semibold text-[#001f5b] dark:text-white">No video selected</p>
            <button
              onClick={() => router.push("/library")}
              className="bg-[#001f5b] hover:bg-[#0a3fd4] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Browse library
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense>
      <WatchContent />
    </Suspense>
  );
}
