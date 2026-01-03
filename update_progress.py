#!/usr/bin/env python3
"""
README Progress Updater for Python Foundations Lab
Automatically updates progress metrics, module status, and stats in README.md

Usage:
    # Complete a module
    python update_progress.py --complete 1
    
    # Start working on a module
    python update_progress.py --start 2
    
    # Update commit count
    python update_progress.py --commits 45
    
    # Combine multiple updates
    python update_progress.py --complete 3 --start 4 --commits 32
"""

import re
import argparse
from pathlib import Path
from datetime import datetime
from typing import Optional


class ProgressUpdater:
    """Handles all README.md progress updates"""
    
    # Module information
    MODULE_NAMES = {
        1: "Hello World",
        2: "Control Flow",
        3: "Lists",
        4: "Loops",
        5: "Functions",
        6: "Code Challenges I",
        7: "Strings",
        8: "Modules",
        9: "Dictionaries",
        10: "Files",
        11: "Classes",
        12: "Code Challenges II",
        13: "Next Steps"
    }
    TOTAL_MODULES = len(MODULE_NAMES)
    # Status emojis
    STATUS_ICONS = {
        "not_started": "🔴 Not Started",
        "in_progress": "🟡 In Progress",
        "complete": "✅ Complete",
        "locked": "⬜ Locked"
    }
    
    def __init__(self, readme_path: str = "README.md"):
        self.readme_path = Path(readme_path)

        if not self.readme_path.exists():
            raise FileNotFoundError(f"README.md not found at {self.readme_path}")
        
        self.readme_content = self.readme_path.read_text(encoding="utf-8")
        self.backup_path = self.readme_path.with_suffix('.md.backup')

    def get_current_percent(self) -> int:
        """Read the current percent already in README (keeps Codecademy % stable)."""
        m = re.search(r'https://geps\.dev/progress/(\d+)', self.readme_content)
        if m:
            return int(m.group(1))

        m = re.search(r'PROGRESS-(\d+)%25_Complete', self.readme_content)
        if m:
            return int(m.group(1))

        return 0
    
    def backup(self):
        """Create a backup of current README"""
        self.backup_path.write_text(self.readme_content, encoding="utf-8")
        print(f"✅ Backup created: {self.backup_path}")
    
    def count_completed_modules(self) -> int:
        """Count how many modules are marked as complete"""
        pattern = r'\| \d+ \|.*?\| ✅ Complete \|'
        matches = re.findall(pattern, self.readme_content)
        return len(matches)
    
    def update_progress_bar(self, percent: Optional[int] = None):
        """
        Update the progress bar percentage.
        If percent is None, DO NOT change it (keeps your manual/Codecademy number).
        """
        if percent is None:
            percent = self.get_current_percent()

        pattern = r'https://geps\.dev/progress/\d+'
        replacement = f'https://geps.dev/progress/{percent}'
        self.readme_content = re.sub(pattern, replacement, self.readme_content)

        # Also update the top PROGRESS badge
        badge_pattern = r'https://img\.shields\.io/badge/PROGRESS-\d+%25_Complete'
        badge_replacement = f'https://img.shields.io/badge/PROGRESS-{percent}%25_Complete'
        self.readme_content = re.sub(badge_pattern, badge_replacement, self.readme_content)

        print(f"📊 Progress bar updated: {percent}%")
        return percent

    
    def update_stats_line(
        self,
        modules: Optional[int] = None,
        commits: Optional[int] = None,
        status: Optional[str] = None,
        percent: Optional[int] = None,
    ):
        if modules is None:
            modules = self.count_completed_modules()

        if percent is None:
            percent = self.get_current_percent()

        if status is None:
            if percent == 0:
                status = "Just Getting Started"
            elif percent < 15:
                status = "Building Momentum"
            elif percent < 50:
                status = "Making Strong Progress"
            elif percent < 75:
                status = "Over Halfway There"
            elif percent < 100:
                status = "Final Sprint"
            else:
                status = "Course Complete! 🎉"

        if commits is None:
            match = re.search(r'\*\*(\d+) Commits\*\*', self.readme_content)
            commits = int(match.group(1)) if match else 0

        pattern = r'\*\*\d+% Complete\*\* • \*\*\d+/\d+ Modules\*\* • \*\*\d+ Commits\*\* • \*\*.*?\*\*'
        replacement = f'**{percent}% Complete** • **{modules}/{self.TOTAL_MODULES} Modules** • **{commits} Commits** • **{status}**'
        self.readme_content = re.sub(pattern, replacement, self.readme_content)

        print(f"📈 Stats updated: {percent}% | {modules}/{self.TOTAL_MODULES} modules | {commits} commits")

    
    def update_module_status(self, module_num: int, status: str):
        """
        Update a specific module's status in the table
        status options: 'not_started', 'in_progress', 'complete', 'locked'
        """
        if module_num not in self.MODULE_NAMES:
            print(f"⚠️  Invalid module number: {module_num}")
            return
        
        status_text = self.STATUS_ICONS.get(status, status)
        module_name = self.MODULE_NAMES[module_num]
        
        # Pattern to match the module row
        pattern = rf'(\| {module_num} \| \*\*{re.escape(module_name)}\*\* \|[^|]+\|[^|]+\|[^|]+\|[^|]+\|) [🔴🟡✅⬜][^|]+ \|'
        replacement = rf'\1 {status_text} |'
        
        self.readme_content = re.sub(pattern, replacement, self.readme_content)
        print(f"✏️  Module {module_num} ({module_name}): {status_text}")
    
    def complete_module(self, module_num: int):
        """Mark a module as complete and unlock the next one"""
        self.update_module_status(module_num, 'complete')
        
        # Unlock next module if it exists
        if module_num < self.TOTAL_MODULES:
            next_module = module_num + 1
            self.update_module_status(next_module, 'not_started')
            print(f"🔓 Module {next_module} unlocked!")
    
    def start_module(self, module_num: int):
        """Mark a module as in progress"""
        self.update_module_status(module_num, 'in_progress')
    
    def update_current_module_section(self, module_num: int):
        """Update the 'CURRENT MODULE' section heading"""
        if module_num not in self.MODULE_NAMES:
            return
        
        module_name = self.MODULE_NAMES[module_num].upper()
        badge_name = module_name.replace(" ", "_")
        
        # Find and update the current module section
        pattern = r'## 🚀 CURRENT MODULE:.*?\n\n<img src="https://img\.shields\.io/badge/MODULE_\d+-.*?-'
        replacement = f'## 🚀 CURRENT MODULE: {module_name}\n\n<img src="https://img.shields.io/badge/MODULE_{module_num:02d}-{badge_name}-'
        
        self.readme_content = re.sub(pattern, replacement, self.readme_content)
        print(f"📍 Current module section updated to: {module_name}")
    
    def increment_commits(self, count: int = 1):
        """Increment the commit counter"""
        pattern = r'\*\*(\d+) Commits\*\*'
        match = re.search(pattern, self.readme_content)
        
        if match:
            current = int(match.group(1))
            new_count = current + count
            self.readme_content = re.sub(pattern, f'**{new_count} Commits**', self.readme_content)
            print(f"📝 Commits: {current} → {new_count}")
        else:
            print("⚠️  Could not find commit counter")
    
    def add_weekly_log_entry(self, week_num: int, date_range: str):
        """Add a new weekly log entry template"""
        template = f'''
<details open>
<summary><b>🗓️ Week {week_num}: {date_range}</b></summary>

### This Week's Achievements
- ✅ [Achievement 1]
- ✅ [Achievement 2]
- ✅ [Achievement 3]
- 📝 [X] commits this week
- ⏱️ [X] hours of focused work

### Key Learnings
- [Learning 1]
- [Learning 2]
- [Learning 3]

### Challenges & Solutions
**Challenge:** [Description]  
**Solution:** [How you solved it]

### Next Week Goals
- [ ] [Goal 1]
- [ ] [Goal 2]
- [ ] [Goal 3]

</details>
'''
        
        # Find the weekly progress log section
        pattern = r'(## 📈 WEEKLY PROGRESS LOG\n\n)'
        if re.search(pattern, self.readme_content):
            self.readme_content = re.sub(pattern, rf'\1{template}', self.readme_content)
            print(f"📅 Added Week {week_num} log entry template")
        else:
            print("⚠️  Could not find Weekly Progress Log section")
    
    def save(self, create_backup: bool = True):
        """Save the updated README"""
        if create_backup:
            self.backup()
        
        self.readme_path.write_text(self.readme_content, encoding="utf-8")
        print(f"\n✨ README.md updated successfully!")
        print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    def restore_backup(self):
        """Restore from backup"""
        if self.backup_path.exists():
            self.readme_content = self.backup_path.read_text(encoding="utf-8")
            self.save(create_backup=False)
            print("♻️  Restored from backup")
        else:
            print("⚠️  No backup found")


def main():
    parser = argparse.ArgumentParser(
        description='Update Python Foundations Lab README.md progress',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Complete module 1 and start module 2 (keep percent at 9)
  python update_progress.py --complete 1 --start 2 --percent 9 --refresh

  # Update commit count
  python update_progress.py --commits 45

  # Add a weekly log entry
  python update_progress.py --weekly 3 --date-range "January 15-21, 2026"

  # Just refresh all stats (keeps current README percent)
  python update_progress.py --refresh
        """
    )

    parser.add_argument('--percent', type=int, metavar='N',
                        help='Set README percent (e.g., Codecademy percent)')

    parser.add_argument('--complete', type=int, metavar='N',
                        help='Mark module N as complete')
    parser.add_argument('--start', type=int, metavar='N',
                        help='Mark module N as in progress')
    parser.add_argument('--commits', type=int, metavar='N',
                        help='Set total commit count to N')
    parser.add_argument('--increment-commits', type=int, metavar='N', default=0,
                        help='Increment commit count by N')
    parser.add_argument('--weekly', type=int, metavar='N',
                        help='Add weekly log entry for week N')
    parser.add_argument('--date-range', type=str,
                        help='Date range for weekly log (e.g., "Jan 15-21, 2026")')
    parser.add_argument('--refresh', action='store_true',
                        help='Refresh all calculated stats')
    parser.add_argument('--no-backup', action='store_true',
                        help='Skip creating backup')
    parser.add_argument('--restore', action='store_true',
                        help='Restore from backup')

    args = parser.parse_args()

    updater = ProgressUpdater()

    if args.restore:
        updater.restore_backup()
        return

    updated = False

    if args.complete:
        updater.complete_module(args.complete)
        updated = True

    if args.start:
        updater.start_module(args.start)
        updater.update_current_module_section(args.start)
        updated = True

    if args.commits is not None:
        updater.update_stats_line(commits=args.commits)
        updated = True

    if args.increment_commits:
        updater.increment_commits(args.increment_commits)
        updated = True

    if args.weekly:
        date_range = args.date_range or datetime.now().strftime("%B %d, %Y")
        updater.add_weekly_log_entry(args.weekly, date_range)
        updated = True

    if args.refresh or updated:
        updater.update_progress_bar(percent=args.percent)
        updater.update_stats_line(percent=args.percent)
        updated = True

    if updated:
        updater.save(create_backup=not args.no_backup)
    else:
        print("ℹ️  No updates specified. Use --help for usage information.")
        parser.print_help()



if __name__ == "__main__":
    main()
