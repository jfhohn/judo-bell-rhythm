import { motion } from 'framer-motion';
import { formatTimeDisplay } from '@/lib/scheduleStore';

interface ClockProps {
  time: Date;
  isWarning?: boolean;
  isUrgent?: boolean;
}

export function Clock({ time, isWarning, isUrgent }: ClockProps) {
  const timeString = formatTimeDisplay(time);
  const [hours, minutes, seconds] = timeString.split(':');

  const colorClass = isUrgent 
    ? 'text-destructive clock-digit-urgent' 
    : isWarning 
    ? 'text-warning clock-digit-warning' 
    : 'text-foreground clock-digit';

  return (
    <motion.div
      className={`font-mono font-bold ${colorClass}`}
      animate={isUrgent ? { scale: [1, 1.01, 1] } : {}}
      transition={{ duration: 1, repeat: Infinity }}
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
      </div>
    </motion.div>
  );
}
