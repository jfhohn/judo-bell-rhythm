import { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Plus, Trash2, GripVertical, Save, X, Play, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Schedule, Section, getAllSchedules, saveSchedule, deleteSchedule } from '@/lib/scheduleStore';
import { audioSystem, BELL_SOUNDS, BellSound } from '@/lib/audioSystem';
import { toast } from 'sonner';

interface ScheduleEditorProps {
  onClose: () => void;
  currentScheduleId?: string;
}

const SECTION_COLORS = [
  'hsl(142 76% 36%)',
  'hsl(217 91% 60%)',
  'hsl(280 70% 50%)',
  'hsl(38 92% 50%)',
  'hsl(0 84% 60%)',
  'hsl(180 70% 45%)',
];

export function ScheduleEditor({ onClose, currentScheduleId }: ScheduleEditorProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [activeScheduleId, setActiveScheduleId] = useState<string>(currentScheduleId || 'tuesday');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    getAllSchedules().then(loaded => {
      setSchedules(loaded);
      if (currentScheduleId) {
        setActiveScheduleId(currentScheduleId);
      }
    });
  }, [currentScheduleId]);

  const activeSchedule = schedules.find(s => s.id === activeScheduleId);

  const updateSchedule = (updates: Partial<Schedule>) => {
    setSchedules(prev => prev.map(s => 
      s.id === activeScheduleId ? { ...s, ...updates } : s
    ));
    setHasChanges(true);
  };

  const updateSections = (newSections: Section[]) => {
    updateSchedule({ sections: newSections });
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
      playEndBell: true,
      playTwoMinWarning: false,
      bellSound: 'classic',
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

  const duplicateSchedule = async () => {
    if (!activeSchedule) return;
    
    const newSchedule: Schedule = {
      ...activeSchedule,
      id: Date.now().toString(),
      name: `${activeSchedule.name} (Copy)`,
      associatedDays: [],
    };
    
    setSchedules(prev => [...prev, newSchedule]);
    await saveSchedule(newSchedule);
    setActiveScheduleId(newSchedule.id);
    toast.success('Schedule duplicated');
  };

  const handleDeleteSchedule = async () => {
    if (!activeSchedule || schedules.length <= 1) {
      toast.error('Cannot delete the last schedule');
      return;
    }
    
    await deleteSchedule(activeSchedule.id);
    setSchedules(prev => prev.filter(s => s.id !== activeSchedule.id));
    setActiveScheduleId(schedules[0].id === activeSchedule.id ? schedules[1].id : schedules[0].id);
    toast.success('Schedule deleted');
  };

  const handleSave = async () => {
    for (const schedule of schedules) {
      await saveSchedule(schedule);
    }
    setHasChanges(false);
    toast.success('Schedules saved successfully');
  };

  const testSound = (soundId: string) => {
    audioSystem.testSound(soundId as BellSound);
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
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
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

        {/* Schedule selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {schedules.map(schedule => (
            <button
              key={schedule.id}
              onClick={() => setActiveScheduleId(schedule.id)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all text-sm
                ${activeScheduleId === schedule.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }
              `}
            >
              {schedule.name}
            </button>
          ))}
        </div>

        {/* Schedule actions */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={duplicateSchedule} className="gap-2">
            <Copy className="w-4 h-4" />
            Duplicate
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDeleteSchedule}
            className="gap-2 text-destructive hover:text-destructive"
            disabled={schedules.length <= 1}
          >
            <Trash2 className="w-4 h-4" />
            Delete Schedule
          </Button>
        </div>

        {/* Schedule name */}
        {activeSchedule && (
          <div className="mb-6">
            <label className="text-sm text-muted-foreground mb-2 block">Schedule Name</label>
            <Input
              value={activeSchedule.name}
              onChange={(e) => updateSchedule({ name: e.target.value })}
              className="max-w-sm bg-background/50"
            />
          </div>
        )}

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
                <div className="flex items-start gap-4">
                  <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-2" />
                  
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0 mt-2"
                    style={{ backgroundColor: section.color }}
                  />

                  <div className="flex-1 space-y-3">
                    {/* Row 1: Name and times */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

                    {/* Row 2: Audio options */}
                    <div className="flex flex-wrap items-center gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={section.playEndBell}
                          onCheckedChange={(checked) => 
                            updateSection(section.id, { playEndBell: checked as boolean })
                          }
                        />
                        <span>End bell</span>
                      </label>

                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={section.playTwoMinWarning}
                          onCheckedChange={(checked) => 
                            updateSection(section.id, { playTwoMinWarning: checked as boolean })
                          }
                        />
                        <span>2-min warning</span>
                      </label>

                      <div className="flex items-center gap-2">
                        <Select
                          value={section.bellSound}
                          onValueChange={(value) => updateSection(section.id, { bellSound: value })}
                        >
                          <SelectTrigger className="w-32 bg-background/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BELL_SOUNDS.map(sound => (
                              <SelectItem key={sound.id} value={sound.id}>
                                {sound.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => testSound(section.bellSound)}
                          className="h-8 w-8"
                          title="Test sound"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
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
