import { NextResponse } from "next/server";
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";
import { Network } from "@aptos-labs/ts-sdk";

const API_KEY = "aptoslabs_G8yGV938eQu_31wm4T6othxKdmGquFwaDNbagN8XESwdD";
const ACCOUNT = "0x271096106682d5b04903b9880ac4b213df44d624072986de2f762729364c5cd6";

const client = new ShelbyNodeClient({
  network: Network.TESTNET,
  apiKey: API_KEY,
  indexer: { apiKey: API_KEY },
});

export async function GET() {
  try {
    const blobs = await client.coordination.getBlobs({
      where: {
        owner: { _eq: ACCOUNT },
        blob_name: { _like: "%user-%" },
        is_deleted: { _eq: "0" },
      },
    });

    const masterBlobs = blobs.filter(b => b.blobNameSuffix?.endsWith("master.m3u8"));

    const videos = masterBlobs.map((blob) => {
      const prefix = blob.blobNameSuffix!.replace("/master.m3u8", "");
      const playbackUrl = `/shelby/v1/blobs/${ACCOUNT}/${encodeURIComponent(prefix + "/master.m3u8")}`;
      const createdAt = new Date(Number(blob.creationMicros) / 1000).toISOString();
      const expiresAt = new Date(Number(blob.expirationMicros) / 1000).toISOString();

      return {
        id: blob.name,
        prefix,
        playbackUrl,
        createdAt,
        expiresAt,
        size: blob.size,
      };
    });

    return NextResponse.json({ videos });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
