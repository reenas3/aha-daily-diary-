import { openDB, DBSchema, IDBPDatabase } from 'idb';

const DB_NAME = 'daily-diary-db';
const STORE_NAME = 'entries';
const DB_VERSION = 1;

export interface Entry {
  id: string;
  date: string;
  weather?: string;
  tasks: string[];
  equipment?: string[];
  notes: string;
  images?: string[];
  status: 'draft' | 'submitted';
  lastModified: number;
}

interface DiaryDB extends DBSchema {
  entries: {
    key: string;
    value: Entry;
    indexes: {
      'by-date': string;
      'by-status': string;
      'by-last-modified': number;
    };
  };
}

let db: IDBPDatabase<DiaryDB>;

export const initDB = async () => {
  if (!db) {
    db = await openDB<DiaryDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('entries', { keyPath: 'id' });
        store.createIndex('by-date', 'date');
        store.createIndex('by-status', 'status');
        store.createIndex('by-last-modified', 'lastModified');
      },
    });
  }
  return db;
};

export const saveEntry = async (entry: Entry): Promise<void> => {
  const database = await initDB();
  entry.lastModified = Date.now();
  await database.put(STORE_NAME, entry);
};

export const getEntry = async (id: string): Promise<Entry | undefined> => {
  const database = await initDB();
  return database.get(STORE_NAME, id);
};

export const getAllEntries = async (): Promise<Entry[]> => {
  const database = await initDB();
  return database.getAll(STORE_NAME);
};

export const getEntriesByStatus = async (status: 'draft' | 'submitted'): Promise<Entry[]> => {
  const database = await initDB();
  const index = database.transaction(STORE_NAME).store.index('by-status');
  return index.getAll(status);
};

export const getEntriesByDateRange = async (startDate: string, endDate: string): Promise<Entry[]> => {
  const database = await initDB();
  const index = database.transaction(STORE_NAME).store.index('by-date');
  return index.getAll(IDBKeyRange.bound(startDate, endDate));
};

export const deleteEntry = async (id: string): Promise<void> => {
  const database = await initDB();
  await database.delete(STORE_NAME, id);
};

export const syncWithServer = async (serverEndpoint: string): Promise<void> => {
  try {
    const database = await initDB();
    const unsyncedEntries = await database.getAll(STORE_NAME);
    
    // Send entries to server
    const response = await fetch(serverEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(unsyncedEntries),
    });

    if (!response.ok) {
      throw new Error('Failed to sync with server');
    }

    // Get successful syncs from response
    const { syncedIds } = await response.json();
    
    // Remove successfully synced entries
    const tx = database.transaction(STORE_NAME, 'readwrite');
    await Promise.all(
      syncedIds.map((id: string) => tx.store.delete(id))
    );
    await tx.done;
  } catch (error) {
    console.error('Error syncing with server:', error);
    throw error;
  }
}; 