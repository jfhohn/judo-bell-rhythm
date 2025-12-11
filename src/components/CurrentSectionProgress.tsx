import { motion } from 'framer-motion';
import { Section, formatTime12Hour } from '@/lib/scheduleStore';

interface CurrentSectionProgressProps {
  section: Section | null;
  progress: number;
  secondsRemaining: number;
}

export function CurrentSectionProgress({ section, progress, secondsRemaining }: CurrentSectionProgressProps) {
  if (!section) return null;

  const formatRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: section.color }}
            />
            <span className="font-semibold text-foreground">{section.name}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {formatTime12Hour(section.startTime)} - {formatTime12Hour(section.endTime)}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-secondary rounded-full overflow-hidden mb-2">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: section.color }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{Math.round(progress)}% complete</span>
          <span>{formatRemaining(secondsRemaining)} remaining</span>
        </div>
      </div>
    </div>
  );
}
