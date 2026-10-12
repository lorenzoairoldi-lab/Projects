import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { habitModel } from './models/habitModel.js';
import { requireUser } from './middleware/auth.js';
import { publish } from '../../../shared/events.js';

const input = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FF2D20'),
  frequency: z.enum(['DAILY', 'WEEKLY']).default('DAILY'),
  targetPerWeek: z.number().int().min(1).max(7).default(7)
});

const dateInTimezone = (timezone = 'UTC') => {
  try {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${value.year}-${value.month}-${value.day}`;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

const logMap = (log) => ({
  id: log.id,
  habitId: log.habit_id,
  completedOn: log.completed_on.toISOString().slice(0, 10),
  note: log.note
});

const currentStreak = (dates, today) => {
  const set = new Set(dates.map(({ completed_on }) => completed_on.toISOString().slice(0, 10)));
  let count = 0;
  const day = new Date(`${today}T12:00:00Z`);
  while (set.has(day.toISOString().slice(0, 10))) {
    count += 1;
    day.setUTCDate(day.getUTCDate() - 1);
  }
  return count;
};

const map = async (habit, timezone) => {
  const dates = await habitModel.stats(habit.id);
  const today = dateInTimezone(timezone);
  let best = 0;
  let run = 0;
  let previous;
  for (const item of [...dates].reverse()) {
    const day = new Date(item.completed_on);
    run = previous && day - previous === 86400000 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  const elapsedDays = Math.max(1, (Date.now() - habit.created_at) / 86400000);
  const expected = habit.frequency === 'WEEKLY'
    ? Math.max(1, elapsedDays * (habit.target_per_week / 7))
    : elapsedDays;
  return {
    id: habit.id,
    userId: habit.user_id,
    name: habit.name,
    description: habit.description,
    color: habit.color,
    frequency: habit.frequency,
    targetPerWeek: habit.target_per_week,
    active: habit.active,
    completedToday: dates.some(({ completed_on }) => completed_on.toISOString().slice(0, 10) === today),
    currentStreak: currentStreak(dates, today),
    bestStreak: best,
    completionRate: Math.min(100, Math.round((dates.length / expected) * 100)),
    createdAt: habit.created_at.toISOString()
  };
};

export default {
  Query: {
    habits: async (_parent, args, context) => {
      const result = await habitModel.list(requireUser(context).sub, args);
      return { ...result, items: await Promise.all(result.items.map((habit) => map(habit, context.timezone))) };
    },
    habit: async (_parent, { id }, context) => {
      const habit = await habitModel.get(id, requireUser(context).sub);
      return habit && map(habit, context.timezone);
    },
    habitLogs: async (_parent, { habitId, ...args }, context) => (
      await habitModel.logs(habitId, requireUser(context).sub, args)
    ).map(logMap)
  },
  Mutation: {
    createHabit: async (_parent, { input: value }, context) => map(
      await habitModel.create(randomUUID(), requireUser(context).sub, input.parse(value)),
      context.timezone
    ),
    updateHabit: async (_parent, { id, input: value }, context) => map(
      await habitModel.update(id, requireUser(context).sub, input.parse(value)),
      context.timezone
    ),
    archiveHabit: (_parent, { id }, context) => habitModel.archive(id, requireUser(context).sub),
    completeHabit: async (_parent, { id, date, note }, context) => {
      const user = requireUser(context);
      const day = date || dateInTimezone(context.timezone);
      const result = await habitModel.complete(randomUUID(), id, user.sub, day, note);
      if (!result.log) throw new Error('Habit not found');
      if (result.created) await publish('habit.completed', { userId: user.sub, habitId: id, date: day });
      return logMap(result.log);
    },
    uncompleteHabit: (_parent, { id, date }, context) => habitModel.uncomplete(
      id, requireUser(context).sub, date || dateInTimezone(context.timezone)
    )
  }
};
