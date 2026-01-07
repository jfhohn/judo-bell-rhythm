# Changelog

## [3.0.4] - 2024-12-16

### Fixed
- **Double-bell issue**: Fixed race condition causing end bell to play twice at section transitions
  - Added precise timing trigger at exactly 0-1 seconds remaining for on-time bell
  - Kept transition-based trigger as fallback for edge cases (class ending, browser throttling)
  - Added 10-second cooldown protection to prevent double-firing
  - Bell now plays exactly once at section end, on time
  - Improved logging distinguishes between precise timing and fallback triggers

## [3.0.3] - 2024-12-11

### Changed
- **Updated Default Schedules**: New default schedules match SVJ's actual class structure
  - Standard group: Tuesday, Thursday, Saturday with full class timings
  - Tournament Prep group: Comp schedules with more randori-focused structure
- **Bell Sounds**: Default to "Boxing" warning bell and "Loud School Bell" end bell
- **Cleaned up debug code**: Removed console.log statements and dev-only export function

## [3.0.2] - 2024-12-11

### Added
- **New Bell Sounds**: Added "Loud School Bell" and "Boxing Bell" MP3-based sounds for warning and end bells
- **Reset to Defaults**: Button to restore default schedules when all data is deleted

### Fixed
- **Empty schedule editor**: Fixed issue where deleting all schedules left editor unusable. Now auto-creates defaults when both groups and schedules are empty
- **Save button functionality**: Fixed save not working when groups were empty by properly handling empty state

## [3.0.1] - 2024-12-11

### Fixed
- **Schedule persistence**: User changes (deletions, edits) now persist correctly after refresh. Added initialization flag to prevent default schedules from being re-created.
- **Empty group display**: Switching to a group with no schedules now correctly shows empty state instead of stale schedule data from previous selection.

## [3.0.0] - 2024-12-11

### Added
- **Schedule Groups**: Organize schedules into named groups (e.g., "Standard", "Tournament Prep", "Judo Clinic")
- **Group-Level Active State**: Active state now managed at GROUP level, not individual schedules
- **Auto-Switch on Group Change**: Selecting a group on main screen automatically sets it as active
- **Smart Schedule Selection**: Auto-loads best schedule based on active group, day-of-week, and current time
- **Auto-Advance to Next Class**: When current class ends, automatically switches to next schedule in active group
- **Empty Group State**: Visual UI with "Add Schedule" CTA when group has no schedules
- **Group Deletion**: Delete groups with confirmation dialog warning about contained schedules
- **Duration-Based Time Entry**: Define sections by duration; start/end times auto-calculated
- **Schedule-Level Bell Configuration**: Warning and End bells configured per-schedule, not per-section
- **Red Flashing Clock**: Clock display flashes red during final 2 minutes of any section
- **Current Section Progress Bar**: Simplified progress display showing only current section (0-100%)

### Changed
- **Visual Warning System**:
  - 5-minute warning: Visual only (yellow flash) - NO audio
  - 2-minute warning: Visual (red flash) + audio bell
- Active group shows checkmark indicator in dropdowns
- Inactive groups appear dimmed in schedule editor
- Removed per-section bell sound configuration (now schedule-level)
- "Class has not begun" / "Class has ended" messages when outside schedule times

### Fixed
- End bell now triggers reliably (widened trigger window to 5 seconds)
- 2-minute warning bell plays correctly during live timer
- Group deletion persists to IndexedDB
- Audio context properly resumes for bell playback

## [2.0.0] - 2024-12-11

### Added
- Schedule groups for organizing multiple schedules
- Active/inactive schedule states with single-active enforcement
- Duration-based time entry (auto-calculates start/end times)
- Day-of-week assignment per schedule
- Differentiated warning bell vs end bell sounds
- Red flashing clock animation in final 2 minutes
- Current section progress bar (replaced full timeline)
- Schedule-level bell sound configuration

### Changed
- Simplified UI: removed section list, showing only current section progress
- Bell sounds now configured at schedule level, not per-section
- Auto-load priority: Active + matching day → Active + "any" → Active → Day match → First

### Fixed
- Critical: Audio bells now play correctly during live timer (fixed audio context resume)
- Section end bell timing improved with transition detection

## [1.0.0] - Initial Release

### Added
- Basic schedule timer with section management
- Per-section audio configuration
- Multiple bell sounds
- 12-hour time format
- IndexedDB persistence
