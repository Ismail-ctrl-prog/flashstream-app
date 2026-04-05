# FlashStream

A decentralized video streaming app built on [Shelby Protocol](https://shelby.xyz). Upload, transcode, and stream video directly from a decentralized network — no servers, no middlemen.

## Live Demo

🔗 [flashstream-app.vercel.app](https://flashstream-app.vercel.app)

## What it does

- 🎬 **Upload** any video from your browser
- ⚡ **Transcodes** it to HLS adaptive bitrate format entirely in the browser using FFmpeg.wasm
- 📦 **Stores** it on Shelby's decentralized testnet
- ▶ **Streams** it back using the Shelby Video Player with adaptive quality switching
- 🌙 **Dark/light mode**, per-wallet library, shareable links

## Tech Stack

- [`@shelby-protocol/sdk`](https://media-kit.shelby.xyz) — Upload blobs to Shelby testnet
- [`@shelby-protocol/player`](https://media-kit.shelby.xyz) — Adaptive bitrate HLS video player
- [`@ffmpeg/ffmpeg`](https://ffmpegwasm.netlify.app) — Browser-based video transcoding
- [Next.js](https://nextjs.org) — React framework
- [Aptos Wallet Adapter](https://aptos.dev/build/sdks/wallet-adapter) — Petra wallet integration
- [Vercel](https://vercel.com) — Hosting

## Getting Started

### Prerequisites

- Node.js 18+
- [Petra Wallet](https://petra.app) browser extension
- Testnet APT from [aptos.dev/network/faucet](https://aptos.dev/network/faucet)

### Installation
```bash
git clone https://github.com/Ismail-ctrl-prog/flashstream-app.git
cd flashstream-app
npm install
cd web && npm install  # if running the web app separately
```

### Environment

No environment variables needed — API keys are hardcoded for testnet demo purposes.

### Run locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## How it works

1. User connects their Petra wallet
2. User selects a video file (under 20MB recommended)
3. FFmpeg.wasm transcodes the video to HLS format with two quality levels (720p and 480p) entirely in the browser
4. The transcoded segments are uploaded to Shelby testnet via a Next.js API route
5. The Shelby Video Player streams the video back from the decentralized network using adaptive bitrate

## Limitations

- Browser transcoding is slow for large files — keep videos under 20MB for best results
- Videos expire after 7 days on testnet
- Requires Petra wallet and testnet APT to upload

## Built with Shelby Protocol

This app was built as a demo for [Shelby Protocol](https://shelby.xyz) — a decentralized hot storage protocol co-developed by Aptos Labs and Jump Crypto, designed for real-time streaming and AI workloads.

## License

MIT
