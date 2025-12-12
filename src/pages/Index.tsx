import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock } from '@/components/Clock';
import { Countdown } from '@/components/Countdown';
import { CurrentSectionProgress } from '@/components/CurrentSectionProgress';
import { ScheduleEditor } from '@/components/ScheduleEditor';
import { Header } from '@/components/Header';
import { Schedule, ScheduleGroup, DayOfWeek, initializeSchedules, getScheduleById, getAllSchedules, getAllGroups, getActiveGroup, setActiveGroup, getCurrentDaySchedule, formatTime12Hour, formatTimeDisplay, timeToMinutes, getCurrentTimeMinutes } from '@/lib/scheduleStore';
import { useScheduleTimer } from '@/hooks/useScheduleTimer';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';

// Day of week order for cyclical calculation (0 = Sunday, 6 = Saturday)
const DAY_ORDER: Record<DayOfWeek, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  any: -1
};
interface NextScheduleInfo {
  schedule: Schedule;
  daysAway: number;
  label: string;
}
const Index = () => {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [groups, setGroups] = useState<ScheduleGroup[]>([]);
  const [currentGroup, setCurrentGroup] = useState<ScheduleGroup | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [nextScheduleInfo, setNextScheduleInfo] = useState<NextScheduleInfo | null>(null);
  const timerState = useScheduleTimer(schedule, isMuted);
  const lastScheduleEndRef = useRef<string | null>(null);

  // Find the best schedule cyclically across the week
  const findBestScheduleForTime = useCallback((groupSchedules: Schedule[]): NextScheduleInfo | undefined => {
    if (groupSchedules.length === 0) return undefined;
    const now = new Date();
    const currentDayIndex = now.getDay(); // 0 = Sunday
    const currentMinutes = getCurrentTimeMinutes();
    const getDayLabel = (daysAway: number, schedule: Schedule): string => {
      if (daysAway === 0) return `Today at ${formatTime12Hour(schedule.classStartTime)}`;
      if (daysAway === 1) return `Tomorrow at ${formatTime12Hour(schedule.classStartTime)}`;

      // Get the day name
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const targetDayIndex = (currentDayIndex + daysAway) % 7;
      return `${dayNames[targetDayIndex]} at ${formatTime12Hour(schedule.classStartTime)}`;
    };
    let bestCandidate: {
      schedule: Schedule;
      minutesUntilStart: number;
      daysAway: number;
    } | null = null;
    for (const sched of groupSchedules) {
      const schedDayIndex = sched.dayOfWeek ? DAY_ORDER[sched.dayOfWeek] : -1;
      const startMin = timeToMinutes(sched.classStartTime);
      const lastSection = sched.sections[sched.sections.length - 1];
      const endMin = lastSection ? timeToMinutes(lastSection.endTime) : startMin;

      // Handle "any" day schedules
      if (sched.dayOfWeek === 'any') {
        // Currently in progress?
        if (currentMinutes >= startMin && currentMinutes < endMin) {
          return {
            schedule: sched,
            daysAway: 0,
            label: getDayLabel(0, sched)
          };
        }
        // Coming up today?
        if (currentMinutes < startMin) {
          const minutesUntil = startMin - currentMinutes;
          if (!bestCandidate || minutesUntil < bestCandidate.minutesUntilStart) {
            bestCandidate = {
              schedule: sched,
              minutesUntilStart: minutesUntil,
              daysAway: 0
            };
          }
        }
        continue;
      }
      if (schedDayIndex < 0) continue; // No valid day

      // Calculate days until this schedule
      let daysUntil = schedDayIndex - currentDayIndex;
      if (daysUntil < 0) daysUntil += 7;

      // If it's today, check time
      if (daysUntil === 0) {
        // Currently in progress?
        if (currentMinutes >= startMin && currentMinutes < endMin) {
          return {
            schedule: sched,
            daysAway: 0,
            label: getDayLabel(0, sched)
          };
        }
        // Already passed today - schedule for next week
        if (currentMinutes >= endMin) {
          daysUntil = 7;
        }
      }

      // Calculate minutes until this schedule starts
      const minutesUntilStart = daysUntil * 24 * 60 + (startMin - currentMinutes);
      if (!bestCandidate || minutesUntilStart < bestCandidate.minutesUntilStart) {
        bestCandidate = {
          schedule: sched,
          minutesUntilStart: minutesUntilStart,
          daysAway: daysUntil
        };
      }
    }
    if (bestCandidate) {
      return {
        schedule: bestCandidate.schedule,
        daysAway: bestCandidate.daysAway,
        label: getDayLabel(bestCandidate.daysAway, bestCandidate.schedule)
      };
    }

    // Fallback to first schedule
    return {
      schedule: groupSchedules[0],
      daysAway: 0,
      label: ''
    };
  }, []);

  // Initialize schedules and load appropriate day
  useEffect(() => {
    const init = async () => {
      await initializeSchedules();
      const [allSchedules, allGroups] = await Promise.all([getAllSchedules(), getAllGroups()]);
      setSchedules(allSchedules);
      setGroups(allGroups);

      // Find active group
      const activeGroup = allGroups.find(g => g.isActive) || allGroups[0];
      setCurrentGroup(activeGroup);

      // Get schedules in the active group
      const groupSchedules = allSchedules.filter(s => s.groupId === activeGroup?.id);

      // Find best schedule cyclically
      const result = findBestScheduleForTime(groupSchedules);
      if (result) {
        setSchedule(result.schedule);
        setNextScheduleInfo(result);
      }
      setInitialized(true);
    };
    init();
  }, []);
  const handleGroupChange = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      // Auto-activate the group when switching
      await setActiveGroup(groupId);

      // Update local state
      setGroups(prev => prev.map(g => ({
        ...g,
        isActive: g.id === groupId
      })));
      setCurrentGroup({
        ...group,
        isActive: true
      });

      // Find appropriate schedule in the new group
      const groupSchedules = schedules.filter(s => s.groupId === groupId);
      const result = findBestScheduleForTime(groupSchedules);
      if (result) {
        setSchedule(result.schedule);
        setNextScheduleInfo(result);
      }
      toast.success(`Switched to ${group.name}`);
    }
  };

  // Auto-switch to next schedule when class ends
  useEffect(() => {
    if (!schedule || !currentGroup || timerState.isClassActive) {
      lastScheduleEndRef.current = null;
      return;
    }

    // Class has ended - check if we should switch to next schedule
    const lastSection = schedule.sections[schedule.sections.length - 1];
    if (!lastSection) return;
    const scheduleEndKey = `${schedule.id}-${lastSection.endTime}`;
    if (lastScheduleEndRef.current === scheduleEndKey) return;
    const currentMinutes = getCurrentTimeMinutes();
    const endMinutes = timeToMinutes(lastSection.endTime);

    // Only switch if we just passed the end time (within 5 minutes)
    if (currentMinutes >= endMinutes && currentMinutes < endMinutes + 5) {
      lastScheduleEndRef.current = scheduleEndKey;

      // Find next schedule cyclically
      const groupSchedules = schedules.filter(s => s.groupId === currentGroup.id);
      const result = findBestScheduleForTime(groupSchedules);
      if (result && result.schedule.id !== schedule.id) {
        setSchedule(result.schedule);
        setNextScheduleInfo(result);
        toast.info(`Next: ${result.schedule.name}`);
      } else if (result) {
        // Same schedule (for next week), just update the info
        setNextScheduleInfo(result);
      }
    }
  }, [timerState.isClassActive, schedule, schedules, currentGroup, findBestScheduleForTime]);

  // Periodically refresh next schedule info (every minute)
  useEffect(() => {
    if (!currentGroup || !schedules.length) return;
    const interval = setInterval(() => {
      const groupSchedules = schedules.filter(s => s.groupId === currentGroup.id);
      const result = findBestScheduleForTime(groupSchedules);
      if (result) {
        // Only update if schedule changed
        if (!schedule || result.schedule.id !== schedule.id) {
          setSchedule(result.schedule);
        }
        setNextScheduleInfo(result);
      }
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [currentGroup, schedules, schedule, findBestScheduleForTime]);

  // Reload schedules when editor closes
  const handleEditorClose = async () => {
    setShowEditor(false);
    const [allSchedules, allGroups] = await Promise.all([getAllSchedules(), getAllGroups()]);
    setSchedules(allSchedules);
    setGroups(allGroups);

    // Find and set the active group
    const activeGroup = allGroups.find(g => g.isActive) || allGroups[0];
    setCurrentGroup(activeGroup);

    // Reload current schedule if it still exists, otherwise pick from active group
    if (schedule) {
      const updated = await getScheduleById(schedule.id);
      if (updated) {
        setSchedule(updated);
        // Refresh next schedule info
        const groupSchedules = allSchedules.filter(s => s.groupId === activeGroup?.id);
        const result = findBestScheduleForTime(groupSchedules);
        if (result) setNextScheduleInfo(result);
      } else {
        // Schedule was deleted, pick from active group
        const groupSchedules = allSchedules.filter(s => s.groupId === activeGroup?.id);
        const result = findBestScheduleForTime(groupSchedules);
        if (result) {
          setSchedule(result.schedule);
          setNextScheduleInfo(result);
        }
      }
    }
  };
  if (!initialized) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div animate={{
        rotate: 360
      }} transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }}>
          <Bell className="w-12 h-12 text-primary" />
        </motion.div>
      </div>;
  }
  return <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Header */}
      <Header groups={groups} currentGroup={currentGroup} currentSchedule={schedule} onGroupChange={handleGroupChange} onSettingsClick={() => setShowEditor(true)} isMuted={isMuted} onMuteToggle={() => setIsMuted(!isMuted)} />

      {/* Main content */}
      <main className="min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-32">
        {/* Current section indicator */}
        <AnimatePresence mode="wait">
          {timerState.currentSection && <motion.div key={timerState.currentSection.id} initial={{
          opacity: 0,
          y: -10
        }} animate={{
          opacity: 1,
          y: 0
        }} exit={{
          opacity: 0,
          y: 10
        }} className="mb-4 md:mb-8">
              <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-secondary/50 backdrop-blur-sm">
                <div className="w-3 h-3 rounded-full animate-pulse" style={{
              backgroundColor: timerState.currentSection.color
            }} />
                <span className="text-lg md:text-xl font-semibold text-foreground">
                  {timerState.currentSection.name}
                </span>
              </div>
            </motion.div>}
        </AnimatePresence>

        {/* Layout switches based on warning phase */}
        <AnimatePresence mode="wait">
          {timerState.isWarningPhase ?
        // Countdown-primary layout (final 5 minutes) - positions swapped
        <motion.div key="countdown-primary" initial={{
          opacity: 0,
          scale: 0.95
        }} animate={{
          opacity: 1,
          scale: 1
        }} exit={{
          opacity: 0,
          scale: 0.95
        }} transition={{
          duration: 0.4
        }} className="flex flex-col items-center justify-center">
              {/* Large countdown as primary focus - clock position/size */}
              <Countdown secondsRemaining={timerState.secondsRemaining} isVisible={true} sectionName={timerState.currentSection?.name || ''} isPrimary={true} />

              {/* Smaller clock below - countdown position/size */}
              <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.3,
            delay: 0.1
          }} className="mt-8">
                <div className="glass-panel px-6 py-4">
                  <p className="text-muted-foreground uppercase tracking-widest mb-1 text-sm text-center">
                    Current Time
                  </p>
                  <p className="font-mono text-3xl md:text-5xl font-bold text-center text-warning">
                    {formatTimeDisplay(timerState.currentTime)}
                  </p>
                </div>
              </motion.div>
            </motion.div> :
        // Clock-primary layout (normal mode)
        <motion.div key="clock-primary" initial={{
          opacity: 0,
          scale: 0.95
        }} animate={{
          opacity: 1,
          scale: 1
        }} exit={{
          opacity: 0,
          scale: 0.95
        }} transition={{
          duration: 0.4
        }} className="flex flex-col items-center">
              <Clock time={timerState.currentTime} isWarning={timerState.isWarningPhase} isUrgent={timerState.secondsRemaining > 0 && timerState.secondsRemaining <= 60} isTwoMinuteWarning={timerState.isTwoMinuteWarning} />
            </motion.div>}
        </AnimatePresence>

        {/* Waiting state */}
        <AnimatePresence>
          {!timerState.isClassActive && schedule && nextScheduleInfo && <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} exit={{
          opacity: 0,
          y: -20
        }} className="mt-8 text-center">
              <p className="text-muted-foreground text-lg">
                {nextScheduleInfo.daysAway === 0 && timeToMinutes(schedule.classStartTime) > getCurrentTimeMinutes() ? `Class starts ${nextScheduleInfo.label.replace('Today at ', 'at ')}` : `Next class: ${nextScheduleInfo.label}`}
              </p>
            </motion.div>}
        </AnimatePresence>
      </main>

      {/* Current section progress bar (simplified) */}
      {schedule && timerState.currentSection && <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent py-6 pt-12">
          <CurrentSectionProgress section={timerState.currentSection} progress={timerState.sectionProgress} secondsRemaining={timerState.secondsRemaining} />
        </div>}

      {/* Schedule Editor */}
      <AnimatePresence>
        {showEditor && <ScheduleEditor onClose={handleEditorClose} currentScheduleId={schedule?.id} />}
      </AnimatePresence>

      {/* Click hint for audio */}
      <motion.div initial={{
      opacity: 1
    }} animate={{
      opacity: 0
    }} transition={{
      delay: 3,
      duration: 1
    }} className="fixed bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground pointer-events-none">
        Click anywhere to enable audio
      </motion.div>
    </div>;
};
export default Index;