// Each meeting type gets its own minutes shape. The frontend reads this to
// decide which fields to show - no hardcoded forms scattered across pages.
export const MEETING_TYPES = ['training', 'department', 'general', 'client', 'other'] as const;

export type MeetingType = (typeof MEETING_TYPES)[number];

export const MINUTES_TEMPLATES: Record<MeetingType, { label: string; sections: string[] }> = {
  training: {
    label: 'Training',
    sections: ['trainingTopics', 'materialsShared', 'discussion', 'actionItems'],
  },
  department: {
    label: 'Department Meeting',
    sections: ['agenda', 'discussion', 'decisions', 'actionItems', 'nextMeetingDate'],
  },
  general: {
    label: 'General / Staff Meeting',
    sections: ['agenda', 'discussion', 'decisions', 'nextMeetingDate'],
  },
  client: {
    label: 'Client / Partner Meeting',
    sections: ['agenda', 'discussion', 'decisions', 'actionItems'],
  },
  other: {
    label: 'Other',
    sections: ['agenda', 'discussion', 'decisions', 'actionItems', 'nextMeetingDate'],
  },
};

export function generateMeetingCode() {
  // Short, easy to read aloud in a meeting room - not a long UUID.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
