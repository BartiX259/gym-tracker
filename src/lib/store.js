import { writable, get } from 'svelte/store';

// Helper: syncs any Svelte store directly to localStorage
function createPersistedStore(key, initialValue) {
  const saved = localStorage.getItem(key);
  const data = saved ? JSON.parse(saved) : initialValue;
  const store = writable(data);

  store.subscribe(val => {
    localStorage.setItem(key, JSON.stringify(val));
  });

  return store;
}

// 1. Current Cycle & Pull-ups (Fresh Start: Cycle 1, 0 reps)
export const cycleStore = createPersistedStore('gym_cycle', { current: 1 });

export const pullupStore = createPersistedStore('gym_pullups', {
  today: 0,
  cycle: 0,
  dailyTarget: 12,
  cycleTarget: 60,
  increment: 3
});

// 2. Exercises Library (Clean starter staples)
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

// 3. Workouts History (Empty)
export const workoutsStore = createPersistedStore('gym_workouts', []);

// 4. Exercise Logs (Empty)
export const exerciseLogsStore = createPersistedStore('gym_exercise_logs', {});

// 5. Pull-Up History Stores (Empty past cycles, 0 for current days)
export const cycleHistoryStore = createPersistedStore('gym_cycle_history', []);

export const dailyPullupsStore = createPersistedStore('gym_daily_pullups', [
  { day: 'Mon', count: 0 },
  { day: 'Tue', count: 0 },
  { day: 'Wed', count: 0 },
  { day: 'Thu', count: 0 },
  { day: 'Fri', count: 0 },
  { day: 'Sat', count: 0 },
  { day: 'Sun', count: 0 }
]);

// 6. Active Workout State
export const activeWorkoutStore = createPersistedStore('gym_active_workout', null);
export const viewingWorkoutStore = writable(null);

// 7. Navigation Router
function createRouterStore() {
  const initial = window.location.hash.replace('#', '') || 'dashboard';
  const { subscribe, set } = writable(initial);

  window.addEventListener('popstate', (e) => {
    const screen = e.state?.screen || window.location.hash.replace('#', '') || 'dashboard';
    set(screen);
  });

  return {
    subscribe,
    navigate: (screen) => {
      window.history.pushState({ screen }, '', `#${screen}`);
      set(screen);
    },
    back: () => {
      window.history.back();
    }
  };
}

export const router = createRouterStore();

// ==========================================
// CONNECTED ACTION HELPERS
// ==========================================

export function getGhostStats(exerciseName) {
  const logs = get(exerciseLogsStore)[exerciseName];
  if (logs && logs.length > 0) {
    const last = logs[logs.length - 1];
    return { weight: last.weight, reps: last.reps };
  }
  return { weight: 60, reps: 8 }; // Fallback defaults
}

export function adjustPullups(delta) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayDay = days[new Date().getDay()];

  pullupStore.update(p => {
    const newToday = Math.max(0, p.today + delta);
    const newCycle = Math.max(0, p.cycle + delta);
    return { ...p, today: newToday, cycle: newCycle };
  });

  dailyPullupsStore.update(list => {
    return list.map(item => {
      if (item.day === todayDay) {
        return { ...item, count: Math.max(0, item.count + delta) };
      }
      return item;
    });
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
  dailyPullupsStore.update(list => list.map(d => ({ ...d, count: 0 })));
}

export function finishCurrentWorkout() {
  const active = get(activeWorkoutStore);
  if (!active) return;

  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateLabel = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const workoutId = Date.now();

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
