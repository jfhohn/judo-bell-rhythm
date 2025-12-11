import { motion } from 'framer-motion';
import { Settings, Volume2, VolumeX, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Schedule, ScheduleGroup } from '@/lib/scheduleStore';
import svjLogo from '@/assets/svj-logo.png';

interface HeaderProps {
  groups: ScheduleGroup[];
  schedules: Schedule[];
  currentGroup: ScheduleGroup | null;
  currentSchedule: Schedule | null;
  onGroupChange: (groupId: string) => void;
  onScheduleChange: (scheduleId: string) => void;
  onSettingsClick: () => void;
  isMuted: boolean;
  onMuteToggle: () => void;
}

export function Header({ 
  groups,
  schedules,
  currentGroup,
  currentSchedule, 
  onGroupChange,
  onScheduleChange, 
  onSettingsClick, 
  isMuted, 
  onMuteToggle 
}: HeaderProps) {
  const groupSchedules = schedules.filter(s => s.groupId === currentGroup?.id);

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
            <h1 className="text-lg md:text-xl font-bold text-foreground">SVJ Class Bell</h1>
            <div className="flex items-center gap-2">
              <Select value={currentGroup?.id || ''} onValueChange={onGroupChange}>
                <SelectTrigger className="h-auto p-0 border-0 bg-transparent text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors w-auto min-w-0">
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      <span className="flex items-center gap-2">
                        {group.isActive && <Check className="w-3 h-3 text-primary" />}
                        {group.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground/50">›</span>
              <Select value={currentSchedule?.id || ''} onValueChange={onScheduleChange}>
                <SelectTrigger className="h-auto p-0 border-0 bg-transparent text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors w-auto min-w-0">
                  <SelectValue placeholder="Select schedule" />
                </SelectTrigger>
                <SelectContent>
                  {groupSchedules.map(schedule => (
                    <SelectItem key={schedule.id} value={schedule.id}>
                      {schedule.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
