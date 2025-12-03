import { useState, useEffect, useCallback, useRef } from 'react';
import { Schedule, Section, timeToMinutes, getCurrentTimeMinutes } from '@/lib/scheduleStore';
import { audioSystem } from '@/lib/audioSystem';

export interface TimerState {
  currentTime: Date;
  currentSection: Section | null;
  nextSection: Section | null;
  secondsRemaining: number;
  isWarningPhase: boolean;
  isClassActive: boolean;
  classProgress: number;
}

export function useScheduleTimer(schedule: Schedule | null) {
  const [state, setState] = useState<TimerState>({
    currentTime: new Date(),
    currentSection: null,
    nextSection: null,
    secondsRemaining: 0,
    isWarningPhase: false,
    isClassActive: false,
    classProgress: 0,
  });

  const warningPlayedRef = useRef<string | null>(null);
  const bellPlayedRef = useRef<string | null>(null);
  const audioInitializedRef = useRef(false);

  const initAudio = useCallback(async () => {
    if (!audioInitializedRef.current) {
      await audioSystem.init();
      await audioSystem.resume();
      audioInitializedRef.current = true;
    }
  }, []);

  useEffect(() => {
    // Initialize audio on first user interaction
    const handleInteraction = () => {
      initAudio();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
    
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [initAudio]);

  useEffect(() => {
    if (!schedule) return;

    const updateTimer = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const currentSeconds = now.getSeconds();
      const totalCurrentSeconds = currentMinutes * 60 + currentSeconds;

      // Find current and next sections
      let currentSection: Section | null = null;
      let nextSection: Section | null = null;
      
      for (let i = 0; i < schedule.sections.length; i++) {
        const section = schedule.sections[i];
        const startMinutes = timeToMinutes(section.startTime);
        const endMinutes = timeToMinutes(section.endTime);
        
        if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
          currentSection = section;
          nextSection = schedule.sections[i + 1] || null;
          break;
        } else if (currentMinutes < startMinutes) {
          nextSection = section;
          break;
        }
      }

      // Calculate seconds remaining in current section
      let secondsRemaining = 0;
      let isWarningPhase = false;

      if (currentSection) {
        const endMinutes = timeToMinutes(currentSection.endTime);
        const endSeconds = endMinutes * 60;
        secondsRemaining = endSeconds - totalCurrentSeconds;
        isWarningPhase = secondsRemaining <= 300 && secondsRemaining > 0; // 5 minutes = 300 seconds

        // Play warning sound at exactly 5 minutes remaining (once)
        if (secondsRemaining <= 300 && secondsRemaining > 295 && warningPlayedRef.current !== currentSection.id) {
          warningPlayedRef.current = currentSection.id;
          audioSystem.playWarning();
        }

        // Play bell at section end
        if (secondsRemaining <= 0 && bellPlayedRef.current !== currentSection.id) {
          bellPlayedRef.current = currentSection.id;
          audioSystem.playBell();
        }
      }

      // Reset refs when section changes
      if (!currentSection || currentSection.id !== warningPlayedRef.current?.split('-')[0]) {
        if (currentSection && warningPlayedRef.current !== currentSection.id) {
          // Don't reset if we're still in the same section
        }
      }

      // Calculate class progress
      const firstSection = schedule.sections[0];
      const lastSection = schedule.sections[schedule.sections.length - 1];
      const classStartMinutes = timeToMinutes(firstSection.startTime);
      const classEndMinutes = timeToMinutes(lastSection.endTime);
      const totalClassMinutes = classEndMinutes - classStartMinutes;
      const elapsedMinutes = currentMinutes - classStartMinutes;
      const classProgress = Math.max(0, Math.min(100, (elapsedMinutes / totalClassMinutes) * 100));

      const isClassActive = currentMinutes >= classStartMinutes && currentMinutes < classEndMinutes;

      setState({
        currentTime: now,
        currentSection,
        nextSection,
        secondsRemaining: Math.max(0, secondsRemaining),
        isWarningPhase,
        isClassActive,
        classProgress,
      });
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [schedule]);

  return state;
}
