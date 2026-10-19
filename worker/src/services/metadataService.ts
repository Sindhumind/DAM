
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
  metadata: Record<string, unknown>
): Promise<void> {
  const response = await fetch(
    `${backendUrl}/internal/worker/assets/${assetId}/metadata`,
    {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ metadata }),
    }
  );

  await handleResponse(response, "Saving asset metadata");
}

export async function updateAssetStatus(
  assetId: number,
  status: string
): Promise<void> {
  const response = await fetch(
    `${backendUrl}/internal/worker/assets/${assetId}/status`,
    {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    }
  );

  await handleResponse(response, "Updating asset status");
}

export async function claimAssetForProcessing(
  assetId: number
): Promise<boolean> {
  const response = await fetch(
    `${backendUrl}/internal/worker/assets/${assetId}/claim`,
    {
      method: "POST",
      headers: getHeaders(),
    }
  );

  await handleResponse(response, "Claiming asset");

  const result = (await response.json()) as {
    claimed: boolean;
  };

  return result.claimed;
}
