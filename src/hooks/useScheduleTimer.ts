import { useState, useEffect, useCallback, useRef } from 'react';
import { Schedule, Section, timeToMinutes } from '@/lib/scheduleStore';
import { audioSystem, BellSound } from '@/lib/audioSystem';

export interface TimerState {
  currentTime: Date;
  currentSection: Section | null;
  nextSection: Section | null;
  secondsRemaining: number;
  isWarningPhase: boolean;
  isTwoMinuteWarning: boolean;
  isClassActive: boolean;
  classProgress: number;
}

export function useScheduleTimer(schedule: Schedule | null, isMuted: boolean = false) {
  const [state, setState] = useState<TimerState>({
    currentTime: new Date(),
    currentSection: null,
    nextSection: null,
    secondsRemaining: 0,
    isWarningPhase: false,
    isTwoMinuteWarning: false,
    isClassActive: false,
    classProgress: 0,
  });

  const warningPlayedRef = useRef<string | null>(null);
  const twoMinWarningPlayedRef = useRef<string | null>(null);
  const bellPlayedRef = useRef<string | null>(null);
  const audioInitializedRef = useRef(false);

  // Sync mute state with audio system
  useEffect(() => {
    audioSystem.setMuted(isMuted);
  }, [isMuted]);

  const initAudio = useCallback(async () => {
    if (!audioInitializedRef.current) {
      await audioSystem.init();
      await audioSystem.resume();
      audioInitializedRef.current = true;
    }
  }, []);

  useEffect(() => {
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

      let secondsRemaining = 0;
      let isWarningPhase = false;
      let isTwoMinuteWarning = false;

      if (currentSection) {
        const endMinutes = timeToMinutes(currentSection.endTime);
        const endSeconds = endMinutes * 60;
        secondsRemaining = endSeconds - totalCurrentSeconds;
        isWarningPhase = secondsRemaining <= 300 && secondsRemaining > 0;
        isTwoMinuteWarning = secondsRemaining <= 120 && secondsRemaining > 0;

        // Play 5-minute warning sound
        if (secondsRemaining <= 300 && secondsRemaining > 295 && warningPlayedRef.current !== currentSection.id) {
          warningPlayedRef.current = currentSection.id;
          audioSystem.playWarning();
        }

        // Play 2-minute warning sound if enabled for this section
        if (currentSection.playTwoMinWarning && secondsRemaining <= 120 && secondsRemaining > 115 && twoMinWarningPlayedRef.current !== currentSection.id) {
          twoMinWarningPlayedRef.current = currentSection.id;
          audioSystem.playTwoMinuteWarning();
        }

        // Play bell at section end if enabled
        if (secondsRemaining <= 0 && bellPlayedRef.current !== currentSection.id) {
          bellPlayedRef.current = currentSection.id;
          if (currentSection.playEndBell) {
            audioSystem.playBell(currentSection.bellSound as BellSound);
          }
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
        isTwoMinuteWarning,
        isClassActive,
        classProgress,
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [schedule]);

  return state;
}
