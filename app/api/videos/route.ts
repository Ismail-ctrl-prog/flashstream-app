import { NextRequest, NextResponse } from "next/server";
import { createShelbyIndexerClient } from "@shelby-protocol/sdk/node";

const API_KEY = "aptoslabs_G8yGV938eQu_31wm4T6othxKdmGquFwaDNbagN8XESwdD";
const ACCOUNT = "0x271096106682d5b04903b9880ac4b213df44d624072986de2f762729364c5cd6";
const INDEXER_URL = "https://api.testnet.aptoslabs.com/nocode/v1/public/cmlfqs5wt00qrs601zt5s4kfj/v1/graphql";

const indexer = createShelbyIndexerClient(INDEXER_URL, {
  headers: { Authorization: `Bearer ${API_KEY}` },
});

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userAddress = searchParams.get("address");

    let likePattern = `%user-%`;
    if (userAddress) {
      const shortAddr = userAddress.slice(2, 10).toLowerCase();
      likePattern = `%user-${shortAddr}%`;
    }

    const result = await indexer.GetBlobs({
      where: {
        blob_name: { _like: likePattern },
        is_deleted: { _eq: "0" },
      },
      limit: 200,
      offset: 0,
    });

    const blobs = result.blobs ?? [];
    const masterBlobs = blobs.filter((b: any) => b.blob_name?.endsWith("master.m3u8"));

    const videos = masterBlobs.map((blob: any) => {
      const fullName = blob.blob_name.replace(`@${ACCOUNT.slice(1)}/`, "");
      const prefix = fullName.replace("/master.m3u8", "");
      const playbackUrl = `/shelby/v1/blobs/${ACCOUNT}/${encodeURIComponent(prefix + "/master.m3u8")}`;
      const createdAt = new Date(Number(blob.created_at) / 1000).toISOString();
      const expiresAt = new Date(Number(blob.expires_at) / 1000).toISOString();

      return {
        id: blob.blob_name,
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
