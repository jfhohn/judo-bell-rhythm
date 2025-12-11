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
  getScheduleById,
  getAllSchedules,
  getAllGroups,
  getActiveGroup,
  setActiveGroup,
  getCurrentDaySchedule,
  formatTime12Hour,
} from '@/lib/scheduleStore';
import { useScheduleTimer } from '@/hooks/useScheduleTimer';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';

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
      
      // Find active group
      const activeGroup = allGroups.find(g => g.isActive) || allGroups[0];
      setCurrentGroup(activeGroup);
      
      // Get schedules in the active group
      const groupSchedules = allSchedules.filter(s => s.groupId === activeGroup?.id);
      
      // Priority: Schedule matching today's day > Schedule with "any" day > First in group
      const currentDay = getCurrentDaySchedule();
      let selectedSchedule: Schedule | undefined;
      
      // 1. Try schedule matching today in active group
      if (currentDay) {
        selectedSchedule = groupSchedules.find(s => s.dayOfWeek === currentDay);
      }
      
      // 2. Try schedule with "any" day in active group
      if (!selectedSchedule) {
        selectedSchedule = groupSchedules.find(s => s.dayOfWeek === 'any');
      }
      
      // 3. Fall back to first schedule in group
      if (!selectedSchedule && groupSchedules.length > 0) {
        selectedSchedule = groupSchedules[0];
      }
      
      if (selectedSchedule) {
        setSchedule(selectedSchedule);
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
      setCurrentGroup({ ...group, isActive: true });
      
      // Find appropriate schedule in the new group
      const groupSchedules = schedules.filter(s => s.groupId === groupId);
      const currentDay = getCurrentDaySchedule();
      
      let selectedSchedule = currentDay 
        ? groupSchedules.find(s => s.dayOfWeek === currentDay) 
        : undefined;
      
      if (!selectedSchedule) {
        selectedSchedule = groupSchedules.find(s => s.dayOfWeek === 'any') || groupSchedules[0];
      }
      
      if (selectedSchedule) {
        setSchedule(selectedSchedule);
      }
      
      toast.success(`Switched to ${group.name}`);
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
    
    // Find and set the active group
    const activeGroup = allGroups.find(g => g.isActive) || allGroups[0];
    setCurrentGroup(activeGroup);
    
    // Reload current schedule if it still exists, otherwise pick from active group
    if (schedule) {
      const updated = await getScheduleById(schedule.id);
      if (updated) {
        setSchedule(updated);
      } else {
        // Schedule was deleted, pick from active group
        const groupSchedules = allSchedules.filter(s => s.groupId === activeGroup?.id);
        const currentDay = getCurrentDaySchedule();
        let selectedSchedule = currentDay 
          ? groupSchedules.find(s => s.dayOfWeek === currentDay) 
          : undefined;
        
        if (!selectedSchedule) {
          selectedSchedule = groupSchedules[0];
        }
        
        if (selectedSchedule) {
          setSchedule(selectedSchedule);
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
