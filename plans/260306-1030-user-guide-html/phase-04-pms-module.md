# Phase 4: PMS Module Guide

## Priority: High | Status: Pending

## Overview
Comprehensive guide for Project Management — the largest module. Covers dashboard, my tasks, projects (5 views), task details, goals, and project settings.

## Content Outline

### 4.1 PMS Dashboard (`/pms/dashboard`)
- KPI cards: Total Tasks, Overdue, Completed This Week, Projects
- Bar chart: Tasks by Priority

### 4.2 My Tasks (`/pms/my-tasks`)
- Personal task view across all projects
- Time buckets: Overdue (red), Today (amber), Upcoming (7 days), Later
- Click task → opens detail drawer

### 4.3 Creating a Project
- Sidebar "+" button or project list
- Set project name, color (12 swatches), description
- Project appears in sidebar under PMS

### 4.4 Board View (`/pms/projects/:id/board`)
- Kanban columns = sections
- Drag cards between columns (repositions via fractional indexing)
- Filter by priority and status
- Add new section (column) at right
- Add task: click "+" in column

### 4.5 List View (`/pms/projects/:id/list`)
- Table grouped by section (collapsible)
- Columns: checkbox, title, priority badge, due date, assignee
- Inline search, filter by priority/status, sort options
- Inline "Add task" input at section bottom

### 4.6 Calendar View (`/pms/projects/:id/calendar`)
- Month grid showing tasks on due dates
- Color-coded by priority; completed = strikethrough
- Navigate months; "Today" button
- Max 3 tasks per day cell, "+N more" overflow

### 4.7 Timeline View (`/pms/projects/:id/timeline`)
- Gantt-chart horizontal bars
- Zoom: Weeks (8 weeks) or Months (24 weeks)
- Drag bars to change start/end dates
- Navigate with prev/next; "Today" button

### 4.8 Overview (`/pms/projects/:id/overview`)
- Stats: Total, Completed %, In Progress, Overdue
- Circular completion gauge
- Progress by section (horizontal bars)
- Priority distribution tiles
- Recent activity timeline
- Top contributors

### 4.9 Task Details (Drawer)
- Opens from any view (click task)
- Inline-editable title
- Complete/incomplete toggle
- Fields: Priority, Assignee, Due Date, Recurrence
- Description (inline edit)
- Tags (color chips, click to toggle)
- Custom Fields (project-defined)
- File Attachments (upload/download/delete)
- Subtasks (add, check off)
- Activity log
- Comments (add, delete)

### 4.10 Goals (`/pms/goals`)
- Card grid, filter by status (On Track, At Risk, Off Track, Achieved, Dropped)
- Create goal: title, status, owner, due date, tracking mode
- Goal detail drawer: edit all fields, link/unlink projects & tasks
- Manual tracking (slider 0–100%) or Auto (computed from linked items)

### 4.11 Project Settings [Admin/Owner]
- Change color, edit description
- Manage custom fields (text, number, date, select, multi-select)
- Archive project (reversible)

## Implementation Steps
1. Write HTML for each subsection (4.1–4.11) with descriptive paragraphs
2. Use tables for field descriptions where appropriate
3. Use tip callouts for shortcuts (e.g., "N" to create task, "G+B" for board)
4. Admin badge on 4.11

## Success Criteria
- All 5 project views clearly explained
- Task drawer fields comprehensively documented
- Goals workflow clear
