import Dexie, { Table } from "dexie";

export interface OfflineTransaction {
  id: string;
  transactionId: string;
  businessId: string;
  amount: number;
  type: string;
  paymentMethodId: string;
  categoryId: string;
  note: string;
  occurredAt: string;
  deviceId: string;
  syncVersion: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SyncQueueItem {
  id: string;
  entity: string;
  operation: string;
  payload: any;
  status: string;
  retryCount: number;
  updatedAt: string;
}

class LedgerDexie extends Dexie {
  transactions!: Table<OfflineTransaction, string>;
  syncQueue!: Table<SyncQueueItem, string>;

  constructor() {
    super("ledger-core-db");
    this.version(1).stores({
      transactions: "id, transactionId, businessId, occurredAt, syncVersion, isDeleted",
      syncQueue: "id, entity, operation, status, updatedAt"
    });
  }
}

export const db = new LedgerDexie();

export async function enqueueSync(action: SyncQueueItem) {
  await db.syncQueue.put({ ...action, updatedAt: new Date().toISOString() });
}

export async function persistTransaction(transaction: OfflineTransaction) {
  await db.transactions.put({ ...transaction, updatedAt: new Date().toISOString() });
  await enqueueSync({
    id: `sync_${transaction.id}`,
    entity: "transaction",
    operation: transaction.isDeleted ? "delete" : transaction.syncVersion === 1 ? "create" : "update",
    payload: transaction,
    status: "PENDING",
    retryCount: 0,
    updatedAt: new Date().toISOString()
  });
}

export async function getPendingSyncItems() {
  return db.syncQueue.where("status").equals("PENDING").toArray();
}

export async function markSyncItem(item: SyncQueueItem, status: string) {
  await db.syncQueue.put({ ...item, status, updatedAt: new Date().toISOString() });
}
