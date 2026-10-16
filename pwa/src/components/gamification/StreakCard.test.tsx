import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import StreakCard from './StreakCard';

afterEach(cleanup);

describe('StreakCard', () => {
  it("shows the server's next bonus day and amount", () => {
    render(<StreakCard streak={5} nextMilestone={7} nextReward={50} onCheckIn={vi.fn()} />);
    expect(screen.getByText('Day 7 bonus')).toBeTruthy();
    expect(screen.getByText('+50 🪙')).toBeTruthy();
    expect(screen.getByText('2 days away')).toBeTruthy();
    expect(screen.getByText('Check in today for day 6')).toBeTruthy();
  });

  it('never promises a +0 bonus', () => {
    render(<StreakCard streak={98} nextMilestone={100} nextReward={0} onCheckIn={vi.fn()} />);
    expect(screen.queryByText(/\+0/)).toBeNull();
  });

  it('after checking in, points to tomorrow', () => {
    render(<StreakCard streak={3} checkedInToday nextMilestone={7} nextReward={50} onCheckIn={vi.fn()} />);
    expect(screen.getByText('Come back tomorrow for day 4')).toBeTruthy();
    expect(screen.getByRole('button').hasAttribute('disabled')).toBe(true);
  });

  it('a broken streak says so plainly', () => {
    render(<StreakCard streak={0} streakBroken nextMilestone={7} nextReward={50} onCheckIn={vi.fn()} />);
    expect(screen.getByText('You missed a day. Check in to start again')).toBeTruthy();
    expect(screen.getByRole('button').textContent).toContain('Start a new streak');
  });
});
