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
  setActiveGroup,
  recalculateSectionTimes,
  formatTime12Hour,
  DAY_OPTIONS,
  DayOfWeek,
  resetToDefaults,
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
    loadData();
  }, [currentScheduleId]);

  const loadData = async () => {
    const [loadedSchedules, loadedGroups] = await Promise.all([getAllSchedules(), getAllGroups()]);
    setSchedules(loadedSchedules);
    setGroups(loadedGroups);
    
    if (currentScheduleId) {
      setActiveScheduleId(currentScheduleId);
      const schedule = loadedSchedules.find(s => s.id === currentScheduleId);
      if (schedule) {
        setActiveGroupId(schedule.groupId);
      }
    } else if (loadedGroups.length > 0) {
      // Set to first group if none selected
      setActiveGroupId(loadedGroups[0].id);
      const firstSchedule = loadedSchedules.find(s => s.groupId === loadedGroups[0].id);
      if (firstSchedule) {
        setActiveScheduleId(firstSchedule.id);
      } else {
        setActiveScheduleId('');
      }
    }
  };

  const handleResetToDefaults = async () => {
    if (!confirm('This will delete all your current schedules and restore defaults. Continue?')) {
      return;
    }
    await resetToDefaults();
    await loadData();
    toast.success('Schedules reset to defaults');
  };

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

  // Remove individual schedule active logic - now handled at group level

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
      isActive: false,
      scheduleIds: [],
    };
    
    setGroups(prev => [...prev, newGroup]);
    setNewGroupName('');
    setHasChanges(true);
    toast.success('Group created');
  };

  const handleSetActiveGroup = (groupId: string) => {
    setGroups(prev => prev.map(g => ({
      ...g,
      isActive: g.id === groupId
    })));
    setHasChanges(true);
    toast.success('Group set as active');
  };

  const handleDeleteGroup = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    const groupScheduleCount = schedules.filter(s => s.groupId === groupId).length;
    
    if (groups.length <= 1) {
      toast.error('Cannot delete the last group');
      return;
    }
    
    const confirmMessage = groupScheduleCount > 0 
      ? `Delete "${group.name}" and its ${groupScheduleCount} schedule(s)?`
      : `Delete "${group.name}"?`;
    
    if (!window.confirm(confirmMessage)) return;
    
    // Delete from IndexedDB immediately
    await deleteGroup(groupId);
    
    // If deleting active group, activate first remaining group
    const remainingGroups = groups.filter(g => g.id !== groupId);
    if (group.isActive && remainingGroups.length > 0) {
      await setActiveGroup(remainingGroups[0].id);
      setGroups(remainingGroups.map(g => 
        g.id === remainingGroups[0].id ? { ...g, isActive: true } : g
      ));
    } else {
      setGroups(remainingGroups);
    }
    
    // Remove schedules in this group from local state
    setSchedules(prev => prev.filter(s => s.groupId !== groupId));
    
    // Switch to another group in UI
    if (remainingGroups.length > 0) {
      setActiveGroupId(remainingGroups[0].id);
      const firstInGroup = schedules.find(s => s.groupId === remainingGroups[0].id);
      if (firstInGroup) setActiveScheduleId(firstInGroup.id);
    }
    
    toast.success('Group deleted');
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
    // Update active group in DB
    const activeGroup = groups.find(g => g.isActive);
    if (activeGroup) {
      await setActiveGroup(activeGroup.id);
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
            {groups.length === 0 && (
              <Button variant="outline" onClick={handleResetToDefaults}>
                Reset to Defaults
              </Button>
            )}
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
          
          {groups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">No schedule groups found.</p>
              <Button onClick={handleResetToDefaults}>
                Reset to Defaults
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-3">
              {groups.map(group => {
                const isCurrentGroup = activeGroupId === group.id;
                return (
                  <div key={group.id} className="relative group/item">
                    <button
                      onClick={() => {
                        setActiveGroupId(group.id);
                        const firstInGroup = schedules.find(s => s.groupId === group.id);
                        if (firstInGroup) {
                          setActiveScheduleId(firstInGroup.id);
                        } else {
                          setActiveScheduleId(''); // Clear when switching to empty group
                        }
                      }}
                      className={`
                        px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2
                        ${isCurrentGroup
                          ? 'bg-primary text-primary-foreground' 
                          : group.isActive
                          ? 'bg-primary/20 text-primary border border-primary/40'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }
                      `}
                    >
                      {group.isActive && <Check className="w-3 h-3" />}
                      {group.name}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          
          {groups.length > 0 && (
            <>
              {/* Group actions */}
              <div className="flex flex-wrap gap-2 mb-3">
                {groups.find(g => g.id === activeGroupId) && !groups.find(g => g.id === activeGroupId)?.isActive && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleSetActiveGroup(activeGroupId)}
                    className="gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Set Group as Active
                  </Button>
                )}
                {groups.length > 1 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteGroup(activeGroupId)}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Group
                  </Button>
                )}
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
            </>
          )}
        </div>

        {/* Empty group state - only show if groups exist but current group has no schedules */}
        {groups.length > 0 && groupSchedules.length === 0 ? (
          <div className="glass-panel p-8 mb-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No schedules in this group</h3>
            <p className="text-muted-foreground mb-4">Create your first schedule to get started</p>
            <Button onClick={createScheduleInGroup} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Schedule
            </Button>
          </div>
        ) : groups.length > 0 && (
          <>
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
          </>
        )}

        {activeSchedule && activeSchedule.groupId === activeGroupId && (
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
                  className="bg-background/50 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:invert"
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
                <Label className="text-sm text-muted-foreground mb-2 block">Day Assignment</Label>
                <div className="h-10 flex items-center text-sm text-muted-foreground">
                  Auto-loads on assigned day within the active group
                </div>
              </div>
            </div>

            {/* Bell sound settings */}
            <div className="glass-panel p-4 mb-6">
              <h3 className="font-semibold mb-4">Bell Sounds</h3>
              <p className="text-xs text-muted-foreground mb-4">5-minute warning is visual only (yellow). 2-minute warning plays the bell sound below.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">2-Minute Warning Bell</Label>
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
