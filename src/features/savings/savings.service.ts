/**
 * Savings Goal Service
 */

import SavingsGoal, { ISavingsGoal } from './savings.model';
import { NotFoundError, BadRequestError } from '../../shared/utils/error.util';
import mongoose from 'mongoose';
import { sendSavingsMilestone } from '../notification/notification.service';

/**
 * Create Savings Goal DTO
 */
export interface CreateSavingsGoalDTO {
  title: string;
  description?: string;
  targetAmount: number;
  targetDate?: Date;
  icon?: string;
  color?: string;
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Update Savings Goal DTO
 */
export interface UpdateSavingsGoalDTO extends Partial<CreateSavingsGoalDTO> {}

/**
 * Add Contribution DTO
 */
export interface AddContributionDTO {
  amount: number;
  note?: string;
}

/**
 * Create Savings Goal
 * 
 * @param userId - User ID
 * @param data - Goal data
 * @returns Created goal
 */
export const createSavingsGoal = async (
  userId: string,
  data: CreateSavingsGoalDTO
): Promise<ISavingsGoal> => {
  const goal = await SavingsGoal.create({
    ...data,
    userId: new mongoose.Types.ObjectId(userId),
    currentAmount: 0
  });
  
  return goal;
};

/**
 * Get All Savings Goals
 * 
 * @param userId - User ID
 * @param includeCompleted - Include completed goals (default: true)
 * @returns Array of goals
 */
export const getSavingsGoals = async (
  userId: string,
  includeCompleted: boolean = true
): Promise<ISavingsGoal[]> => {
  const query: any = {
    userId: new mongoose.Types.ObjectId(userId)
  };
  
  if (!includeCompleted) {
    query.isCompleted = false;
  }
  
  const goals = await SavingsGoal.find(query)
    .sort({ priority: 1, createdAt: -1 });  // High priority first
  
  return goals;
};

/**
 * Get Single Savings Goal
 * 
 * @param userId - User ID
 * @param goalId - Goal ID
 * @returns Goal with contributions
 */
export const getSavingsGoalById = async (
  userId: string,
  goalId: string
): Promise<ISavingsGoal> => {
  const goal = await SavingsGoal.findOne({
    _id: new mongoose.Types.ObjectId(goalId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!goal) {
    throw new NotFoundError('Savings goal not found');
  }
  
  return goal;
};

/**
 * Update Savings Goal
 * 
 * @param userId - User ID
 * @param goalId - Goal ID
 * @param data - Update data
 * @returns Updated goal
 */
export const updateSavingsGoal = async (
  userId: string,
  goalId: string,
  data: UpdateSavingsGoalDTO
): Promise<ISavingsGoal> => {
  const goal = await SavingsGoal.findOne({
    _id: new mongoose.Types.ObjectId(goalId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!goal) {
    throw new NotFoundError('Savings goal not found');
  }
  
  // Cannot modify completed goal
  if (goal.isCompleted) {
    throw new BadRequestError('Cannot modify completed goal');
  }
  
  Object.assign(goal, data);
  await goal.save();
  
  return goal;
};

/**
 * Delete Savings Goal
 * 
 * @param userId - User ID
 * @param goalId - Goal ID
 */
export const deleteSavingsGoal = async (
  userId: string,
  goalId: string
): Promise<void> => {
  const goal = await SavingsGoal.findOne({
    _id: new mongoose.Types.ObjectId(goalId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!goal) {
    throw new NotFoundError('Savings goal not found');
  }
  
  await goal.deleteOne();
};

/**
 * Add Contribution
 * 
 * Purpose: Add money to savings goal
 * Updates currentAmount and adds to contribution history
 * 
 * @param userId - User ID
 * @param goalId - Goal ID
 * @param data - Contribution data
 * @returns Updated goal
 */
export const addContribution = async (
  userId: string,
  goalId: string,
  data: AddContributionDTO
): Promise<ISavingsGoal> => {
  const goal = await SavingsGoal.findOne({
    _id: new mongoose.Types.ObjectId(goalId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!goal) {
    throw new NotFoundError('Savings goal not found');
  }
  
  // Add to contribution history
  goal.contributions.push({
    amount: data.amount,
    date: new Date(),
    note: data.note
  });
  
  // Update current amount
    const oldAmount = goal.currentAmount;
  goal.currentAmount += data.amount;
  
  // Save (pre-save hook will auto-complete if reached)
  await goal.save();
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
  
  // ✅ Send notification at milestones (25%, 50%, 75%, 100%)
  const milestones = [25, 50, 75, 100];
  const oldProgress = (oldAmount / goal.targetAmount) * 100;
  
  for (const milestone of milestones) {
    if (oldProgress < milestone && progress >= milestone) {
      sendSavingsMilestone(userId, goal.title, progress).catch(err => {
        console.error('Failed to send savings milestone:', err);
      });
      break;  // Send only one notification
    }
  }
  
  return goal;
};

/**
 * Get Contribution History
 * 
 * @param userId - User ID
 * @param goalId - Goal ID
 * @returns Array of contributions (sorted by date desc)
 */
export const getContributions = async (
  userId: string,
  goalId: string
) => {
  const goal = await getSavingsGoalById(userId, goalId);
  
  // Sort contributions by date (newest first)
  const contributions = goal.contributions.sort((a, b) => 
    b.date.getTime() - a.date.getTime()
  );
  
  return contributions;
};

/**
 * Get Savings Statistics
 * 
 * @param userId - User ID
 * @returns Overall savings statistics
 */
export const getSavingsStats = async (userId: string) => {
  const goals = await SavingsGoal.find({
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  const stats = {
    totalGoals: goals.length,
    completedGoals: goals.filter(g => g.isCompleted).length,
    activeGoals: goals.filter(g => !g.isCompleted).length,
    totalTargetAmount: goals.reduce((sum, g) => sum + g.targetAmount, 0),
    totalCurrentAmount: goals.reduce((sum, g) => sum + g.currentAmount, 0),
    totalRemainingAmount: goals.reduce((sum, g) => sum + (g.targetAmount - g.currentAmount), 0),
    overallProgress: 0
  };
  
  // Calculate overall progress
  if (stats.totalTargetAmount > 0) {
    stats.overallProgress = Math.round(
      (stats.totalCurrentAmount / stats.totalTargetAmount) * 100 * 100
    ) / 100;
  }
  
  return stats;
};