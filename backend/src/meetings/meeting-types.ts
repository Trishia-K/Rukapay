export const MEETING_TYPES = ['training', 'department', 'general', 'client', 'other'] as const;

export const MEETING_TYPE_LABELS: Record<string, string> = {
  training: 'Training',
  department: 'Department Meeting',
  general: 'General / Staff Meeting',
  client: 'Client / Partner Meeting',
  other: 'Other',
};

export function generateMeetingCode() {
  // Short, easy to read aloud in a meeting room - not a long UUID.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
