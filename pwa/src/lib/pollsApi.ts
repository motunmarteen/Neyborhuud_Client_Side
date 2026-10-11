import apiClient from '@/lib/api-client';

/** Feed polls — server: /api/v1/polls (NeyborHuud_Server_Side modules/polls). */

export type PollView = {
  options: { text: string; votes: number }[];
  voterCount: number;
  endsAt: string;
  closed: boolean;
  myVote: number | null;
  area: string | null;
};

const data = <T>(res: unknown) => ((res as { data?: T })?.data ?? res) as T;

export const POLL_DURATIONS = [
  { hours: 1, label: '1 hour' },
  { hours: 6, label: '6 hours' },
  { hours: 24, label: '1 day' },
  { hours: 72, label: '3 days' },
  { hours: 168, label: '7 days' },
];

export async function createPoll(input: { question: string; options: string[]; durationHours: number }) {
  return data<{ postId: string; poll: PollView }>(await apiClient.post('/polls', input));
}

export async function votePoll(postId: string, optionIndex: number) {
  return data<{ poll: PollView }>(await apiClient.post(`/polls/${postId}/vote`, { optionIndex })).poll;
}

/** Plain-words error from the server (e.g. "Only neighbours in this area can vote on this poll."). */
export function apiMessage(e: unknown, fallback: string): string {
  const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return typeof msg === 'string' && msg.trim() ? msg : fallback;
}
