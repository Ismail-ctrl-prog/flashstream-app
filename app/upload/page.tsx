"use client";

import { useState, useRef, useCallback } from "react";
import { useWallet } from "../context/WalletContext";
import { useRouter } from "next/navigation";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

type Stage = "idle" | "transcoding" | "uploading" | "done" | "error";

export default function UploadPage() {
  const { address } = useWallet();
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [playbackUrl, setPlaybackUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const toBase64 = (data: Uint8Array): string => {
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < data.length; i += chunkSize) {
      binary += String.fromCharCode(...data.slice(i, i + chunkSize));
    }
    return btoa(binary);
  };

  const processVideo = useCallback(async (file: File) => {
    if (!address) {
      alert("Please connect your wallet first.");
      router.push("/");
      return;
    }

    try {
      setStage("transcoding");
      setProgress(0);
      setStatusMsg("Loading FFmpeg...");

      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      ffmpeg.on("progress", ({ progress: p }) => {
        setProgress(Math.round(p * 100));
      });

      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });

      setStatusMsg("Transcoding video...");
      await ffmpeg.writeFile("input.mp4", await fetchFile(file));

      await ffmpeg.exec([
        "-i", "input.mp4",
        "-filter_complex", "[0:v]split=2[v0][v1];[v0]scale=1280:720[v0out];[v1]scale=854:480[v1out]",
        "-map", "[v0out]", "-map", "0:a:0?",
        "-map", "[v1out]", "-map", "0:a:0?",
        "-c:v", "libx264", "-preset", "fast", "-profile:v", "high",
        "-b:v:0", "3000000", "-b:v:1", "1200000",
        "-c:a", "aac", "-b:a", "128000",
        "-f", "hls",
        "-hls_time", "4",
        "-hls_playlist_type", "vod",
        "-hls_flags", "independent_segments",
        "-hls_segment_type", "fmp4",
        "-hls_segment_filename", "%v/segment_%05d.m4s",
        "-master_pl_name", "master.m3u8",
        "-var_stream_map", "v:0,a:0 v:1,a:1",
        "%v/index.m3u8",
      ]);

      setStatusMsg("Reading output files...");
      const files = await ffmpeg.listDir("/");
      const outputFiles: { name: string; data: Uint8Array }[] = [];

      const readDir = async (dir: string) => {
        const entries = await ffmpeg.listDir(dir);
        for (const entry of entries) {
          if (entry.name === "." || entry.name === "..") continue;
          const fullPath = `${dir}/${entry.name}`;
          if (entry.isDir) {
            await readDir(fullPath);
          } else if (
            entry.name.endsWith(".m3u8") ||
            entry.name.endsWith(".m4s") ||
            entry.name.endsWith(".mp4")
          ) {
            const data = await ffmpeg.readFile(fullPath) as Uint8Array;
            outputFiles.push({ name: fullPath.replace(/^\//, ""), data });
          }
        }
      };

      for (const entry of files) {
        if (entry.name === "." || entry.name === ".." || entry.name === "input.mp4") continue;
        if (entry.isDir && (entry.name === "0" || entry.name === "1")) {
          await readDir(`/${entry.name}`);
        } else if (!entry.isDir && entry.name.endsWith(".m3u8")) {
          const data = await ffmpeg.readFile(entry.name) as Uint8Array;
          outputFiles.push({ name: entry.name, data });
        }
      }

      setProgress(100);
      setStage("uploading");
      setProgress(0);
      setStatusMsg("Uploading to Shelby...");

      const prefix = `user-${address?.slice(2, 10)}-${Date.now()}`;
      const BASE = `/shelby/v1/blobs/0x271096106682d5b04903b9880ac4b213df44d624072986de2f762729364c5cd6`;

      const masterFile = outputFiles.find(f => f.name === "master.m3u8");
      if (masterFile) {
        let masterContent = new TextDecoder().decode(masterFile.data);
        masterContent = masterContent
          .replace("0/index.m3u8", `${BASE}/${prefix}%2F0%2Findex.m3u8`)
          .replace("1/index.m3u8", `${BASE}/${prefix}%2F1%2Findex.m3u8`);
        masterFile.data = new TextEncoder().encode(masterContent);
      }

      const idx0 = outputFiles.find(f => f.name === "0/index.m3u8");
      const idx1 = outputFiles.find(f => f.name === "1/index.m3u8");

      const fixIndex = (file: { name: string; data: Uint8Array }, variant: string) => {
        let content = new TextDecoder().decode(file.data);
        const initFile = `init_${variant}.mp4`;
        content = content
          .replace(`URI="${initFile}"`, `URI="${BASE}/${prefix}%2F${variant}%2F${initFile}"`)
          .replace(/^(segment_\d+\.m4s)$/gm, `${BASE}/${prefix}%2F${variant}%2F$1`);
        file.data = new TextEncoder().encode(content);
      };

      if (idx0) fixIndex(idx0, "0");
      if (idx1) fixIndex(idx1, "1");

      let uploaded = 0;
      for (const file of outputFiles) {
        const blobName = `${prefix}/${file.name}`;
        const base64 = toBase64(file.data);

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blobName, data: base64 }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Upload failed");
        }

        uploaded++;
        setProgress(Math.round((uploaded / outputFiles.length) * 100));
        setStatusMsg(`Uploading ${uploaded}/${outputFiles.length} files...`);
      }

      const finalUrl = `${BASE}/${prefix}%2Fmaster.m3u8`;
      setPlaybackUrl(finalUrl);
      setStage("done");

    } catch (err: any) {
      console.error(err);
      setStage("error");
      setStatusMsg(err.message || "Something went wrong");
    }
  }, [address]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("video/")) {
      alert("Please select a video file");
      return;
    }
    const mb = file.size / (1024 * 1024);
    if (mb > 20) {
      const proceed = confirm(`This video is ${mb.toFixed(1)}MB. Browser transcoding works best with videos under 20MB and may take a very long time for larger files. Continue anyway?`);
      if (!proceed) return;
    }
    processVideo(file);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {stage === "idle" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-[#001f5b] dark:text-white">Upload a video</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Your video will be transcoded in the browser and stored on Shelby's decentralized network.</p>
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-colors ${dragOver ? "border-[#0a3fd4] bg-blue-50 dark:bg-blue-950" : "border-gray-200 dark:border-gray-700 hover:border-[#001f5b] dark:hover:border-white"}`}
            >
              <div className="text-5xl mb-4">🎬</div>
              <p className="text-[#001f5b] dark:text-white font-semibold text-lg">Drop your video here</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">or click to browse — MP4, MOV, AVI supported</p>
              <p className="text-orange-400 text-xs mt-2">Best results with videos under 20MB</p>
              <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
          </div>
        )}

        {(stage === "transcoding" || stage === "uploading") && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-[#001f5b] dark:text-white">
                {stage === "transcoding" ? "Transcoding..." : "Uploading..."}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">{statusMsg}</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{stage === "transcoding" ? "Transcoding progress" : "Upload progress"}</span>
                <span className="text-[#001f5b] dark:text-white font-semibold">{progress}%</span>
              </div>
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#001f5b] dark:bg-[#0a3fd4] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border ${stage === "transcoding" ? "border-[#001f5b] bg-[#001f5b]/5 dark:border-[#0a3fd4] dark:bg-[#0a3fd4]/10" : "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"}`}>
                <p className={`text-sm font-semibold ${stage === "transcoding" ? "text-[#001f5b] dark:text-[#0a3fd4]" : "text-green-700 dark:text-green-400"}`}>
                  {stage === "transcoding" ? "⚡ Transcoding" : "✓ Transcoded"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Creating HLS segments</p>
              </div>
              <div className={`p-4 rounded-xl border ${stage === "uploading" ? "border-[#001f5b] bg-[#001f5b]/5 dark:border-[#0a3fd4] dark:bg-[#0a3fd4]/10" : "border-gray-200 dark:border-gray-700"}`}>
                <p className={`text-sm font-semibold ${stage === "uploading" ? "text-[#001f5b] dark:text-[#0a3fd4]" : "text-gray-400 dark:text-gray-600"}`}>
                  {stage === "uploading" ? "⬆ Uploading" : "○ Upload to Shelby"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Storing on decentralized network</p>
              </div>
            </div>
          </div>
        )}

        {stage === "done" && (
          <div className="space-y-8">
            <div>
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-[#001f5b] dark:text-white">Video is live!</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Your video is now streaming from Shelby's decentralized network.</p>
            </div>
            <div className="bg-[#001f5b]/5 dark:bg-white/5 border border-[#001f5b]/20 dark:border-white/20 rounded-xl p-4 space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Playback URL</p>
              <p className="text-xs font-mono text-[#001f5b] dark:text-blue-400 break-all">{playbackUrl}</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => router.push(`/watch?url=${encodeURIComponent(playbackUrl)}`)}
                className="flex-1 bg-[#001f5b] hover:bg-[#0a3fd4] text-white font-semibold py-4 rounded-xl transition-colors"
              >
                Watch now
              </button>
              <button
                onClick={() => { setStage("idle"); setProgress(0); setStatusMsg(""); }}
                className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-[#001f5b] dark:hover:border-white text-[#001f5b] dark:text-white font-semibold py-4 rounded-xl transition-colors"
              >
                Upload another
              </button>
            </div>
          </div>
        )}

        {stage === "error" && (
          <div className="space-y-6">
            <div>
              <div className="text-5xl mb-4">❌</div>
              <h2 className="text-3xl font-bold text-red-600 dark:text-red-400">Something went wrong</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">{statusMsg}</p>
            </div>
            <button
              onClick={() => { setStage("idle"); setProgress(0); setStatusMsg(""); }}
              className="bg-[#001f5b] dark:bg-[#0a3fd4] text-white font-semibold px-8 py-4 rounded-xl hover:bg-[#0a3fd4] transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
