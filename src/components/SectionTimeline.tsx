import { motion } from 'framer-motion';
import { Section, timeToMinutes } from '@/lib/scheduleStore';

interface SectionTimelineProps {
  sections: Section[];
  currentSection: Section | null;
  progress: number;
}

export function SectionTimeline({ sections, currentSection, progress }: SectionTimelineProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Progress bar */}
      <div className="progress-track mb-6">
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Section cards */}
      <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {sections.map((section, index) => {
          const isActive = currentSection?.id === section.id;
          const isPast = currentSection 
            ? timeToMinutes(section.endTime) <= timeToMinutes(currentSection.startTime)
            : false;

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                flex-1 min-w-[120px] md:min-w-[150px] p-3 md:p-4 rounded-xl border transition-all duration-300
                ${isActive 
                  ? 'border-primary/50 bg-primary/10 shadow-lg shadow-primary/20' 
                  : isPast 
                  ? 'border-border/30 bg-secondary/30 opacity-50'
                  : 'border-border/30 bg-secondary/50'
                }
              `}
            >
              {/* Color indicator */}
              <div
                className="w-3 h-3 rounded-full mb-2"
                style={{ backgroundColor: section.color }}
              />
              
              <h3 className={`font-semibold text-sm md:text-base mb-1 ${
                isActive ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {section.name}
              </h3>
              
              <p className="text-xs md:text-sm text-muted-foreground font-mono">
                {section.startTime} - {section.endTime}
              </p>

              {isActive && (
                <motion.div
                  className="mt-2 h-1 bg-primary/30 rounded-full overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ 
                      duration: (timeToMinutes(section.endTime) - timeToMinutes(section.startTime)) * 60,
                      ease: 'linear'
                    }}
                  />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
