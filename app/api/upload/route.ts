import { NextRequest, NextResponse } from "next/server";
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";
import { Network, Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const API_KEY = "aptoslabs_G8yGV938eQu_31wm4T6othxKdmGquFwaDNbagN8XESwdD";

const account = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey("ed25519-priv-0x9c65b57afdda3c992e976dab4d46291a1509b98595d988d5a3526509deebf4d8"),
});

const client = new ShelbyNodeClient({
  network: Network.TESTNET,
  apiKey: API_KEY,
  indexer: { apiKey: API_KEY },
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
  try {
    const { blobName, data } = await req.json();

    const blobData = new Uint8Array(
      atob(data).split("").map(c => c.charCodeAt(0))
    );

    const expiry = Date.now() * 1000 + 86400_000_000 * 7;

    let lastError: any;
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        await sleep(attempt * 1000);
        await client.batchUpload({
          blobs: [{ blobData, blobName }],
          signer: account,
          expirationMicros: expiry,
        });
        return NextResponse.json({ success: true });
      } catch (err: any) {
        lastError = err;
        if (
          err.message?.includes("not been registered") ||
          err.message?.includes("mempool") ||
          err.message?.includes("invalid_transaction")
        ) {
          await sleep(attempt * 3000);
          continue;
        }
        throw err;
      }
    }

    throw lastError;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
