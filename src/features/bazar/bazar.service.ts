/**
 * Bazar Service
 */

import Bazar, { IBazar } from './bazar.model';
import { NotFoundError } from '../../shared/utils/error.util';
import mongoose from 'mongoose';

/**
 * Create Shopping List DTO
 */
export interface CreateBazarDTO {
  title: string;
  description?: string;
  totalBudget?: number;
}

/**
 * Update Shopping List DTO
 */
export interface UpdateBazarDTO extends Partial<CreateBazarDTO> {
  isCompleted?: boolean;
}

/**
 * Add Item DTO
 */
export interface AddItemDTO {
  name: string;
  category?: string;
  quantity: number;
  unit: string;
  estimatedPrice?: number;
  notes?: string;
}

/**
 * Update Item DTO
 */
export interface UpdateItemDTO extends Partial<AddItemDTO> {
  actualPrice?: number;
  isPurchased?: boolean;
}

/**
 * Filter Options
 */
export interface BazarFilters {
  isCompleted?: boolean;
  search?: string;
}

/**
 * Create Shopping List
 */
export const createBazar = async (
  userId: string,
  data: CreateBazarDTO
): Promise<IBazar> => {
  const bazar = await Bazar.create({
    ...data,
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  return bazar;
};

/**
 * Get Shopping Lists
 */
export const getBazars = async (
  userId: string,
  filters: BazarFilters = {}
): Promise<IBazar[]> => {
  const query: any = {
    userId: new mongoose.Types.ObjectId(userId)
  };
  
  // Completed filter
  if (filters.isCompleted !== undefined) {
    query.isCompleted = filters.isCompleted;
  }
  
  // Search in title
  if (filters.search) {
    query.title = { $regex: filters.search, $options: 'i' };
  }
  
  const bazars = await Bazar.find(query)
    .sort({ isCompleted: 1, createdAt: -1 });  // Active first
  
  return bazars;
};

/**
 * Get Single Shopping List
 */
export const getBazarById = async (
  userId: string,
  bazarId: string
): Promise<IBazar> => {
  const bazar = await Bazar.findOne({
    _id: new mongoose.Types.ObjectId(bazarId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!bazar) {
    throw new NotFoundError('Shopping list not found');
  }
  
  return bazar;
};

/**
 * Update Shopping List
 */
export const updateBazar = async (
  userId: string,
  bazarId: string,
  data: UpdateBazarDTO
): Promise<IBazar> => {
  const bazar = await Bazar.findOne({
    _id: new mongoose.Types.ObjectId(bazarId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!bazar) {
    throw new NotFoundError('Shopping list not found');
  }
  
  Object.assign(bazar, data);
  await bazar.save();
  
  return bazar;
};

/**
 * Delete Shopping List
 */
export const deleteBazar = async (
  userId: string,
  bazarId: string
): Promise<void> => {
  const bazar = await Bazar.findOne({
    _id: new mongoose.Types.ObjectId(bazarId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!bazar) {
    throw new NotFoundError('Shopping list not found');
  }
  
  await bazar.deleteOne();
};

/**
 * Add Item to Shopping List
 */
export const addItem = async (
  userId: string,
  bazarId: string,
  data: AddItemDTO
): Promise<IBazar> => {
  const bazar = await Bazar.findOne({
    _id: new mongoose.Types.ObjectId(bazarId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!bazar) {
    throw new NotFoundError('Shopping list not found');
  }
  
  bazar.items.push({
    _id: new mongoose.Types.ObjectId(),
    ...data,
    isPurchased: false
  });
  
  await bazar.save();
  
  return bazar;
};

/**
 * Update Item
 */
export const updateItem = async (
  userId: string,
  bazarId: string,
  itemId: string,
  data: UpdateItemDTO
): Promise<IBazar> => {
  const bazar = await Bazar.findOne({
    _id: new mongoose.Types.ObjectId(bazarId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!bazar) {
    throw new NotFoundError('Shopping list not found');
  }
  
  const item = bazar.items.find(i => i._id.toString() === itemId);
  
  if (!item) {
    throw new NotFoundError('Item not found');
  }
  
  Object.assign(item, data);
  
  bazar.markModified('items');
  await bazar.save();
  
  return bazar;
};

/**
 * Delete Item
 */
export const deleteItem = async (
  userId: string,
  bazarId: string,
  itemId: string
): Promise<IBazar> => {
  const bazar = await Bazar.findOne({
    _id: new mongoose.Types.ObjectId(bazarId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!bazar) {
    throw new NotFoundError('Shopping list not found');
  }
  
  const itemIndex = bazar.items.findIndex(i => i._id.toString() === itemId);
  
  if (itemIndex === -1) {
    throw new NotFoundError('Item not found');
  }
  
  bazar.items.splice(itemIndex, 1);
  
  bazar.markModified('items');
  await bazar.save();
  
  return bazar;
};

/**
 * Toggle Item Purchase Status
 */
export const toggleItemPurchase = async (
  userId: string,
  bazarId: string,
  itemId: string
): Promise<IBazar> => {
  const bazar = await Bazar.findOne({
    _id: new mongoose.Types.ObjectId(bazarId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!bazar) {
    throw new NotFoundError('Shopping list not found');
  }
  
  const item = bazar.items.find(i => i._id.toString() === itemId);
  
  if (!item) {
    throw new NotFoundError('Item not found');
  }
  
  item.isPurchased = !item.isPurchased;
  
  bazar.markModified('items');
  await bazar.save();
  
  return bazar;
};

/**
 * Get Statistics
 */
export const getBazarStats = async (userId: string) => {
  const bazars = await Bazar.find({
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  const stats = {
    totalLists: bazars.length,
    activeLists: bazars.filter(b => !b.isCompleted).length,
    completedLists: bazars.filter(b => b.isCompleted).length,
    totalItems: bazars.reduce((sum, b) => sum + b.items.length, 0),
    purchasedItems: bazars.reduce((sum, b) => 
      sum + b.items.filter(i => i.isPurchased).length, 0
    ),
    totalBudget: bazars.reduce((sum, b) => sum + (b.totalBudget || 0), 0),
    totalSpent: bazars.reduce((sum, b) => sum + b.totalActualCost, 0)
  };
  
  return stats;
};