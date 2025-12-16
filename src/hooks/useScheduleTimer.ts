import { useState, useEffect, useCallback, useRef } from "react";
import { Schedule, Section, timeToMinutes } from "@/lib/scheduleStore";
import { audioSystem, BellSound } from "@/lib/audioSystem";

export interface TimerState {
  currentTime: Date;
  currentSection: Section | null;
  nextSection: Section | null;
  secondsRemaining: number;
  isWarningPhase: boolean;
  isTwoMinuteWarning: boolean;
  isClassActive: boolean;
  classProgress: number;
  sectionProgress: number;
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
    sectionProgress: 0,
  });

  const warningPlayedRef = useRef<string | null>(null);
  const twoMinWarningPlayedRef = useRef<string | null>(null);
  const bellPlayedRef = useRef<string | null>(null);
  const previousSectionRef = useRef<Section | null>(null);
  const audioInitializedRef = useRef(false);
  const lastBellTimeRef = useRef<number>(0);

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
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };

    window.addEventListener("click", handleInteraction);
    window.addEventListener("keydown", handleInteraction);

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, [initAudio]);

  useEffect(() => {
    if (!schedule) return;

    const updateTimer = async () => {
      // Always try to resume audio context in case it got suspended
      if (audioInitializedRef.current) {
        await audioSystem.resume();
      }

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

        // Use <= for end time to include the exact end moment for bell triggering
        if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
          currentSection = section;
          nextSection = schedule.sections[i + 1] || null;
          break;
        } else if (currentMinutes === endMinutes && currentSeconds < 5) {
          // Brief window at exact end time to catch the transition
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
      let sectionProgress = 0;

      if (currentSection) {
        const startMinutes = timeToMinutes(currentSection.startTime);
        const endMinutes = timeToMinutes(currentSection.endTime);
        const startSeconds = startMinutes * 60;
        const endSeconds = endMinutes * 60;
        secondsRemaining = endSeconds - totalCurrentSeconds;
        isWarningPhase = secondsRemaining <= 300 && secondsRemaining > 0;
        isTwoMinuteWarning = secondsRemaining <= 120 && secondsRemaining > 0;

        // Calculate section progress
        const totalSectionSeconds = endSeconds - startSeconds;
        const elapsedSectionSeconds = totalCurrentSeconds - startSeconds;
        sectionProgress = Math.max(0, Math.min(100, (elapsedSectionSeconds / totalSectionSeconds) * 100));

        // 5-minute warning - VISUAL ONLY (no audio)
        // Track that we've entered warning phase for this section
        if (secondsRemaining <= 300 && secondsRemaining > 295 && warningPlayedRef.current !== currentSection.id) {
          warningPlayedRef.current = currentSection.id;
          // No audio at 5-minute mark per requirements
        }

        // Play 2-minute warning sound if enabled for this section
        // Widen the time window to ensure we catch it
        if (
          currentSection.playTwoMinWarning &&
          secondsRemaining <= 120 &&
          secondsRemaining > 115 &&
          twoMinWarningPlayedRef.current !== currentSection.id
        ) {
          console.log('[BELL] 2-minute warning triggered for:', currentSection.name, 'seconds remaining:', secondsRemaining);
          twoMinWarningPlayedRef.current = currentSection.id;
          await audioSystem.resume();
          audioSystem.playTwoMinuteWarning(schedule.warningBellSound);
        }

        // Precise end trigger - fire at exactly 0-1 seconds remaining
        const now = Date.now();
        if (
          currentSection.playEndBell &&
          secondsRemaining <= 1 &&
          secondsRemaining >= 0 &&
          bellPlayedRef.current !== currentSection.id &&
          (now - lastBellTimeRef.current) > 10000
        ) {
          console.log('[BELL] End bell triggered for:', currentSection.name, '(precise timing)');
          bellPlayedRef.current = currentSection.id;
          lastBellTimeRef.current = now;
          await audioSystem.resume();
          audioSystem.playBell(schedule.endBellSound as BellSound);
        }
      }

      // Check for section transition - play bell for the section that just ended
      // This handles both normal transitions and class ending (last section → null)
      if (previousSectionRef.current && previousSectionRef.current.id !== currentSection?.id) {
        const prevSection = previousSectionRef.current;
        const now = Date.now();
        const timeSinceLastBell = now - lastBellTimeRef.current;

        if (
          prevSection.playEndBell &&
          bellPlayedRef.current !== prevSection.id &&
          timeSinceLastBell > 10000 // At least 10 seconds since last bell
        ) {
          const isClassEnding = currentSection === null;
          console.log('[BELL] End bell triggered for:', prevSection.name,
            isClassEnding ? '(class ending)' : '(fallback transition)');
          bellPlayedRef.current = prevSection.id;
          lastBellTimeRef.current = now;
          await audioSystem.resume();
          audioSystem.playBell(schedule.endBellSound as BellSound);
        }
      }
      previousSectionRef.current = currentSection;

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
        sectionProgress,
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [schedule]);

  return state;
}
