import { describe, expect, it } from 'vitest';
import {
  classifySwipeBackPointerUp,
  isSwipeBackEdgeStart,
  isSwipeBackInteractiveTarget,
  isSwipeBackRootRoute,
  shouldCommitSwipeBack,
  swipeBackDragProgress,
  SWIPE_BACK_COMMIT_DISTANCE_PX,
  SWIPE_BACK_EDGE_ZONE_PX,
} from './swipeBackGesture';

describe('isSwipeBackRootRoute', () => {
  it('blocks root hub routes', () => {
    expect(isSwipeBackRootRoute('/feed')).toBe(true);
    expect(isSwipeBackRootRoute('/')).toBe(true);
    expect(isSwipeBackRootRoute('/welcome')).toBe(true);
  });

  it('allows detail routes', () => {
    expect(isSwipeBackRootRoute('/settings')).toBe(false);
    expect(isSwipeBackRootRoute('/profile/motun')).toBe(false);
  });
});

describe('isSwipeBackEdgeStart', () => {
  it('accepts touches within the left edge zone', () => {
    expect(isSwipeBackEdgeStart(0)).toBe(true);
    expect(isSwipeBackEdgeStart(SWIPE_BACK_EDGE_ZONE_PX)).toBe(true);
  });

  it('rejects touches outside the edge zone', () => {
    expect(isSwipeBackEdgeStart(SWIPE_BACK_EDGE_ZONE_PX + 1)).toBe(false);
    expect(isSwipeBackEdgeStart(120)).toBe(false);
  });

  it('respects safe-area inset', () => {
    expect(isSwipeBackEdgeStart(30, 8)).toBe(true);
    expect(isSwipeBackEdgeStart(37, 8)).toBe(false);
  });
});

describe('swipeBackDragProgress', () => {
  it('ramps progress for valid horizontal swipes', () => {
    expect(swipeBackDragProgress(36, 0)).toBeCloseTo(0.5);
    expect(swipeBackDragProgress(SWIPE_BACK_COMMIT_DISTANCE_PX, 0)).toBe(1);
    expect(swipeBackDragProgress(200, 0)).toBe(1);
  });

  it('rejects leftward or mostly-vertical movement', () => {
    expect(swipeBackDragProgress(-10, 0)).toBe(0);
    expect(swipeBackDragProgress(40, 80)).toBe(0);
    expect(swipeBackDragProgress(50, 50)).toBe(0);
  });
});

describe('shouldCommitSwipeBack', () => {
  it('commits when distance and axis ratio pass thresholds', () => {
    expect(shouldCommitSwipeBack(SWIPE_BACK_COMMIT_DISTANCE_PX, 0)).toBe(true);
    expect(shouldCommitSwipeBack(90, 20)).toBe(true);
  });

  it('does not commit on short or vertical swipes', () => {
    expect(shouldCommitSwipeBack(SWIPE_BACK_COMMIT_DISTANCE_PX - 1, 0)).toBe(false);
    expect(shouldCommitSwipeBack(100, 100)).toBe(false);
  });

  it('classifies pointer-up phases consistently', () => {
    expect(classifySwipeBackPointerUp(80, 5)).toBe('commit');
    expect(classifySwipeBackPointerUp(40, 0)).toBe('ignore');
  });
});

describe('isSwipeBackInteractiveTarget', () => {
  it('blocks gestures starting on interactive elements', () => {
    document.body.innerHTML = `
      <main>
        <button id="btn">Back</button>
        <a id="link" href="/">Home</a>
        <input id="input" />
        <div id="plain">Content</div>
      </main>
    `;

    expect(isSwipeBackInteractiveTarget(document.getElementById('btn'))).toBe(true);
    expect(isSwipeBackInteractiveTarget(document.getElementById('link'))).toBe(true);
    expect(isSwipeBackInteractiveTarget(document.getElementById('input'))).toBe(true);
    expect(isSwipeBackInteractiveTarget(document.getElementById('plain'))).toBe(false);
    expect(isSwipeBackInteractiveTarget(null)).toBe(false);
  });

  it('respects data-no-swipe-back containers', () => {
    document.body.innerHTML = `<div data-no-swipe-back><span id="child">x</span></div>`;
    expect(isSwipeBackInteractiveTarget(document.getElementById('child'))).toBe(true);
  });
});
