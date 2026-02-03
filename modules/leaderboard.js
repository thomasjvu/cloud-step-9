// ═══════════════════════════════════════════════════════════════════
// Leaderboard Module - Score persistence via server + localStorage fallback
// ═══════════════════════════════════════════════════════════════════

import { leaderboard, setLeaderboard } from './state.js';

export async function loadLeaderboard() {
  try {
    const res = await fetch('/api/leaderboard');
    if (res.ok) {
      setLeaderboard(await res.json());
      return;
    }
  } catch (e) {
    // Server unavailable — fall back to localStorage
  }
  try {
    const data = localStorage.getItem("cloud_step_9_lb");
    if (data) setLeaderboard(JSON.parse(data));
  } catch (e) {
    setLeaderboard([]);
  }
}

export function saveLeaderboard() {
  try {
    localStorage.setItem("cloud_step_9_lb", JSON.stringify(leaderboard));
  } catch (e) {}
}

export async function addToLeaderboard(name, sc, co, ph) {
  const entry = {
    name,
    score: sc,
    combo: co,
    phase: ph,
    timestamp: Date.now(),
  };

  // Optimistic local update
  leaderboard.push(entry);
  leaderboard.sort((a, b) => b.score - a.score);
  if (leaderboard.length > 10) leaderboard.length = 10;
  saveLeaderboard();

  // POST to server
  try {
    const res = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (res.ok) {
      const data = await res.json();
      setLeaderboard(data.leaderboard);
      saveLeaderboard();
    }
  } catch (e) {
    // Server unavailable — local update already applied
  }
}

export function isHighScore(sc) {
  if (leaderboard.length < 10) return true;
  return sc > leaderboard[leaderboard.length - 1].score;
}
