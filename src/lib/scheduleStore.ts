import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Section {
  id: string;
  name: string;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  color: string;
}

export interface Schedule {
  id: string;
  day: 'tuesday' | 'thursday' | 'saturday';
  displayName: string;
  sections: Section[];
}

interface SchoolBellDB extends DBSchema {
  schedules: {
    key: string;
    value: Schedule;
    indexes: { 'by-day': string };
  };
}

const DB_NAME = 'judo-schoolbell';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SchoolBellDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<SchoolBellDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('schedules', { keyPath: 'id' });
        store.createIndex('by-day', 'day');
      },
    });
  }
  return dbPromise;
}

// Default schedules for SVJ
const defaultSchedules: Schedule[] = [
  {
    id: 'tuesday',
    day: 'tuesday',
    displayName: 'Tuesday Class',
    sections: [
      { id: '1', name: 'Warmup', startTime: '18:30', endTime: '18:45', color: 'hsl(142 76% 36%)' },
      { id: '2', name: 'Newaza', startTime: '18:45', endTime: '19:15', color: 'hsl(217 91% 60%)' },
      { id: '3', name: 'Tachiwaza', startTime: '19:15', endTime: '19:45', color: 'hsl(280 70% 50%)' },
      { id: '4', name: 'Randori', startTime: '19:45', endTime: '20:15', color: 'hsl(38 92% 50%)' },
    ],
  },
  {
    id: 'thursday',
    day: 'thursday',
    displayName: 'Thursday Class',
    sections: [
      { id: '1', name: 'Warmup', startTime: '18:30', endTime: '18:45', color: 'hsl(142 76% 36%)' },
      { id: '2', name: 'Newaza', startTime: '18:45', endTime: '19:15', color: 'hsl(217 91% 60%)' },
      { id: '3', name: 'Tachiwaza', startTime: '19:15', endTime: '19:45', color: 'hsl(280 70% 50%)' },
      { id: '4', name: 'Randori', startTime: '19:45', endTime: '20:15', color: 'hsl(38 92% 50%)' },
    ],
  },
  {
    id: 'saturday',
    day: 'saturday',
    displayName: 'Saturday Class',
    sections: [
      { id: '1', name: 'Warmup', startTime: '10:00', endTime: '10:15', color: 'hsl(142 76% 36%)' },
      { id: '2', name: 'Newaza', startTime: '10:15', endTime: '10:45', color: 'hsl(217 91% 60%)' },
      { id: '3', name: 'Tachiwaza', startTime: '10:45', endTime: '11:15', color: 'hsl(280 70% 50%)' },
      { id: '4', name: 'Randori', startTime: '11:15', endTime: '12:00', color: 'hsl(38 92% 50%)' },
    ],
  },
];

export async function initializeSchedules(): Promise<void> {
  const db = await getDB();
  
  for (const schedule of defaultSchedules) {
    const existing = await db.get('schedules', schedule.id);
    if (!existing) {
      await db.put('schedules', schedule);
    }
  }
}

export async function getScheduleByDay(day: Schedule['day']): Promise<Schedule | undefined> {
  const db = await getDB();
  const schedules = await db.getAllFromIndex('schedules', 'by-day', day);
  return schedules[0];
}

export async function getAllSchedules(): Promise<Schedule[]> {
  const db = await getDB();
  return db.getAll('schedules');
}

export async function saveSchedule(schedule: Schedule): Promise<void> {
  const db = await getDB();
  await db.put('schedules', schedule);
}

export function getCurrentDaySchedule(): Schedule['day'] | null {
  const day = new Date().getDay();
  switch (day) {
    case 2: return 'tuesday';
    case 4: return 'thursday';
    case 6: return 'saturday';
    default: return null;
  }
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function getCurrentTimeMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function formatTimeDisplay(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}
