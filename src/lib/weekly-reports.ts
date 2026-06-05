import type {
  ActivityLogEntry,
  Approval,
  Division,
  DivisionCode,
  Project,
  Task,
  TaskComment,
  User,
  WeeklyReport,
} from '@/lib/supabase/types';

const ALLAN_EMAIL = 'allan.chan@elevateoco.com';

export interface WeekRange {
  start: string;
  end: string;
  startLabel: string;
  endLabel: string;
}

export interface WeeklyDigest {
  completedTasks: Task[];
  activeTasks: Task[];
  reviewRequested: Approval[];
  reviewApproved: Approval[];
  reviewRejected: Approval[];
  approvalsGiven: Approval[];
  commentsMade: TaskComment[];
  activity: ActivityLogEntry[];
}

export interface DivisionReportContext {
  code: DivisionCode;
  label: string;
}

function asDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getCurrentWeekRange(today = new Date()): WeekRange {
  const current = new Date(today);
  current.setHours(0, 0, 0, 0);
  const day = current.getDay();
  const diffToMonday = (day + 6) % 7;
  const start = new Date(current);
  start.setDate(current.getDate() - diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: asDateOnly(start),
    end: asDateOnly(end),
    startLabel: start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    endLabel: end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
  };
}

export function getDirectReports(managerId: string, users: User[]) {
  return users.filter((user) => user.manager_id === managerId);
}

export function getDivisionReportContexts(user: User): DivisionReportContext[] {
  return user.divisions.map((code) => ({
    code,
    label: code === 'admin' ? 'People Management' : code.charAt(0).toUpperCase() + code.slice(1),
  }));
}

export function getReviewerForDivision(
  user: User,
  divisionCode: DivisionCode,
  users: User[],
  divisions: Pick<Division, 'code' | 'owner_id'>[],
) {
  const divisionOwnerId = divisions.find((division) => division.code === divisionCode)?.owner_id ?? null;
  if (divisionOwnerId && divisionOwnerId !== user.id) {
    return users.find((entry) => entry.id === divisionOwnerId) ?? null;
  }
  if (user.manager_id) return users.find((entry) => entry.id === user.manager_id) ?? null;
  if (user.email.toLowerCase() === ALLAN_EMAIL) return null;
  return users.find((entry) => entry.email.toLowerCase() === ALLAN_EMAIL) ?? null;
}

function inRange(value: string | null | undefined, start: string, end: string) {
  if (!value) return false;
  const dateOnly = value.slice(0, 10);
  return dateOnly >= start && dateOnly <= end;
}

export function buildWeeklyDigest(
  subject: User,
  divisionCode: DivisionCode,
  week: WeekRange,
  tasks: Task[],
  approvals: Approval[],
  comments: TaskComment[],
  activity: ActivityLogEntry[],
  projects: Project[],
): WeeklyDigest {
  const projectIds = new Set(
    projects.filter((project) => project.division_id === divisionCode).map((project) => project.id),
  );
  const subjectTasks = tasks.filter(
    (task) => task.assigned_to === subject.id && !!task.project_id && projectIds.has(task.project_id),
  );
  const taskIds = new Set(subjectTasks.map((task) => task.id));

  return {
    completedTasks: subjectTasks.filter((task) => inRange(task.completed_at, week.start, week.end)),
    activeTasks: subjectTasks.filter((task) => task.status !== 'done' && task.status !== 'rejected'),
    reviewRequested: approvals.filter(
      (approval) =>
        approval.requested_by === subject.id &&
        taskIds.has(approval.task_id) &&
        inRange(approval.created_at, week.start, week.end),
    ),
    reviewApproved: approvals.filter(
      (approval) =>
        approval.requested_by === subject.id &&
        taskIds.has(approval.task_id) &&
        approval.status === 'approved' &&
        inRange(approval.decided_at, week.start, week.end),
    ),
    reviewRejected: approvals.filter(
      (approval) =>
        approval.requested_by === subject.id &&
        taskIds.has(approval.task_id) &&
        approval.status === 'rejected' &&
        inRange(approval.decided_at, week.start, week.end),
    ),
    approvalsGiven: approvals.filter(
      (approval) =>
        approval.reviewer_id === subject.id &&
        taskIds.has(approval.task_id) &&
        inRange(approval.decided_at, week.start, week.end),
    ),
    commentsMade: comments.filter(
      (comment) =>
        comment.user_id === subject.id &&
        taskIds.has(comment.task_id) &&
        inRange(comment.created_at, week.start, week.end),
    ),
    activity: activity.filter((entry) => {
      if (entry.actor_id !== subject.id || !inRange(entry.created_at, week.start, week.end)) return false;
      if (entry.entity_type === 'task') return taskIds.has(entry.entity_id);
      if (entry.entity_type === 'project') return projectIds.has(entry.entity_id);
      return false;
    }),
  };
}

export function buildAutoSummary(args: {
  subject: User;
  divisionLabel: string;
  week: WeekRange;
  digest: WeeklyDigest;
  projects: Project[];
  childReports?: WeeklyReport[];
}) {
  const { subject, divisionLabel, week, digest, projects, childReports = [] } = args;
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const lines = [
    `${subject.full_name} ${divisionLabel.toLowerCase()} weekly summary for ${week.startLabel} - ${week.endLabel}.`,
    `Completed tasks: ${digest.completedTasks.length}.`,
  ];

  if (digest.completedTasks.length) {
    lines.push(
      ...digest.completedTasks.slice(0, 5).map((task) => {
        const project = task.project_id ? projectMap.get(task.project_id)?.title : null;
        return `- Completed: ${task.title}${project ? ` (${project})` : ''}`;
      }),
    );
  }

  lines.push(`Open active tasks: ${digest.activeTasks.length}.`);
  lines.push(
    `Reviews requested: ${digest.reviewRequested.length}. Approved: ${digest.reviewApproved.length}. Rejected: ${digest.reviewRejected.length}.`,
  );

  if (digest.approvalsGiven.length) {
    lines.push(`Approvals given as reviewer: ${digest.approvalsGiven.length}.`);
  }

  if (digest.commentsMade.length) {
    lines.push(`Task comments added: ${digest.commentsMade.length}.`);
  }

  if (digest.activity.length) {
    lines.push(...digest.activity.slice(0, 4).map((entry) => `- Activity: ${entry.action}`));
  }

  if (childReports.length) {
    lines.push(`Team reports included: ${childReports.length}.`);
    lines.push(
      ...childReports.slice(0, 5).map((report) => {
        const excerpt = (report.reviewer_summary || report.manual_summary || report.auto_summary)
          .split('\n')
          .find((line) => line.trim().length > 0);
        return `- Team: ${excerpt ?? 'Weekly report submitted.'}`;
      }),
    );
  }

  return lines.join('\n');
}
