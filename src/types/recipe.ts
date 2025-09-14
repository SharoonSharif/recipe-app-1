import { Id } from "../../convex/_generated/dataModel"

// NEW: Structured ingredient interface
export interface StructuredIngredient {
  quantity: number
  unit: string
  ingredient: string
  notes?: string // Optional notes like "finely chopped"
}

export interface Recipe {
  _id: Id<"recipes">
  name: string
  ingredients: StructuredIngredient[] // 👈 CHANGED: Now structured
  instructions: string
  prepTime: number
  category: string
  createdAt: number
  userId: string
  isFavorite?: boolean
}

export interface RecipeFormData {
  name: string
  ingredients: StructuredIngredient[] // 👈 CHANGED: Now structured
  instructions: string
  prepTime: number
  category: string
}

export interface ShoppingList {
  _id: Id<"shoppingLists">
  name: string
  recipeIds: Id<"recipes">[]
  ingredients: StructuredIngredient[] // 👈 CHANGED: Now structured with smart combining
  userId: string
  createdAt: number
  updatedAt: number
}
