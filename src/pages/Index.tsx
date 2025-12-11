import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock } from '@/components/Clock';
import { Countdown } from '@/components/Countdown';
import { CurrentSectionProgress } from '@/components/CurrentSectionProgress';
import { ScheduleEditor } from '@/components/ScheduleEditor';
import { Header } from '@/components/Header';
import { 
  Schedule,
  ScheduleGroup,
  initializeSchedules, 
  getScheduleByDay, 
  getScheduleById,
  getAllSchedules,
  getAllGroups,
  getActiveSchedule,
  getCurrentDaySchedule,
  formatTime12Hour,
} from '@/lib/scheduleStore';
import { useScheduleTimer } from '@/hooks/useScheduleTimer';
import { Bell } from 'lucide-react';

const Index = () => {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [groups, setGroups] = useState<ScheduleGroup[]>([]);
  const [currentGroup, setCurrentGroup] = useState<ScheduleGroup | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const timerState = useScheduleTimer(schedule, isMuted);

  // Initialize schedules and load appropriate day
  useEffect(() => {
    const init = async () => {
      await initializeSchedules();
      
      const [allSchedules, allGroups] = await Promise.all([
        getAllSchedules(),
        getAllGroups(),
      ]);
      
      setSchedules(allSchedules);
      setGroups(allGroups);
      
      // Priority: Active schedule matching today > Active with "any" day > Active schedule > First schedule
      const currentDay = getCurrentDaySchedule();
      let selectedSchedule: Schedule | undefined;
      
      // 1. Try active schedule matching today
      if (currentDay) {
        selectedSchedule = allSchedules.find(s => s.isActive && s.dayOfWeek === currentDay);
      }
      
      // 2. Try active schedule with "any" day
      if (!selectedSchedule) {
        selectedSchedule = allSchedules.find(s => s.isActive && s.dayOfWeek === 'any');
      }
      
      // 3. Try any active schedule
      if (!selectedSchedule) {
        selectedSchedule = allSchedules.find(s => s.isActive);
      }
      
      // 4. Try schedule matching today's day
      if (!selectedSchedule && currentDay) {
        selectedSchedule = allSchedules.find(s => s.dayOfWeek === currentDay);
      }
      
      // 5. Fall back to first schedule
      if (!selectedSchedule && allSchedules.length > 0) {
        selectedSchedule = allSchedules[0];
      }
      
      if (selectedSchedule) {
        setSchedule(selectedSchedule);
        const group = allGroups.find(g => g.id === selectedSchedule!.groupId);
        setCurrentGroup(group || allGroups[0]);
      } else if (allGroups.length > 0) {
        setCurrentGroup(allGroups[0]);
      }
      
      setInitialized(true);
    };
    
    init();
  }, []);

  const handleGroupChange = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setCurrentGroup(group);
      // Select first schedule in group
      const firstInGroup = schedules.find(s => s.groupId === groupId);
      if (firstInGroup) {
        setSchedule(firstInGroup);
      }
    }
  };

  const handleScheduleChange = async (scheduleId: string) => {
    const selected = await getScheduleById(scheduleId);
    if (selected) {
      setSchedule(selected);
    }
  };

  // Reload schedules when editor closes
  const handleEditorClose = async () => {
    setShowEditor(false);
    const [allSchedules, allGroups] = await Promise.all([
      getAllSchedules(),
      getAllGroups(),
    ]);
    setSchedules(allSchedules);
    setGroups(allGroups);
    
    // Reload current schedule in case it was modified
    if (schedule) {
      const updated = await getScheduleById(schedule.id);
      if (updated) {
        setSchedule(updated);
        const group = allGroups.find(g => g.id === updated.groupId);
        if (group) setCurrentGroup(group);
      } else {
        // Schedule was deleted, pick the active one or first
        const active = await getActiveSchedule();
        if (active) {
          setSchedule(active);
          const group = allGroups.find(g => g.id === active.groupId);
          if (group) setCurrentGroup(group);
        } else if (allSchedules.length > 0) {
          setSchedule(allSchedules[0]);
          const group = allGroups.find(g => g.id === allSchedules[0].groupId);
          if (group) setCurrentGroup(group);
        }
      }
    }
  };

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Bell className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Header */}
      <Header
        groups={groups}
        schedules={schedules}
        currentGroup={currentGroup}
        currentSchedule={schedule}
        onGroupChange={handleGroupChange}
        onScheduleChange={handleScheduleChange}
        onSettingsClick={() => setShowEditor(true)}
        isMuted={isMuted}
        onMuteToggle={() => setIsMuted(!isMuted)}
      />

      {/* Main content */}
      <main className="min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-32">
        {/* Current section indicator */}
        <AnimatePresence mode="wait">
          {timerState.currentSection && (
            <motion.div
              key={timerState.currentSection.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-4 md:mb-8"
            >
              <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-secondary/50 backdrop-blur-sm">
                <div
                  className="w-3 h-3 rounded-full animate-pulse"
                  style={{ backgroundColor: timerState.currentSection.color }}
                />
                <span className="text-lg md:text-xl font-semibold text-foreground">
                  {timerState.currentSection.name}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main clock */}
        <Clock 
          time={timerState.currentTime}
          isWarning={timerState.isWarningPhase}
          isUrgent={timerState.secondsRemaining > 0 && timerState.secondsRemaining <= 60}
          isTwoMinuteWarning={timerState.isTwoMinuteWarning}
        />

        {/* Countdown overlay */}
        <div className="mt-8 md:mt-12">
          <Countdown
            secondsRemaining={timerState.secondsRemaining}
            isVisible={timerState.isWarningPhase}
            sectionName={timerState.currentSection?.name || ''}
          />
        </div>

        {/* Waiting state */}
        <AnimatePresence>
          {!timerState.isClassActive && schedule && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 text-center"
            >
              <p className="text-muted-foreground text-lg">
                {timerState.nextSection 
                  ? `Class starts at ${formatTime12Hour(schedule.sections[0].startTime)}`
                  : 'Class has ended'
                }
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Current section progress bar (simplified) */}
      {schedule && timerState.currentSection && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent py-6 pt-12">
          <CurrentSectionProgress
            section={timerState.currentSection}
            progress={timerState.sectionProgress}
            secondsRemaining={timerState.secondsRemaining}
          />
        </div>
      )}

      {/* Schedule Editor */}
      <AnimatePresence>
        {showEditor && (
          <ScheduleEditor 
            onClose={handleEditorClose} 
            currentScheduleId={schedule?.id}
          />
        )}
      </AnimatePresence>

      {/* Click hint for audio */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 3, duration: 1 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground pointer-events-none"
      >
        Click anywhere to enable audio
      </motion.div>
    </div>
  );
};

export default Index;
