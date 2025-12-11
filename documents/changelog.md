# Changelog

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
