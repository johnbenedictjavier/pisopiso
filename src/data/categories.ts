import type { Category } from '../types'

export const categoryCatalog: Category[] = [
  { id: 'food', name: 'Food & dining', type: 'expense', color: '#df865c', icon: 'utensils' },
  { id: 'transport', name: 'Transport', type: 'expense', color: '#4789a7', icon: 'car' },
  { id: 'shopping', name: 'Shopping', type: 'expense', color: '#a56b9f', icon: 'shopping-bag' },
  { id: 'bills', name: 'Bills & utilities', type: 'expense', color: '#d6a04f', icon: 'receipt' },
  { id: 'health', name: 'Health', type: 'expense', color: '#cf6d78', icon: 'heart-pulse' },
  { id: 'home', name: 'Home', type: 'expense', color: '#6f8f77', icon: 'house' },
  { id: 'education', name: 'Education', type: 'expense', color: '#687cb0', icon: 'book-open' },
  { id: 'entertainment', name: 'Entertainment', type: 'expense', color: '#8b78ba', icon: 'sparkles' },
  { id: 'personal', name: 'Personal care', type: 'expense', color: '#bd7c9f', icon: 'heart' },
  { id: 'subscriptions', name: 'Subscriptions', type: 'expense', color: '#718698', icon: 'repeat' },
  { id: 'other-expense', name: 'Other expense', type: 'expense', color: '#7f8a83', icon: 'more-horizontal' },
  { id: 'salary', name: 'Salary', type: 'income', color: '#4f8a59', icon: 'briefcase-business' },
  { id: 'allowance', name: 'Allowance', type: 'income', color: '#6b7ca8', icon: 'gift' },
  { id: 'freelance', name: 'Freelance', type: 'income', color: '#3c8d8a', icon: 'laptop' },
  { id: 'business', name: 'Business', type: 'income', color: '#4b77a2', icon: 'store' },
  { id: 'investment-income', name: 'Investment income', type: 'income', color: '#b98b3f', icon: 'trending-up' },
  { id: 'gift', name: 'Gift', type: 'income', color: '#b46d97', icon: 'gift' },
  { id: 'other-income', name: 'Other income', type: 'income', color: '#6f9d79', icon: 'plus-circle' },
]
