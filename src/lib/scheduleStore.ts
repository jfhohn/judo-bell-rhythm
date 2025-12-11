import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { BellSound } from './audioSystem';

export interface Section {
  id: string;
  name: string;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  durationMinutes: number;
  color: string;
  playEndBell: boolean;
  playTwoMinWarning: boolean;
}

export interface ScheduleGroup {
  id: string;
  name: string;
  isActive: boolean;
  scheduleIds: string[];
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | 'any';

export interface Schedule {
  id: string;
  name: string;
  scheduleType: 'class' | 'tournament' | 'custom';
  groupId: string;
  isActive: boolean;
  dayOfWeek?: DayOfWeek;
  classStartTime: string; // HH:MM format - start time for the whole schedule
  warningBellSound: BellSound;
  endBellSound: BellSound;
  sections: Section[];
}

interface SchoolBellDB extends DBSchema {
  schedules: {
    key: string;
    value: Schedule;
  };
  groups: {
    key: string;
    value: ScheduleGroup;
  };
  meta: {
    key: string;
    value: { key: string; value: boolean };
  };
}

const DB_NAME = 'judo-schoolbell';
const DB_VERSION = 4;

let dbPromise: Promise<IDBPDatabase<SchoolBellDB>> | null = null;

function migrateSection(section: any, index: number, sections: any[]): Section {
  // Calculate duration from start/end times if not present
  let durationMinutes = section.durationMinutes;
  if (!durationMinutes && section.startTime && section.endTime) {
    const start = timeToMinutes(section.startTime);
    const end = timeToMinutes(section.endTime);
    durationMinutes = end - start;
  }
  
  return {
    id: section.id,
    name: section.name,
    startTime: section.startTime,
    endTime: section.endTime,
    durationMinutes: durationMinutes || 15,
    color: section.color,
    playEndBell: section.playEndBell ?? !section.name.toLowerCase().includes('break'),
    playTwoMinWarning: section.playTwoMinWarning ?? false,
  };
}

function migrateSchedule(schedule: any): Schedule {
  const sections = schedule.sections.map((s: any, i: number, arr: any[]) => migrateSection(s, i, arr));
  
  return {
    id: schedule.id,
    name: schedule.name || schedule.displayName || schedule.id,
    scheduleType: schedule.scheduleType || 'class',
    groupId: schedule.groupId || 'standard',
    isActive: schedule.isActive ?? false,
    dayOfWeek: schedule.dayOfWeek || (schedule.associatedDays?.[0] as DayOfWeek) || undefined,
    classStartTime: schedule.classStartTime || sections[0]?.startTime || '18:00',
    warningBellSound: schedule.warningBellSound || 'classic',
    endBellSound: schedule.endBellSound || schedule.sections?.[0]?.bellSound || 'classic',
    sections,
  };
}

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<SchoolBellDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (oldVersion < 1) {
          db.createObjectStore('schedules', { keyPath: 'id' });
        }
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains('groups')) {
            db.createObjectStore('groups', { keyPath: 'id' });
          }
        }
        if (oldVersion < 4) {
          if (!db.objectStoreNames.contains('meta')) {
            db.createObjectStore('meta', { keyPath: 'key' });
          }
        }
        // Migration: update existing schedules
        if (oldVersion < 3 && oldVersion >= 1) {
          const store = transaction.objectStore('schedules');
          store.getAll().then(schedules => {
            schedules.forEach(schedule => {
              const migrated = migrateSchedule(schedule);
              store.put(migrated);
            });
          });
        }
      },
    });
  }
  return dbPromise;
}

// Default groups
const defaultGroups: ScheduleGroup[] = [
  { id: 'standard', name: 'Standard', isActive: true, scheduleIds: ['tuesday', 'thursday', 'saturday'] },
  { id: 'tournament', name: 'Tournament', isActive: false, scheduleIds: ['tournament'] },
];

// Default schedules for SVJ
const defaultSchedules: Schedule[] = [
  {
    id: 'tuesday',
    name: 'Tuesday Class',
    scheduleType: 'class',
    groupId: 'standard',
    isActive: true,
    dayOfWeek: 'tuesday',
    classStartTime: '18:30',
    warningBellSound: 'classic',
    endBellSound: 'classic',
    sections: [
      { id: '1', name: 'Warmup', startTime: '18:30', endTime: '18:45', durationMinutes: 15, color: 'hsl(142 76% 36%)', playEndBell: true, playTwoMinWarning: false },
      { id: '2', name: 'Newaza', startTime: '18:45', endTime: '19:15', durationMinutes: 30, color: 'hsl(217 91% 60%)', playEndBell: true, playTwoMinWarning: false },
      { id: '3', name: 'Tachiwaza', startTime: '19:15', endTime: '19:45', durationMinutes: 30, color: 'hsl(280 70% 50%)', playEndBell: true, playTwoMinWarning: false },
      { id: '4', name: 'Randori', startTime: '19:45', endTime: '20:15', durationMinutes: 30, color: 'hsl(38 92% 50%)', playEndBell: true, playTwoMinWarning: false },
    ],
  },
  {
    id: 'thursday',
    name: 'Thursday Class',
    scheduleType: 'class',
    groupId: 'standard',
    isActive: false,
    dayOfWeek: 'thursday',
    classStartTime: '18:30',
    warningBellSound: 'classic',
    endBellSound: 'classic',
    sections: [
      { id: '1', name: 'Warmup', startTime: '18:30', endTime: '18:45', durationMinutes: 15, color: 'hsl(142 76% 36%)', playEndBell: true, playTwoMinWarning: false },
      { id: '2', name: 'Newaza', startTime: '18:45', endTime: '19:15', durationMinutes: 30, color: 'hsl(217 91% 60%)', playEndBell: true, playTwoMinWarning: false },
      { id: '3', name: 'Tachiwaza', startTime: '19:15', endTime: '19:45', durationMinutes: 30, color: 'hsl(280 70% 50%)', playEndBell: true, playTwoMinWarning: false },
      { id: '4', name: 'Randori', startTime: '19:45', endTime: '20:15', durationMinutes: 30, color: 'hsl(38 92% 50%)', playEndBell: true, playTwoMinWarning: false },
    ],
  },
  {
    id: 'saturday',
    name: 'Saturday Class',
    scheduleType: 'class',
    groupId: 'standard',
    isActive: false,
    dayOfWeek: 'saturday',
    classStartTime: '10:00',
    warningBellSound: 'classic',
    endBellSound: 'classic',
    sections: [
      { id: '1', name: 'Warmup', startTime: '10:00', endTime: '10:15', durationMinutes: 15, color: 'hsl(142 76% 36%)', playEndBell: true, playTwoMinWarning: false },
      { id: '2', name: 'Newaza', startTime: '10:15', endTime: '10:45', durationMinutes: 30, color: 'hsl(217 91% 60%)', playEndBell: true, playTwoMinWarning: false },
      { id: '3', name: 'Tachiwaza', startTime: '10:45', endTime: '11:15', durationMinutes: 30, color: 'hsl(280 70% 50%)', playEndBell: true, playTwoMinWarning: false },
      { id: '4', name: 'Randori', startTime: '11:15', endTime: '12:00', durationMinutes: 45, color: 'hsl(38 92% 50%)', playEndBell: true, playTwoMinWarning: false },
    ],
  },
  {
    id: 'tournament',
    name: 'Tournament',
    scheduleType: 'tournament',
    groupId: 'tournament',
    isActive: false,
    dayOfWeek: undefined,
    classStartTime: '09:00',
    warningBellSound: 'gong',
    endBellSound: 'gong',
    sections: [
      { id: '1', name: 'Warmup', startTime: '09:00', endTime: '09:30', durationMinutes: 30, color: 'hsl(142 76% 36%)', playEndBell: true, playTwoMinWarning: false },
      { id: '2', name: 'Pool Matches', startTime: '09:30', endTime: '11:00', durationMinutes: 90, color: 'hsl(217 91% 60%)', playEndBell: true, playTwoMinWarning: true },
      { id: '3', name: 'Break', startTime: '11:00', endTime: '11:15', durationMinutes: 15, color: 'hsl(0 0% 50%)', playEndBell: false, playTwoMinWarning: false },
      { id: '4', name: 'Eliminations', startTime: '11:15', endTime: '12:30', durationMinutes: 75, color: 'hsl(280 70% 50%)', playEndBell: true, playTwoMinWarning: true },
      { id: '5', name: 'Finals', startTime: '12:30', endTime: '13:30', durationMinutes: 60, color: 'hsl(38 92% 50%)', playEndBell: true, playTwoMinWarning: true },
    ],
  },
];

export async function initializeSchedules(): Promise<void> {
  const db = await getDB();
  
  // Check if user already has data
  const existingGroups = await db.getAll('groups');
  const existingSchedules = await db.getAll('schedules');
  
  // If user has data, skip initialization
  if (existingGroups.length > 0 && existingSchedules.length > 0) {
    return;
  }
  
  // No data - create defaults (either fresh install or user deleted everything)
  for (const group of defaultGroups) {
    await db.put('groups', group);
  }
  
  for (const schedule of defaultSchedules) {
    await db.put('schedules', schedule);
  }
}

export async function resetToDefaults(): Promise<void> {
  console.log('resetToDefaults: starting...');
  try {
    const db = await getDB();
    console.log('resetToDefaults: got db');
    
    // Clear all stores using clear() for efficiency
    const tx = db.transaction(['groups', 'schedules', 'meta'], 'readwrite');
    console.log('resetToDefaults: clearing stores...');
    await Promise.all([
      tx.objectStore('groups').clear(),
      tx.objectStore('schedules').clear(),
      tx.objectStore('meta').clear(),
    ]);
    await tx.done;
    console.log('resetToDefaults: stores cleared');
    
    // Create defaults in a new transaction
    const tx2 = db.transaction(['groups', 'schedules'], 'readwrite');
    console.log('resetToDefaults: creating defaults...');
    for (const group of defaultGroups) {
      tx2.objectStore('groups').put(group);
    }
    for (const schedule of defaultSchedules) {
      tx2.objectStore('schedules').put(schedule);
    }
    await tx2.done;
    console.log('resetToDefaults: complete');
  } catch (error) {
    console.error('resetToDefaults: error', error);
    throw error;
  }
}

export async function getAllGroups(): Promise<ScheduleGroup[]> {
  const db = await getDB();
  return db.getAll('groups');
}

export async function getGroupById(id: string): Promise<ScheduleGroup | undefined> {
  const db = await getDB();
  return db.get('groups', id);
}

export async function saveGroup(group: ScheduleGroup): Promise<void> {
  const db = await getDB();
  await db.put('groups', group);
}

export async function deleteGroup(id: string): Promise<void> {
  const db = await getDB();
  // Also delete all schedules in this group
  const schedules = await db.getAll('schedules');
  for (const schedule of schedules) {
    if (schedule.groupId === id) {
      await db.delete('schedules', schedule.id);
    }
  }
  await db.delete('groups', id);
}

export async function getActiveGroup(): Promise<ScheduleGroup | undefined> {
  const db = await getDB();
  const allGroups = await db.getAll('groups');
  return allGroups.find(g => g.isActive);
}

export async function setActiveGroup(groupId: string): Promise<void> {
  const db = await getDB();
  const allGroups = await db.getAll('groups');
  
  // Deactivate all, activate the specified one
  for (const group of allGroups) {
    const isActive = group.id === groupId;
    if (group.isActive !== isActive) {
      await db.put('groups', { ...group, isActive });
    }
  }
}

export async function getSchedulesByGroup(groupId: string): Promise<Schedule[]> {
  const db = await getDB();
  const allSchedules = await db.getAll('schedules');
  return allSchedules.filter(s => s.groupId === groupId);
}

export async function getScheduleByDay(day: string): Promise<Schedule | undefined> {
  const db = await getDB();
  const allSchedules = await db.getAll('schedules');
  // Prioritize active schedule matching day
  const activeMatch = allSchedules.find(s => s.isActive && s.dayOfWeek === day);
  if (activeMatch) return activeMatch;
  // Fall back to any schedule matching day
  return allSchedules.find(s => s.dayOfWeek === day);
}

export async function getActiveSchedule(): Promise<Schedule | undefined> {
  const db = await getDB();
  const allSchedules = await db.getAll('schedules');
  return allSchedules.find(s => s.isActive);
}

export async function setActiveSchedule(scheduleId: string): Promise<void> {
  const db = await getDB();
  const allSchedules = await db.getAll('schedules');
  
  // Deactivate all, activate the specified one
  for (const schedule of allSchedules) {
    const isActive = schedule.id === scheduleId;
    if (schedule.isActive !== isActive) {
      await db.put('schedules', { ...schedule, isActive });
    }
  }
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

export function getCurrentDaySchedule(): DayOfWeek | null {
  const day = new Date().getDay();
  const days: (DayOfWeek | null)[] = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
  ];
  return days[day] || null;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
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

// Recalculate section times based on class start time and durations
export function recalculateSectionTimes(classStartTime: string, sections: Section[]): Section[] {
  let currentMinutes = timeToMinutes(classStartTime);
  
  return sections.map(section => {
    const startTime = minutesToTime(currentMinutes);
    const endMinutes = currentMinutes + section.durationMinutes;
    const endTime = minutesToTime(endMinutes);
    currentMinutes = endMinutes;
    
    return {
      ...section,
      startTime,
      endTime,
    };
  });
}

export const DAY_OPTIONS: { value: DayOfWeek | ''; label: string }[] = [
  { value: '', label: 'No day assigned' },
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
  { value: 'any', label: 'Any day' },
];
