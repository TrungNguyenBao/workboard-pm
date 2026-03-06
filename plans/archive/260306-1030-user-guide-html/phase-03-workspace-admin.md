# Phase 3: Workspace & Admin Guide

## Priority: High | Status: Pending

## Overview
Cover workspace management, member invitations, role-based access, and admin responsibilities.

## Content Outline

### 3.1 Workspace Management
- Switching workspaces (sidebar dropdown)
- Renaming workspace (inline edit in sidebar)
- Creating additional workspaces

### 3.2 Members Page (`/members`) [Admin]
- View all members: avatar, name, email, role badge
- Invite members: click "Invite" → enter email + select role
- Change member role: inline dropdown (admin/member/guest)
- Remove member from workspace

### 3.3 Roles & Permissions
- **Admin**: full access — manage members, roles, all modules, settings
- **Member**: standard access — use all modules, create/edit own content
- **Guest**: read-only access — view content, cannot create or modify
- Table: role × capability matrix

### 3.4 Project-Level Roles (PMS specific)
- **Owner**: full project control, can archive/delete
- **Editor**: create/edit tasks, manage sections
- **Commenter**: view + comment only
- **Viewer**: read-only project access

## Implementation Steps
1. Write HTML content for sections 3.1–3.4
2. Admin-only sections tagged with `<span class="badge-admin">Admin</span>`
3. Include role permission table (workspace roles × actions)
4. Include project role table (PMS roles × actions)

## Success Criteria
- Clear explanation of 2-tier RBAC (workspace + project)
- Admin actions clearly marked
