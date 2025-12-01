import mongoose from "mongoose";
import Category, { ICategory } from "./category.model";
import { BadRequestError, ConflictError, NotFoundError } from "../../shared/utils/error.util";





/**
 * Create Category DTO
 */
export  interface CreateCategoryDTO{
    name: string;
    icons: string;
    color: string;
    monthlyBudget: number;    
} 

/**
 * Update Category DTO
 */
export interface UpdateCategoryDTO {
  name?: string;
  icon?: string;
  color?: string;
  monthlyBudget?: number;
  order?: number;
}

/**
 * Default Categories
 */

export const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', icon: 'restaurant', color: '#FF6B6B', order: 1 },
  { name: 'Transport', icon: 'directions-car', color: '#4ECDC4', order: 2 },
  { name: 'Shopping', icon: 'shopping-bag', color: '#95E1D3', order: 3 },
  { name: 'Entertainment', icon: 'movie', color: '#F38181', order: 4 },
  { name: 'Healthcare', icon: 'local-hospital', color: '#AA96DA', order: 5 },
  { name: 'Education', icon: 'school', color: '#FCBAD3', order: 6 },
  { name: 'Utilities', icon: 'lightbulb', color: '#FDDB3A', order: 7 },
  { name: 'Others', icon: 'category', color: '#6C5CE7', order: 8 }
];

/**
 * Create Default Categories for New User
 * @param userId - New user's ID
 */
export const createDefaultCategories = async (userId: string) : Promise<void> => {
    const categories = DEFAULT_CATEGORIES.map(cat => ({
        ...cat,
        userId: new mongoose.Types.ObjectId(userId),
        default: true
    }))
    await Category.insertMany(categories);

}
/**
 * Create Custom Category
 * 
 * Flow:
 * 1. Check if category name already exists for this user
 * 2. Get max order number
 * 3. Create category
 * 
 * @param userId - User ID
 * @param data - Category data
 * @returns Created category
 */

export const createCategory = async (userId:string, data:CreateCategoryDTO): Promise<ICategory>  => {
    const existing = await Category.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        name:   { $regex: new RegExp(`^${data.name}$`, 'i') } 
    })
    if(existing){
        throw new ConflictError('Category name already exists');
    }
    const maxOrderCategory = await Category.findOne({ userId })
        .sort({ order: -1 })
        .select('order')
    const nextOrder = maxOrderCategory ? maxOrderCategory.order + 1 : 1;

    const category  = await Category.create({
        ...data,
        userId: new mongoose.Types.ObjectId(userId),
        order: nextOrder,
        isDefault: false
    });
    return category;
    
}

/**
 * Get All Categories for User
 * 
 * Returns categories sorted by order
 * 
 * @param userId - User ID
 * @returns Array of categories
 */

export const getUserCategories = async (userId:string): Promise<ICategory[]> => {

    const categories = await Category.find({ 
        userId: new mongoose.Types.ObjectId(userId)

     }).sort({ order: 1 });
    return categories;
}
/**
 * Get Single Category
 * 
 * @param userId - User ID
 * @param categoryId - Category ID
 * @returns Category
 */
export const getCategoryById = async (
  userId: string,
  categoryId: string
): Promise<ICategory> => {
  const category = await Category.findOne({
    _id: new mongoose.Types.ObjectId(categoryId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  
  return category;
};

/**
 * Update Category
 * 
 * @param userId - User ID
 * @param categoryId - Category ID
 * @param data - Update data
 * @returns Updated category
 */

export const updateCategory = async (userId:string, categoryId:string, data:UpdateCategoryDTO): Promise<ICategory> => {

    const category = await Category.findOne({
        _id: new mongoose.Types.ObjectId(categoryId),
        userId: new mongoose.Types.ObjectId(userId)
    })
    if(!category){
        throw new NotFoundError('Category not found');
    }
    if(data.name && data.name !== category.name){
        const existing = await Category.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            name: { $regex: new RegExp(`^${data.name}$`, 'i') },
            _id: { $ne: category._id }  // Exclude current category
        })
        if(existing){
            throw new ConflictError('Category name already exists');
        }
    }
    if (data.name) category.name = data.name;
    if (data.icon) category.icon = data.icon;
    if (data.color) category.color = data.color;
    if (data.monthlyBudget !== undefined) category.monthlyBudget = data.monthlyBudget;
    if (data.order !== undefined) category.order = data.order;

    await category.save();
    return category;
}
/**
 * Delete Category Result Interface
 */
export interface DeleteCategoryResult {
  canDelete: boolean;
  expenseCount: number;
  message: string;
  requiresConfirmation: boolean;
}

/**
 * Check if Category Can Be Deleted
 * 
 * @param userId - User ID
 * @param categoryId - Category ID
 * @returns Delete status info
 */
export const checkCategoryDeletion = async (
  userId: string,
  categoryId: string
): Promise<DeleteCategoryResult> => {
  const category = await Category.findOne({
    _id: new mongoose.Types.ObjectId(categoryId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  
  // Check expense count
  const Expense = mongoose.model('Expense');
  const expenseCount = await Expense.countDocuments({
    categoryId: new mongoose.Types.ObjectId(categoryId)
  });
  
  if (expenseCount > 0) {
    return {
      canDelete: false,
      expenseCount,
      message: `This category has ${expenseCount} expense(s). Deleting it will also delete all these expenses.`,
      requiresConfirmation: true
    };
  }
  
  return {
    canDelete: true,
    expenseCount: 0,
    message: 'Category can be deleted safely.',
    requiresConfirmation: false
  };
};

/**
 * Delete Category
 * 
 * @param userId - User ID
 * @param categoryId - Category ID
 * @param confirmed - User confirmed deletion
 * @returns Deletion result
 */
export const deleteCategory = async (
  userId: string,
  categoryId: string,
  confirmed: boolean = false
): Promise<{ deletedExpenses: number }> => {
  const category = await Category.findOne({
    _id: new mongoose.Types.ObjectId(categoryId),
    userId: new mongoose.Types.ObjectId(userId)
  });
  
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  
  // Check expenses
  const Expense = mongoose.model('Expense');
  const expenseCount = await Expense.countDocuments({
    categoryId: new mongoose.Types.ObjectId(categoryId)
  });
  
  // If has expenses but not confirmed, throw error with info
  if (expenseCount > 0 && !confirmed) {
    throw new BadRequestError(
      `Category has ${expenseCount} expense(s). Please confirm deletion to proceed.`
    );
  }
  
  // Delete expenses if exists
  let deletedExpenses = 0;
  if (expenseCount > 0) {
    const result = await Expense.deleteMany({
      categoryId: new mongoose.Types.ObjectId(categoryId)
    });
    deletedExpenses = result.deletedCount;
  }
  
  // Delete category
  await category.deleteOne();
  
  return { deletedExpenses };
};
/**
 * Reorder Categories
 * 
 * Purpose: User can drag-drop to reorder categories in UI
 * 
 * @param userId - User ID
 * @param categoryOrders - Array of { id, order }
 */
export const reorderCategories = async (
  userId: string,
  categoryOrders: Array<{ id: string; order: number }>
): Promise<void> => {
  // Update orders in bulk
  const bulkOps = categoryOrders.map(item => ({
    updateOne: {
      filter: {
        _id: new mongoose.Types.ObjectId(item.id),
        userId: new mongoose.Types.ObjectId(userId)
      },
      update: { order: item.order }
    }
  }));
  
  await Category.bulkWrite(bulkOps);
};
