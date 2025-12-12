import { motion, AnimatePresence } from 'framer-motion';

interface CountdownProps {
  secondsRemaining: number;
  isVisible: boolean;
  sectionName: string;
  isPrimary?: boolean;
}

export function Countdown({ secondsRemaining, isVisible, sectionName, isPrimary = false }: CountdownProps) {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isUrgent = secondsRemaining <= 120; // Red pulsing at 2 minutes

  const formatNumber = (n: number) => n.toString().padStart(2, '0');

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={isPrimary ? '' : 'glass-panel p-6 md:p-8'}
        >
          <div className="text-center">
            <motion.p 
              className={`text-muted-foreground uppercase tracking-widest mb-2 ${
                isPrimary ? 'text-lg md:text-2xl' : 'text-sm md:text-base'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {sectionName} ends in
            </motion.p>
            
            {/* Primary mode: huge font like the main clock */}
            <motion.div 
              className={`font-mono font-bold ${
                isPrimary 
                  ? 'text-[8rem] md:text-[12rem] lg:text-[16rem] leading-none' 
                  : 'text-5xl md:text-7xl'
              } ${isUrgent ? 'text-destructive' : 'text-warning'}`}
              animate={isUrgent ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {formatNumber(minutes)}:{formatNumber(seconds)}
            </motion.div>

            {isUrgent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`flex items-center justify-center gap-2 ${isPrimary ? 'mt-6' : 'mt-4'}`}
              >
                <motion.div
                  className={`rounded-full bg-destructive ${isPrimary ? 'w-4 h-4' : 'w-3 h-3'}`}
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
                <span className={`text-destructive font-medium uppercase tracking-wider ${isPrimary ? 'text-lg' : 'text-sm'}`}>
                  Final 2 Minutes
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}