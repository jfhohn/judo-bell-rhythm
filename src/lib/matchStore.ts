import { openDB, IDBPDatabase } from 'idb';
import { MatchState } from './matchTypes';

const DB_NAME = 'judo-match';
const DB_VERSION = 1;
const STORE = 'matches';
const META = 'meta';

let dbPromise: Promise<IDBPDatabase> | null = null;
function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(META)) {
          db.createObjectStore(META);
        }
      },
    });
  }
  return dbPromise;
}

export async function saveMatch(state: MatchState): Promise<void> {
  const db = await getDB();
  await db.put(STORE, state);
  await db.put(META, state.id, 'lastMatchId');
}

export async function loadLastMatch(): Promise<MatchState | null> {
  const db = await getDB();
  const id = await db.get(META, 'lastMatchId');
  if (!id) return null;
  return (await db.get(STORE, id)) ?? null;
}

export async function listMatches(): Promise<MatchState[]> {
  const db = await getDB();
  return db.getAll(STORE);
}
