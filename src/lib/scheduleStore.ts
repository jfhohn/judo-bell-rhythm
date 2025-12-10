import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Section {
  id: string;
  name: string;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  color: string;
  playEndBell: boolean;
  playTwoMinWarning: boolean;
  bellSound: string;
}

export interface Schedule {
  id: string;
  name: string;
  scheduleType: 'class' | 'tournament' | 'custom';
  associatedDays?: string[];
  sections: Section[];
}

interface SchoolBellDB extends DBSchema {
  schedules: {
    key: string;
    value: Schedule;
  };
}

const DB_NAME = 'judo-schoolbell';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<SchoolBellDB>> | null = null;

function migrateSection(section: any): Section {
  return {
    id: section.id,
    name: section.name,
    startTime: section.startTime,
    endTime: section.endTime,
    color: section.color,
    playEndBell: section.playEndBell ?? !section.name.toLowerCase().includes('break'),
    playTwoMinWarning: section.playTwoMinWarning ?? false,
    bellSound: section.bellSound ?? 'classic',
  };
}

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<SchoolBellDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (oldVersion < 1) {
          db.createObjectStore('schedules', { keyPath: 'id' });
        }
        // Migration from v1 to v2: update existing schedules
        if (oldVersion === 1 && newVersion === 2) {
          const store = transaction.objectStore('schedules');
          store.getAll().then(schedules => {
            schedules.forEach(schedule => {
              const migrated: Schedule = {
                id: schedule.id,
                name: schedule.name || (schedule as any).displayName || schedule.id,
                scheduleType: (schedule as any).scheduleType || 'class',
                associatedDays: (schedule as any).associatedDays || [(schedule as any).day],
                sections: schedule.sections.map(migrateSection),
              };
              store.put(migrated);
            });
          });
        }
      },
    });
  }
  return dbPromise;
}

// Default schedules for SVJ
const defaultSchedules: Schedule[] = [
  {
    id: 'tuesday',
    name: 'Tuesday Class',
    scheduleType: 'class',
    associatedDays: ['tuesday'],
    sections: [
      { id: '1', name: 'Warmup', startTime: '18:30', endTime: '18:45', color: 'hsl(142 76% 36%)', playEndBell: true, playTwoMinWarning: false, bellSound: 'classic' },
      { id: '2', name: 'Newaza', startTime: '18:45', endTime: '19:15', color: 'hsl(217 91% 60%)', playEndBell: true, playTwoMinWarning: false, bellSound: 'classic' },
      { id: '3', name: 'Tachiwaza', startTime: '19:15', endTime: '19:45', color: 'hsl(280 70% 50%)', playEndBell: true, playTwoMinWarning: false, bellSound: 'classic' },
      { id: '4', name: 'Randori', startTime: '19:45', endTime: '20:15', color: 'hsl(38 92% 50%)', playEndBell: true, playTwoMinWarning: false, bellSound: 'classic' },
    ],
  },
  {
    id: 'thursday',
    name: 'Thursday Class',
    scheduleType: 'class',
    associatedDays: ['thursday'],
    sections: [
      { id: '1', name: 'Warmup', startTime: '18:30', endTime: '18:45', color: 'hsl(142 76% 36%)', playEndBell: true, playTwoMinWarning: false, bellSound: 'classic' },
      { id: '2', name: 'Newaza', startTime: '18:45', endTime: '19:15', color: 'hsl(217 91% 60%)', playEndBell: true, playTwoMinWarning: false, bellSound: 'classic' },
      { id: '3', name: 'Tachiwaza', startTime: '19:15', endTime: '19:45', color: 'hsl(280 70% 50%)', playEndBell: true, playTwoMinWarning: false, bellSound: 'classic' },
      { id: '4', name: 'Randori', startTime: '19:45', endTime: '20:15', color: 'hsl(38 92% 50%)', playEndBell: true, playTwoMinWarning: false, bellSound: 'classic' },
    ],
  },
  {
    id: 'saturday',
    name: 'Saturday Class',
    scheduleType: 'class',
    associatedDays: ['saturday'],
    sections: [
      { id: '1', name: 'Warmup', startTime: '10:00', endTime: '10:15', color: 'hsl(142 76% 36%)', playEndBell: true, playTwoMinWarning: false, bellSound: 'classic' },
      { id: '2', name: 'Newaza', startTime: '10:15', endTime: '10:45', color: 'hsl(217 91% 60%)', playEndBell: true, playTwoMinWarning: false, bellSound: 'classic' },
      { id: '3', name: 'Tachiwaza', startTime: '10:45', endTime: '11:15', color: 'hsl(280 70% 50%)', playEndBell: true, playTwoMinWarning: false, bellSound: 'classic' },
      { id: '4', name: 'Randori', startTime: '11:15', endTime: '12:00', color: 'hsl(38 92% 50%)', playEndBell: true, playTwoMinWarning: false, bellSound: 'classic' },
    ],
  },
  {
    id: 'tournament',
    name: 'Tournament',
    scheduleType: 'tournament',
    associatedDays: [],
    sections: [
      { id: '1', name: 'Warmup', startTime: '09:00', endTime: '09:30', color: 'hsl(142 76% 36%)', playEndBell: true, playTwoMinWarning: false, bellSound: 'classic' },
      { id: '2', name: 'Pool Matches', startTime: '09:30', endTime: '11:00', color: 'hsl(217 91% 60%)', playEndBell: true, playTwoMinWarning: true, bellSound: 'gong' },
      { id: '3', name: 'Break', startTime: '11:00', endTime: '11:15', color: 'hsl(0 0% 50%)', playEndBell: false, playTwoMinWarning: false, bellSound: 'classic' },
      { id: '4', name: 'Eliminations', startTime: '11:15', endTime: '12:30', color: 'hsl(280 70% 50%)', playEndBell: true, playTwoMinWarning: true, bellSound: 'gong' },
      { id: '5', name: 'Finals', startTime: '12:30', endTime: '13:30', color: 'hsl(38 92% 50%)', playEndBell: true, playTwoMinWarning: true, bellSound: 'gong' },
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

export async function getScheduleByDay(day: string): Promise<Schedule | undefined> {
  const db = await getDB();
  const allSchedules = await db.getAll('schedules');
  return allSchedules.find(s => s.associatedDays?.includes(day));
}

export async function getScheduleById(id: string): Promise<Schedule | undefined> {
  const db = await getDB();
  return db.get('schedules', id);
}

export async function getAllSchedules(): Promise<Schedule[]> {
  const db = await getDB();
  return db.getAll('schedules');
}

export async function saveSchedule(schedule: Schedule): Promise<void> {
  const db = await getDB();
  await db.put('schedules', schedule);
}

export async function deleteSchedule(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('schedules', id);
}

export function getCurrentDaySchedule(): string | null {
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
    hour12: true,
  });
}

export function formatTime12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}
