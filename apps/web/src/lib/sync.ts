import { getPendingSyncItems, markSyncItem } from "./dexie";
import { apiFetch } from "./api";

export async function syncPendingTransactions(token: string) {
  const items = await getPendingSyncItems();
  for (const item of items) {
    try {
      const method = item.operation === "delete" ? "DELETE" : item.operation === "update" ? "PUT" : "POST";
      const path = item.entity === "transaction" ? "/api/transactions" : "/api/" + item.entity;
      const url = item.operation === "update" || item.operation === "delete" ? `${path}/${item.payload.transactionId}` : path;
      await apiFetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(item.payload)
      });
      await markSyncItem(item, "COMPLETED");
    } catch (error) {
      const nextRetry = Math.min(item.retryCount + 1, 5);
      await markSyncItem({ ...item, retryCount: nextRetry }, "RETRY");
    }
  }
}

export async function startSyncLoop(token: string) {
  if (!token) return;
  try {
    await syncPendingTransactions(token);
  } catch (error) {
    console.error("Sync failed", error);
  }
}
