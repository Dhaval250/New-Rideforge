import { getFirebaseMessaging, isFirebaseReady } from "../../services/firebase";
import { deleteDeviceTokens, listDeviceTokensByUsers } from "./repository";

function normalizeMessage(input: { title: string; body: string }): { title: string; body: string } {
  const title = String(input.title ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  const body = String(input.body ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);

  return {
    title: title || "Rideforge",
    body: body || "You have a new update.",
  };
}

export async function sendPushToUsers(input: {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<{ sent: number; failed: number }> {
  const message = normalizeMessage({ title: input.title, body: input.body });
  if (!isFirebaseReady()) return { sent: 0, failed: 0 };

  const rows = await listDeviceTokensByUsers(Array.from(new Set(input.userIds)));
  const tokens = Array.from(new Set(rows.map((row) => row.token)));
  if (tokens.length === 0) return { sent: 0, failed: 0 };

  const messaging = getFirebaseMessaging();
  if (!messaging) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  const invalidTokens: string[] = [];

  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);
    const result = await messaging.sendEachForMulticast({
      tokens: batch,
      notification: { title: message.title, body: message.body },
      data: input.data,
    });

    sent += result.successCount;
    failed += result.failureCount;

    result.responses.forEach((response, idx) => {
      if (!response.success) {
        const code = response.error?.code ?? "";
        if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token") {
          invalidTokens.push(batch[idx]);
        }
      }
    });
  }

  await deleteDeviceTokens(invalidTokens);
  return { sent, failed };
}

export async function sendPushToUsersSafe(input: {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<{ sent: number; failed: number }> {
  try {
    return await sendPushToUsers(input);
  } catch (error) {
    console.error("[push] send failure", error);
    return { sent: 0, failed: input.userIds.length };
  }
}
