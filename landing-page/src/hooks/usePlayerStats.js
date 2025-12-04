// Lightweight, privacy-conscious player stats tracking using localStorage

import { useCallback, useEffect, useState } from "react";

// --- Helper functions for date handling ---
function getTodayISO() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// --- LocalStorage keys ---
const STORAGE_KEYS = {
  PLAY_DAYS: "nflgh_playDays",
  LAST_PLAYED: "nflgh_lastPlayed",
  GAMES_PLAYED: "nflgh_gamesPlayed",
  SOCIAL_SHARES: "nflgh_socialShares",
};

// --- 1. Track Total Days Played ---
export function getTotalPlayDays() {
  const days = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLAY_DAYS) || "[]");
  return days.length;
}

// --- 2. Track Daily Streak ---
export function getCurrentStreak() {
  const days = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLAY_DAYS) || "[]").sort();
  if (days.length === 0) return 0;

  let streak = 1;
  for (let i = days.length - 1; i > 0; i--) {
    const curr = new Date(days[i]);
    const prev = new Date(days[i - 1]);
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak++;
    } else if (diff > 1) {
      break;
    }
  }
  // If today is not included, streak is 0
  if (days[days.length - 1] !== getTodayISO()) return 0;
  return streak;
}

// --- 3. Track Social Shares ---
export function logSocialShare(platform) {
  const shares = JSON.parse(localStorage.getItem(STORAGE_KEYS.SOCIAL_SHARES) || "{}");
  shares[platform] = (shares[platform] || 0) + 1;
  localStorage.setItem(STORAGE_KEYS.SOCIAL_SHARES, JSON.stringify(shares));
}

export function getPlatformsSharedTo() {
  const shares = JSON.parse(localStorage.getItem(STORAGE_KEYS.SOCIAL_SHARES) || "{}");
  return shares;
}

// --- 4. Track Games Played ---
export function logGamePlayed(gameKey) {
  // Call this when a user completes a game
  const games = JSON.parse(localStorage.getItem(STORAGE_KEYS.GAMES_PLAYED) || "{}");
  games[gameKey] = (games[gameKey] || 0) + 1;
  localStorage.setItem(STORAGE_KEYS.GAMES_PLAYED, JSON.stringify(games));
}

export function getGamesPlayedByType() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.GAMES_PLAYED) || "{}");
}

// --- 1+2. Call this on app/game open to update play days and streak ---
export function logDayPlayed() {
  const today = getTodayISO();
  let days = JSON.parse(localStorage.getItem(STORAGE_KEYS.PLAY_DAYS) || "[]");
  if (!days.includes(today)) {
    days.push(today);
    days.sort();
    localStorage.setItem(STORAGE_KEYS.PLAY_DAYS, JSON.stringify(days));
  }
  localStorage.setItem(STORAGE_KEYS.LAST_PLAYED, today);
}

// --- 5. React Hook to expose all stats ---
export function usePlayerStats() {
  const [stats, setStats] = useState({
    totalDaysPlayed: 0,
    currentStreak: 0,
    gamesPlayedByType: {},
    platformsSharedTo: {},
  });

  const refresh = useCallback(() => {
    setStats({
      totalDaysPlayed: getTotalPlayDays(),
      currentStreak: getCurrentStreak(),
      gamesPlayedByType: getGamesPlayedByType(),
      platformsSharedTo: getPlatformsSharedTo(),
    });
  }, []);

  useEffect(() => {
    refresh();
    // Optionally, listen for storage events if you want cross-tab sync
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [refresh]);

  return stats;
}
