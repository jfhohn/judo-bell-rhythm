import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock } from '@/components/Clock';
import { Countdown } from '@/components/Countdown';
import { SectionTimeline } from '@/components/SectionTimeline';
import { ScheduleEditor } from '@/components/ScheduleEditor';
import { Header } from '@/components/Header';
import { 
  Schedule, 
  initializeSchedules, 
  getScheduleByDay, 
  getScheduleById,
  getAllSchedules,
  getCurrentDaySchedule,
  formatTime12Hour,
} from '@/lib/scheduleStore';
import { useScheduleTimer } from '@/hooks/useScheduleTimer';
import { Bell } from 'lucide-react';

const Index = () => {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const timerState = useScheduleTimer(schedule, isMuted);

  // Initialize schedules and load appropriate day
  useEffect(() => {
    const init = async () => {
      await initializeSchedules();
      
      const allSchedules = await getAllSchedules();
      setSchedules(allSchedules);
      
      // Get current day or default to Tuesday for demo
      const currentDay = getCurrentDaySchedule();
      let daySchedule: Schedule | undefined;
      
      if (currentDay) {
        daySchedule = await getScheduleByDay(currentDay);
      }
      
      // If no day-based schedule found, use the first one
      if (!daySchedule && allSchedules.length > 0) {
        daySchedule = allSchedules[0];
      }
      
      if (daySchedule) {
        setSchedule(daySchedule);
      }
      setInitialized(true);
    };
    
    init();
  }, []);

  const handleScheduleChange = async (scheduleId: string) => {
    const selected = await getScheduleById(scheduleId);
    if (selected) {
      setSchedule(selected);
    }
  };

  // Reload schedules when editor closes
  const handleEditorClose = async () => {
    setShowEditor(false);
    const allSchedules = await getAllSchedules();
    setSchedules(allSchedules);
    
    // Reload current schedule in case it was modified
    if (schedule) {
      const updated = await getScheduleById(schedule.id);
      if (updated) {
        setSchedule(updated);
      } else {
        // Schedule was deleted, pick another one
        const currentDay = getCurrentDaySchedule();
        let newSchedule: Schedule | undefined;
        
        if (currentDay) {
          newSchedule = await getScheduleByDay(currentDay);
        }
        
        if (!newSchedule && allSchedules.length > 0) {
          newSchedule = allSchedules[0];
        }
        
        setSchedule(newSchedule || null);
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
        schedules={schedules}
        currentSchedule={schedule}
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
          isWarning={timerState.isWarningPhase && !timerState.secondsRemaining}
          isUrgent={timerState.secondsRemaining > 0 && timerState.secondsRemaining <= 60}
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

      {/* Timeline footer */}
      {schedule && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent py-6 pt-12">
          <SectionTimeline
            sections={schedule.sections}
            currentSection={timerState.currentSection}
            progress={timerState.classProgress}
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
