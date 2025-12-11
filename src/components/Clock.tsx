import { motion } from 'framer-motion';
import { formatTimeDisplay } from '@/lib/scheduleStore';

interface ClockProps {
  time: Date;
  isWarning?: boolean;
  isUrgent?: boolean;
  isTwoMinuteWarning?: boolean;
}

export function Clock({ time, isWarning, isUrgent, isTwoMinuteWarning }: ClockProps) {
  const timeString = formatTimeDisplay(time);
  // Split by space to separate time and AM/PM
  const [timePart, period] = timeString.split(' ');
  const [hours, minutes, seconds] = timePart.split(':');

  const colorClass = isUrgent 
    ? 'text-destructive' 
    : isTwoMinuteWarning
    ? 'text-destructive'
    : isWarning 
    ? 'text-warning' 
    : 'text-foreground';

  // Red flashing animation for final 2 minutes
  const flashAnimation = isTwoMinuteWarning ? {
    opacity: [1, 0.4, 1],
    scale: [1, 1.02, 1],
  } : isUrgent ? {
    scale: [1, 1.01, 1],
  } : {};

  const flashTransition = isTwoMinuteWarning ? {
    duration: 0.8,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  } : isUrgent ? {
    duration: 1,
    repeat: Infinity,
  } : {};

  return (
    <motion.div
      className={`font-mono font-bold ${colorClass}`}
      animate={flashAnimation}
      transition={flashTransition}
    >
      <div className="flex items-baseline justify-center gap-2">
        <span className="text-[12vw] md:text-[14vw] lg:text-[16vw] leading-none tracking-tight">
          {hours}
        </span>
        <motion.span 
          className="text-[8vw] md:text-[10vw] lg:text-[12vw] opacity-60"
          animate={{ opacity: [0.6, 0.3, 0.6] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          :
        </motion.span>
        <span className="text-[12vw] md:text-[14vw] lg:text-[16vw] leading-none tracking-tight">
          {minutes}
        </span>
        <motion.span 
          className="text-[8vw] md:text-[10vw] lg:text-[12vw] opacity-60"
          animate={{ opacity: [0.6, 0.3, 0.6] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          :
        </motion.span>
        <span className="text-[6vw] md:text-[7vw] lg:text-[8vw] leading-none tracking-tight opacity-80 w-[10vw]">
          {seconds}
        </span>
        {period && (
          <span className="text-[3vw] md:text-[3.5vw] lg:text-[4vw] leading-none tracking-tight opacity-60 ml-2">
            {period}
          </span>
        )}
      </div>
    </motion.div>
  );
}
