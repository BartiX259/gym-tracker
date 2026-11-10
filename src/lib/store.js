import { writable, get, derived } from 'svelte/store';

// ==========================================
// 1. STORAGE & DATE HELPERS
// ==========================================

function createPersistedStore(key, initialValue) {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  const data = saved ? JSON.parse(saved) : initialValue;
  const store = writable(data);

  store.subscribe(val => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(val));
    }
  });

  return store;
}

// Returns local date string formatted as "YYYY-MM-DD"
function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generates the last 7 calendar days in chronological order ending with today
function getLast7Days() {
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;

    days.push({
      key,
      day: dayLabels[d.getDay()], // e.g. Wed, Thu, Fri, Sat, Sun, Mon, Tue
      isToday: i === 0
    });
  }
  return days;
}

// ==========================================
// 2. CORE DATA STORES
// ==========================================

// Current Cycle
export const cycleStore = createPersistedStore('gym_cycle', { current: 1 });

// Historical log of daily pull-ups: { "YYYY-MM-DD": count }
export const dailyPullupsMap = createPersistedStore('gym_daily_pullups_map', {});

// Main Pull-Up Config & Counters
const defaultPullupState = {
  today: 0,
  cycle: 0,
  dailyTarget: 12,
  cycleTarget: 60,
  increment: 3
};

const savedPullupsRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('gym_pullups') : null;
const initialPullups = savedPullupsRaw ? JSON.parse(savedPullupsRaw) : defaultPullupState;

// Check date on boot: if it's a new day, reset today's counter to 0 (or today's existing log)
const todayKey = getTodayKey();
const lastActiveDate = typeof localStorage !== 'undefined' ? localStorage.getItem('gym_last_active_date') : null;

if (lastActiveDate !== todayKey) {
  const mapData = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('gym_daily_pullups_map') || '{}') : {};
  initialPullups.today = mapData[todayKey] || 0;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('gym_last_active_date', todayKey);
  }
}

export const pullupStore = createPersistedStore('gym_pullups', initialPullups);

// Derived store providing the 7-day window ending with today
export const dailyPullupsStore = derived(dailyPullupsMap, ($map) => {
  const days = getLast7Days();
  return days.map(d => ({
    day: d.day,
    count: $map[d.key] || 0,
    isToday: d.isToday
  }));
});

// Cycles History
export const cycleHistoryStore = createPersistedStore('gym_cycle_history', []);

// Exercises Library
export const exercisesStore = createPersistedStore('gym_exercises', [
  'Bench Press',
  'Incline DB Press',
  'Lat Pulldown',
  'Barbell Row',
  'Bicep Curls',
  'Tricep Pushdown',
  'Bulgarian Split Squat',
  'Romanian Deadlift (RDL)'
]);

// Workouts History
export const workoutsStore = createPersistedStore('gym_workouts', []);

// Exercise PR & Progression Logs
export const exerciseLogsStore = createPersistedStore('gym_exercise_logs', {});

// Active Workout State
export const activeWorkoutStore = createPersistedStore('gym_active_workout', null);
export const viewingWorkoutStore = writable(null);

// ==========================================
// 3. NAVIGATION ROUTER
// ==========================================

function createRouterStore() {
  const initial = typeof window !== 'undefined' ? window.location.hash.replace('#', '') || 'dashboard' : 'dashboard';
  const { subscribe, set } = writable(initial);

  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', (e) => {
      const screen = e.state?.screen || window.location.hash.replace('#', '') || 'dashboard';
      set(screen);
    });
  }

  return {
    subscribe,
    navigate: (screen) => {
      if (typeof window !== 'undefined') {
        window.history.pushState({ screen }, '', `#${screen}`);
      }
      set(screen);
    },
    back: () => {
      if (typeof window !== 'undefined') {
        window.history.back();
      }
    }
  };
}

export const router = createRouterStore();

// ==========================================
// 4. AUTOMATIC DAILY RESET CHECK
// ==========================================

function checkDailyReset() {
  const currentKey = getTodayKey();
  const lastDate = localStorage.getItem('gym_last_active_date');

  if (lastDate !== currentKey) {
    localStorage.setItem('gym_last_active_date', currentKey);
    const mapData = get(dailyPullupsMap) || {};
    pullupStore.update(p => ({
      ...p,
      today: mapData[currentKey] || 0
    }));
  }
}

// Check rollover whenever switching back into the app
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkDailyReset();
    }
  });
}

// ==========================================
// 5. CONNECTED ACTIONS
// ==========================================

export function getGhostStats(exerciseName) {
  const logs = get(exerciseLogsStore)[exerciseName];
  if (logs && logs.length > 0) {
    const last = logs[logs.length - 1];
    return { weight: last.weight, reps: last.reps };
  }
  return { weight: 60, reps: 8 };
}

export function adjustPullups(delta) {
  checkDailyReset();
  const currentKey = getTodayKey();

  // 1. Update persistent date map
  dailyPullupsMap.update(map => {
    const currentToday = map[currentKey] || 0;
    const newCount = Math.max(0, currentToday + delta);
    return { ...map, [currentKey]: newCount };
  });

  // 2. Update today & cycle counters
  pullupStore.update(p => {
    const newToday = Math.max(0, (p.today || 0) + delta);
    const newCycle = Math.max(0, (p.cycle || 0) + delta);
    return { ...p, today: newToday, cycle: newCycle };
  });
}

export function advanceCycleAction() {
  const currentCycle = get(cycleStore).current;
  const cycleReps = get(pullupStore).cycle;

  cycleHistoryStore.update(list => {
    const withoutCurrent = list.filter(item => item.cycle !== currentCycle);
    return [...withoutCurrent, { cycle: currentCycle, pullups: cycleReps }];
  });

  cycleStore.update(c => ({ current: c.current + 1 }));
  pullupStore.update(p => ({ ...p, today: 0, cycle: 0 }));
}

export function finishCurrentWorkout() {
  const active = get(activeWorkoutStore);
  if (!active) return;

  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const workoutId = Date.now();
  const startTime = active.startTime || workoutId;

  let completedExerciseCount = 0;

  exerciseLogsStore.update(logs => {
    active.exercises.forEach(ex => {
      const completedSets = ex.sets.filter(s => s.completed);
      if (completedSets.length > 0) {
        completedExerciseCount++;

        let topWeight = 0;
        let topReps = 0;
        let totalVolume = 0;

        completedSets.forEach(s => {
          const w = Number(s.weight) || 0;
          const r = Number(s.reps) || 0;
          totalVolume += (w * r);
          if (w > topWeight || (w === topWeight && r > topReps)) {
            topWeight = w;
            topReps = r;
          }
        });

        const est1RM = Math.round(topWeight * (1 + topReps / 30));

        if (!logs[ex.name]) logs[ex.name] = [];
        logs[ex.name].push({
          workoutId,
          date: dateLabel,
          weight: topWeight,
          reps: topReps,
          est1RM,
          volume: totalVolume
        });
      }
    });
    return logs;
  });

  workoutsStore.update(list => [
    ...list,
    {
      id: workoutId,
      startTime,
      cycle: active.cycle,
      date: dayName,
      dateLabel,
      exerciseCount: completedExerciseCount,
      exercises: active.exercises
    }
  ]);

  activeWorkoutStore.set(null);
}

export function deleteWorkoutSession(workoutId) {
  workoutsStore.update(list => list.filter(w => w.id !== workoutId));

  exerciseLogsStore.update(logs => {
    for (const ex in logs) {
      logs[ex] = logs[ex].filter(entry => entry.workoutId !== workoutId);
    }
    return logs;
  });
}

export function discardActiveWorkout() {
  activeWorkoutStore.set(null);
}
