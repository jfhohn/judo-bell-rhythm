import { motion } from 'framer-motion';
import { Settings, Volume2, VolumeX } from 'lucide-react';
import svjLogo from '@/assets/svj-logo.png';

interface HeaderProps {
  scheduleName: string;
  onSettingsClick: () => void;
  isMuted: boolean;
  onMuteToggle: () => void;
}

export function Header({ scheduleName, onSettingsClick, isMuted, onMuteToggle }: HeaderProps) {
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
            <p className="text-xs md:text-sm text-muted-foreground">{scheduleName}</p>
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
