
import dotenv from "dotenv";

dotenv.config();

const backendUrl =
  process.env.BACKEND_URL || "http://localhost:3000";

const workerToken = process.env.WORKER_API_TOKEN;

function getHeaders(): Record<string, string> {
  if (!workerToken) {
    throw new Error(
      "WORKER_API_TOKEN is missing from worker/.env"
    );
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${workerToken}`,
  };
}

async function handleResponse(
  response: Response,
  action: string
): Promise<void> {
  if (!response.ok) {
    const responseText = await response.text();

    throw new Error(
      `${action} failed (${response.status}): ${responseText}`
    );
  }
}

export async function saveMetadata(
  assetId: number,
  metadata: Record<string, unknown>,
  leaseToken: string
): Promise<void> {
  const response = await fetch(
    `${backendUrl}/internal/worker/assets/${assetId}/metadata`,
    {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ metadata, leaseToken }),
    }
  );

  await handleResponse(response, "Saving asset metadata");
}

export async function updateAssetStatus(
  assetId: number,
  status: string,
  leaseToken: string
): Promise<void> {
  const response = await fetch(
    `${backendUrl}/internal/worker/assets/${assetId}/status`,
    {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status, leaseToken }),
    }
  );

  await handleResponse(response, "Updating asset status");
}

export type AssetClaim = {
  claimed: boolean;
  leaseToken?: string;
};

export async function claimAssetForProcessing(
  assetId: number
): Promise<AssetClaim> {
  const response = await fetch(
    `${backendUrl}/internal/worker/assets/${assetId}/claim`,
    {
      method: "POST",
      headers: getHeaders(),
    }
  );

  await handleResponse(response, "Claiming asset");

  return (await response.json()) as AssetClaim;
}

export async function renewAssetProcessingLease(
  assetId: number,
  leaseToken: string
): Promise<boolean> {
  const response = await fetch(
    `${backendUrl}/internal/worker/assets/${assetId}/heartbeat`,
    {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ leaseToken }),
    }
  );

  await handleResponse(response, "Renewing asset processing lease");

  const result = (await response.json()) as {
    renewed: boolean;
  };

  return result.renewed;
}