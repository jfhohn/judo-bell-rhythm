import { motion } from 'framer-motion';
import { Settings, Volume2, VolumeX, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Schedule } from '@/lib/scheduleStore';
import svjLogo from '@/assets/svj-logo.png';

interface HeaderProps {
  schedules: Schedule[];
  currentSchedule: Schedule | null;
  onScheduleChange: (scheduleId: string) => void;
  onSettingsClick: () => void;
  isMuted: boolean;
  onMuteToggle: () => void;
}

export function Header({ 
  schedules, 
  currentSchedule, 
  onScheduleChange, 
  onSettingsClick, 
  isMuted, 
  onMuteToggle 
}: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-40 p-4 md:p-6"
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <img 
            src={svjLogo} 
            alt="Silicon Valley Judo" 
            className="h-10 md:h-12 w-auto"
          />
          <div>
            <h1 className="text-lg md:text-xl font-bold text-foreground">SchoolBell</h1>
            <Select value={currentSchedule?.id || ''} onValueChange={onScheduleChange}>
              <SelectTrigger className="h-auto p-0 border-0 bg-transparent text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors">
                <SelectValue placeholder="Select schedule" />
              </SelectTrigger>
              <SelectContent>
                {schedules.map(schedule => (
                  <SelectItem key={schedule.id} value={schedule.id}>
                    {schedule.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onMuteToggle}
            className="btn-icon"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Volume2 className="w-5 h-5 text-foreground" />
            )}
          </button>
          
          <button
            onClick={onSettingsClick}
            className="btn-icon"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>
    </motion.header>
  );
}
