import { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Plus, Trash2, GripVertical, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Schedule, Section, getAllSchedules, saveSchedule } from '@/lib/scheduleStore';
import { toast } from 'sonner';

interface ScheduleEditorProps {
  onClose: () => void;
}

const SECTION_COLORS = [
  'hsl(142 76% 36%)', // Green
  'hsl(217 91% 60%)', // Blue
  'hsl(280 70% 50%)', // Purple
  'hsl(38 92% 50%)',  // Orange
  'hsl(0 84% 60%)',   // Red
  'hsl(180 70% 45%)', // Cyan
];

export function ScheduleEditor({ onClose }: ScheduleEditorProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [activeDay, setActiveDay] = useState<Schedule['day']>('tuesday');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    getAllSchedules().then(setSchedules);
  }, []);

  const activeSchedule = schedules.find(s => s.day === activeDay);

  const updateSections = (newSections: Section[]) => {
    setSchedules(prev => prev.map(s => 
      s.day === activeDay ? { ...s, sections: newSections } : s
    ));
    setHasChanges(true);
  };

  const addSection = () => {
    if (!activeSchedule) return;
    
    const lastSection = activeSchedule.sections[activeSchedule.sections.length - 1];
    const newSection: Section = {
      id: Date.now().toString(),
      name: 'New Section',
      startTime: lastSection?.endTime || '18:00',
      endTime: lastSection ? addMinutes(lastSection.endTime, 30) : '18:30',
      color: SECTION_COLORS[activeSchedule.sections.length % SECTION_COLORS.length],
    };
    
    updateSections([...activeSchedule.sections, newSection]);
  };

  const removeSection = (id: string) => {
    if (!activeSchedule) return;
    updateSections(activeSchedule.sections.filter(s => s.id !== id));
  };

  const updateSection = (id: string, updates: Partial<Section>) => {
    if (!activeSchedule) return;
    updateSections(activeSchedule.sections.map(s => 
      s.id === id ? { ...s, ...updates } : s
    ));
  };

  const handleSave = async () => {
    for (const schedule of schedules) {
      await saveSchedule(schedule);
    }
    setHasChanges(false);
    toast.success('Schedules saved successfully');
  };

  function addMinutes(time: string, mins: number): string {
    const [h, m] = time.split(':').map(Number);
    const totalMins = h * 60 + m + mins;
    const newH = Math.floor(totalMins / 60) % 24;
    const newM = totalMins % 60;
    return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-auto"
    >
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">Schedule Editor</h2>
          <div className="flex gap-2">
            {hasChanges && (
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Save
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Day tabs */}
        <div className="flex gap-2 mb-6">
          {(['tuesday', 'thursday', 'saturday'] as const).map(day => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`
                px-4 py-2 rounded-lg font-medium capitalize transition-all
                ${activeDay === day 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }
              `}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Sections list */}
        {activeSchedule && (
          <Reorder.Group
            axis="y"
            values={activeSchedule.sections}
            onReorder={updateSections}
            className="space-y-3"
          >
            {activeSchedule.sections.map((section) => (
              <Reorder.Item
                key={section.id}
                value={section}
                className="glass-panel p-4 cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-center gap-4">
                  <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: section.color }}
                  />

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      value={section.name}
                      onChange={(e) => updateSection(section.id, { name: e.target.value })}
                      placeholder="Section name"
                      className="bg-background/50"
                    />
                    <Input
                      type="time"
                      value={section.startTime}
                      onChange={(e) => updateSection(section.id, { startTime: e.target.value })}
                      className="bg-background/50"
                    />
                    <Input
                      type="time"
                      value={section.endTime}
                      onChange={(e) => updateSection(section.id, { endTime: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSection(section.id)}
                    className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}

        <Button
          onClick={addSection}
          variant="outline"
          className="w-full mt-4 gap-2 border-dashed"
        >
          <Plus className="w-4 h-4" />
          Add Section
        </Button>
      </div>
    </motion.div>
  );
}
