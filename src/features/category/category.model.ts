import mongoose, { Document } from "mongoose";

export interface ICategory extends Document {
_id: mongoose.Types.ObjectId;
userId: mongoose.Types.ObjectId;
name: string;
icon: string;
color: string;
monthlyBudget?: number;
isDefault: boolean;
order: number;
createdAt: Date;
updatedAt: Date;
} 


const CategorySchema = new mongoose.Schema<ICategory>({
    userId:{
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true
    },
    name:{
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        minlength: [2, 'Category name must be at least 2 character'],
        maxlength: [30, 'Category name cannot exceed 30 characters']
    },
    icon:{
        type: String,
        required: [true, 'Category icon is required'],
        default: 'category'
    },
    color:{
        type: String,
        required: [true, 'Color is required'],
        match: [/^#[0-9A-F]{6}$/i, 'Please provide valid hex color'],
        default: '#6C5CE7'
    },
    monthlyBudget:{
        type: Number,
        default: null,
        min: [0, 'Monthly budget cannot be negative']
    },
    isDefault:{     
        type: Boolean,
        default: false
    },
    order:{
        type: Number,
        default: 0
    },


    
},
{
    timestamps: true,
    toJSON:{
        transform: function(_doc, ret){
            const result = ret as any;
            delete result.__v;
            return result;
        }
    }
}


);

CategorySchema.index({ userId: 1, name: 1 }, { unique: true });

CategorySchema.index({ userId: 1, order: 1 });

CategorySchema.virtual('totalExpenses', {
    ref: 'Expense',
    localField: '_id',
    foreignField: 'categoryId',
    count: true
})

 const Category = mongoose.model<ICategory>('Category', CategorySchema);
export default Category;

