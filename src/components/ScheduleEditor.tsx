import { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Plus, Trash2, GripVertical, Save, X, Play, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Schedule, 
  Section, 
  ScheduleGroup,
  getAllSchedules, 
  getAllGroups,
  saveSchedule, 
  saveGroup,
  deleteSchedule,
  deleteGroup,
  setActiveSchedule,
  recalculateSectionTimes,
  formatTime12Hour,
  DAY_OPTIONS,
  DayOfWeek,
} from '@/lib/scheduleStore';
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
  const [groups, setGroups] = useState<ScheduleGroup[]>([]);
  const [activeScheduleId, setActiveScheduleId] = useState<string>(currentScheduleId || 'tuesday');
  const [activeGroupId, setActiveGroupId] = useState<string>('standard');
  const [hasChanges, setHasChanges] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    Promise.all([getAllSchedules(), getAllGroups()]).then(([loadedSchedules, loadedGroups]) => {
      setSchedules(loadedSchedules);
      setGroups(loadedGroups);
      if (currentScheduleId) {
        setActiveScheduleId(currentScheduleId);
        const schedule = loadedSchedules.find(s => s.id === currentScheduleId);
        if (schedule) {
          setActiveGroupId(schedule.groupId);
        }
      }
    });
  }, [currentScheduleId]);

  const activeSchedule = schedules.find(s => s.id === activeScheduleId);
  const groupSchedules = schedules.filter(s => s.groupId === activeGroupId);

  const updateSchedule = (updates: Partial<Schedule>) => {
    setSchedules(prev => prev.map(s => 
      s.id === activeScheduleId ? { ...s, ...updates } : s
    ));
    setHasChanges(true);
  };

  const updateClassStartTime = (newStartTime: string) => {
    if (!activeSchedule) return;
    const newSections = recalculateSectionTimes(newStartTime, activeSchedule.sections);
    updateSchedule({ classStartTime: newStartTime, sections: newSections });
  };

  const updateSectionDuration = (sectionId: string, newDuration: number) => {
    if (!activeSchedule) return;
    const updatedSections = activeSchedule.sections.map(s =>
      s.id === sectionId ? { ...s, durationMinutes: newDuration } : s
    );
    const recalculated = recalculateSectionTimes(activeSchedule.classStartTime, updatedSections);
    updateSchedule({ sections: recalculated });
  };

  const updateSections = (newSections: Section[]) => {
    if (!activeSchedule) return;
    const recalculated = recalculateSectionTimes(activeSchedule.classStartTime, newSections);
    updateSchedule({ sections: recalculated });
  };

  const addSection = () => {
    if (!activeSchedule) return;
    
    const newSection: Section = {
      id: Date.now().toString(),
      name: 'New Section',
      startTime: '00:00',
      endTime: '00:00',
      durationMinutes: 15,
      color: SECTION_COLORS[activeSchedule.sections.length % SECTION_COLORS.length],
      playEndBell: true,
      playTwoMinWarning: false,
    };
    
    const newSections = [...activeSchedule.sections, newSection];
    const recalculated = recalculateSectionTimes(activeSchedule.classStartTime, newSections);
    updateSchedule({ sections: recalculated });
  };

  const removeSection = (id: string) => {
    if (!activeSchedule) return;
    const newSections = activeSchedule.sections.filter(s => s.id !== id);
    const recalculated = recalculateSectionTimes(activeSchedule.classStartTime, newSections);
    updateSchedule({ sections: recalculated });
  };

  const updateSection = (id: string, updates: Partial<Section>) => {
    if (!activeSchedule) return;
    const newSections = activeSchedule.sections.map(s => 
      s.id === id ? { ...s, ...updates } : s
    );
    // Only recalculate if duration changed
    if ('durationMinutes' in updates) {
      const recalculated = recalculateSectionTimes(activeSchedule.classStartTime, newSections);
      updateSchedule({ sections: recalculated });
    } else {
      updateSchedule({ sections: newSections });
    }
  };

  const handleSetActive = async (scheduleId: string) => {
    // Update local state
    setSchedules(prev => prev.map(s => ({
      ...s,
      isActive: s.id === scheduleId
    })));
    setHasChanges(true);
  };

  const duplicateSchedule = () => {
    if (!activeSchedule) return;
    
    const newSchedule: Schedule = {
      ...activeSchedule,
      id: Date.now().toString(),
      name: `${activeSchedule.name} (Copy)`,
      isActive: false,
      dayOfWeek: undefined,
    };
    
    setSchedules(prev => [...prev, newSchedule]);
    setActiveScheduleId(newSchedule.id);
    setHasChanges(true);
    toast.success('Schedule duplicated');
  };

  const handleDeleteSchedule = async () => {
    if (!activeSchedule || schedules.length <= 1) {
      toast.error('Cannot delete the last schedule');
      return;
    }
    
    await deleteSchedule(activeSchedule.id);
    const remaining = schedules.filter(s => s.id !== activeSchedule.id);
    setSchedules(remaining);
    const nextSchedule = groupSchedules.find(s => s.id !== activeSchedule.id) || remaining[0];
    setActiveScheduleId(nextSchedule.id);
    toast.success('Schedule deleted');
  };

  const addNewGroup = () => {
    if (!newGroupName.trim()) return;
    
    const newGroup: ScheduleGroup = {
      id: Date.now().toString(),
      name: newGroupName.trim(),
      scheduleIds: [],
    };
    
    setGroups(prev => [...prev, newGroup]);
    setNewGroupName('');
    setHasChanges(true);
    toast.success('Group created');
  };

  const createScheduleInGroup = () => {
    const newSchedule: Schedule = {
      id: Date.now().toString(),
      name: 'New Schedule',
      scheduleType: 'custom',
      groupId: activeGroupId,
      isActive: false,
      dayOfWeek: undefined,
      classStartTime: '18:00',
      warningBellSound: 'classic',
      endBellSound: 'classic',
      sections: [
        { id: '1', name: 'Section 1', startTime: '18:00', endTime: '18:30', durationMinutes: 30, color: SECTION_COLORS[0], playEndBell: true, playTwoMinWarning: false },
      ],
    };
    
    setSchedules(prev => [...prev, newSchedule]);
    setActiveScheduleId(newSchedule.id);
    setHasChanges(true);
  };

  const handleSave = async () => {
    for (const schedule of schedules) {
      await saveSchedule(schedule);
    }
    for (const group of groups) {
      await saveGroup(group);
    }
    // Update active schedule in DB
    const activeOne = schedules.find(s => s.isActive);
    if (activeOne) {
      await setActiveSchedule(activeOne.id);
    }
    setHasChanges(false);
    toast.success('Schedules saved successfully');
  };

  const testEndBell = () => {
    if (activeSchedule) {
      audioSystem.testSound(activeSchedule.endBellSound);
    }
  };

  const testWarningBell = () => {
    if (activeSchedule) {
      audioSystem.testWarningSound(activeSchedule.warningBellSound);
    }
  };

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

        {/* Group selector */}
        <div className="mb-6">
          <Label className="text-sm text-muted-foreground mb-2 block">Schedule Group</Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {groups.map(group => (
              <button
                key={group.id}
                onClick={() => {
                  setActiveGroupId(group.id);
                  const firstInGroup = schedules.find(s => s.groupId === group.id);
                  if (firstInGroup) setActiveScheduleId(firstInGroup.id);
                }}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-all text-sm
                  ${activeGroupId === group.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }
                `}
              >
                {group.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="New group name..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="max-w-xs bg-background/50"
              onKeyDown={(e) => e.key === 'Enter' && addNewGroup()}
            />
            <Button variant="outline" size="sm" onClick={addNewGroup} disabled={!newGroupName.trim()}>
              <Plus className="w-4 h-4 mr-1" />
              Add Group
            </Button>
          </div>
        </div>

        {/* Schedule selector within group */}
        <div className="flex flex-wrap gap-2 mb-4">
          {groupSchedules.map(schedule => (
            <button
              key={schedule.id}
              onClick={() => setActiveScheduleId(schedule.id)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2
                ${activeScheduleId === schedule.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }
              `}
            >
              {schedule.isActive && <Check className="w-3 h-3" />}
              {schedule.name}
            </button>
          ))}
          <Button variant="outline" size="sm" onClick={createScheduleInGroup} className="gap-1">
            <Plus className="w-4 h-4" />
            New Schedule
          </Button>
        </div>

        {/* Schedule actions */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={duplicateSchedule} className="gap-2">
            <Copy className="w-4 h-4" />
            Duplicate
          </Button>
          {activeSchedule && !activeSchedule.isActive && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleSetActive(activeSchedule.id)}
              className="gap-2"
            >
              <Check className="w-4 h-4" />
              Set as Active
            </Button>
          )}
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

        {activeSchedule && (
          <>
            {/* Schedule settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Schedule Name</Label>
                <Input
                  value={activeSchedule.name}
                  onChange={(e) => updateSchedule({ name: e.target.value })}
                  className="bg-background/50"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Class Start Time</Label>
                <Input
                  type="time"
                  value={activeSchedule.classStartTime}
                  onChange={(e) => updateClassStartTime(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Day of Week</Label>
                <Select 
                  value={activeSchedule.dayOfWeek || ''} 
                  onValueChange={(value) => updateSchedule({ dayOfWeek: value as DayOfWeek || undefined })}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select day..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value || 'none'} value={opt.value || 'none'}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  {activeSchedule.isActive && <span className="text-primary font-medium">(Active) </span>}
                  Status
                </Label>
                <div className="h-10 flex items-center">
                  {activeSchedule.isActive ? (
                    <span className="text-primary font-medium">Currently Active Schedule</span>
                  ) : (
                    <span className="text-muted-foreground">Not active</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bell sound settings */}
            <div className="glass-panel p-4 mb-6">
              <h3 className="font-semibold mb-4">Bell Sounds</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Warning Bell (5-min & 2-min)</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={activeSchedule.warningBellSound} 
                      onValueChange={(value) => updateSchedule({ warningBellSound: value as BellSound })}
                    >
                      <SelectTrigger className="bg-background/50 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BELL_SOUNDS.map(sound => (
                          <SelectItem key={sound.id} value={sound.id}>{sound.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={testWarningBell}>
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">End Bell (Section End)</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={activeSchedule.endBellSound} 
                      onValueChange={(value) => updateSchedule({ endBellSound: value as BellSound })}
                    >
                      <SelectTrigger className="bg-background/50 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BELL_SOUNDS.map(sound => (
                          <SelectItem key={sound.id} value={sound.id}>{sound.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={testEndBell}>
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sections list */}
            <Label className="text-sm text-muted-foreground mb-2 block">Sections</Label>
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
                      {/* Row 1: Name and duration */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input
                          value={section.name}
                          onChange={(e) => updateSection(section.id, { name: e.target.value })}
                          placeholder="Section name"
                          className="bg-background/50"
                        />
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            max={180}
                            value={section.durationMinutes}
                            onChange={(e) => updateSectionDuration(section.id, parseInt(e.target.value) || 15)}
                            className="bg-background/50 w-20"
                          />
                          <span className="text-sm text-muted-foreground">minutes</span>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          {formatTime12Hour(section.startTime)} - {formatTime12Hour(section.endTime)}
                        </div>
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

            <Button
              onClick={addSection}
              variant="outline"
              className="w-full mt-4 gap-2 border-dashed"
            >
              <Plus className="w-4 h-4" />
              Add Section
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}
