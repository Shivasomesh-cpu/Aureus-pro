
import { Category } from './types';

export const CATEGORIES: Category[] = [
  'Food',
  'Travel',
  'Shopping',
  'Utilities',
  'Entertainment',
  'Health',
  'Education',
  'Salary',
  'Investment',
  'Other',
  'Transportation',
  'Housing',
  'Healthcare',
];

export const CATEGORY_COLORS: Record<Category, string> = {
  Food: 'bg-red-500',
  Travel: 'bg-blue-500',
  Shopping: 'bg-purple-500',
  Utilities: 'bg-yellow-500',
  Entertainment: 'bg-pink-500',
  Health: 'bg-green-500',
  Education: 'bg-indigo-500',
  Salary: 'bg-emerald-500',
  Investment: 'bg-cyan-500',
  Other: 'bg-gray-500',
  Transportation: 'bg-blue-600',
  Housing: 'bg-amber-600',
  Healthcare: 'bg-rose-500',
};
