// src/types/recipe.ts - Fixed with comprehensive type definitions
import { Id } from '../../convex/_generated/dataModel'

// Core ingredient interface with validation
export interface StructuredIngredient {
  quantity: number
  unit: string
  ingredient: string
  notes?: string
}

// Recipe categories as const for type safety
export const RECIPE_CATEGORIES = [
  'Breakfast',
  'Lunch', 
  'Dinner',
  'Appetizer',
  'Snack',
  'Dessert',
  'Drink',
  'Side Dish',
  'Soup',
  'Salad',
  'Other',
] as const

export type RecipeCategory = typeof RECIPE_CATEGORIES[number]

// Main recipe interface matching Convex schema
export interface Recipe {
  _id: Id<'recipes'>
  name: string
  ingredients: StructuredIngredient[]
  instructions: string
  prepTime: number
  category: RecipeCategory
  createdAt: number
  updatedAt: number
  userId: string
  isFavorite?: boolean
  // Extended fields from schema
  rating?: number
  reviewCount?: number
  lastMade?: number
  timesCooked?: number
  personalNotes?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  tags?: string[]
}

// Form data interface for creating/updating recipes
export interface RecipeFormData {
  name: string
  ingredients: StructuredIngredient[]
  instructions: string
  prepTime: number
  category: RecipeCategory
}

// Shopping list interface
export interface ShoppingList {
  _id: Id<'shoppingLists'>
  name: string
  recipeIds: Id<'recipes'>[]
  ingredients: StructuredIngredient[]
  userId: string
  createdAt: number
  updatedAt: number
}

// Meal plan interfaces (for future use)
export interface MealPlanMeal {
  date: string
  breakfast?: Id<'recipes'>[]
  lunch?: Id<'recipes'>[]
  dinner?: Id<'recipes'>[]
  snacks?: Id<'recipes'>[]
}

export interface MealPlan {
  _id: Id<'mealPlans'>
  name: string
  startDate: string
  endDate: string
  meals: MealPlanMeal[]
  userId: string
  createdAt: number
  updatedAt: number
}

// Recipe collection interface (for future use)
export interface RecipeCollection {
  _id: Id<'recipeCollections'>
  name: string
  description?: string
  recipeIds: Id<'recipes'>[]
  isPublic: boolean
  tags: string[]
  userId: string
  createdAt: number
  updatedAt: number
}

// Utility types for form handling
export type RecipeFormErrors = Partial<Record<keyof RecipeFormData, string>> & {
  submit?: string
  ingredients?: string
  [key: string]: string | undefined // For dynamic ingredient errors
}

// Filter and search types
export interface RecipeFilters {
  search: string
  category: RecipeCategory | 'all'
  favoriteOnly: boolean
  tags?: string[]
  difficulty?: Recipe['difficulty'] | 'all'
  prepTimeMax?: number
}

// API response types
export interface CreateRecipeResponse {
  success: boolean
  recipeId?: Id<'recipes'>
  error?: string
}

export interface UpdateRecipeResponse {
  success: boolean
  error?: string
}

// Component prop types
export interface RecipeCardProps {
  recipe: Recipe
  onEdit: (recipe: Recipe) => void
  onDelete: (id: Id<'recipes'>) => void
  onToggleFavorite: (id: Id<'recipes'>) => void
  onScale: (recipe: Recipe) => void
}

export interface RecipeFormProps {
  recipe?: Recipe | null
  onSave: (recipe: RecipeFormData) => Promise<void>
  onCancel: () => void
}

// Validation helpers
export const validateIngredient = (ingredient: Partial<StructuredIngredient>): ingredient is StructuredIngredient => {
  return (
    typeof ingredient.quantity === 'number' &&
    ingredient.quantity > 0 &&
    typeof ingredient.unit === 'string' &&
    ingredient.unit.trim() !== '' &&
    typeof ingredient.ingredient === 'string' &&
    ingredient.ingredient.trim() !== ''
  )
}

export const validateRecipeFormData = (data: Partial<RecipeFormData>): data is RecipeFormData => {
  return (
    typeof data.name === 'string' &&
    data.name.trim() !== '' &&
    typeof data.instructions === 'string' &&
    data.instructions.trim() !== '' &&
    typeof data.prepTime === 'number' &&
    data.prepTime > 0 &&
    typeof data.category === 'string' &&
    RECIPE_CATEGORIES.includes(data.category as RecipeCategory) &&
    Array.isArray(data.ingredients) &&
    data.ingredients.length > 0 &&
    data.ingredients.every(validateIngredient)
  )
}

// Utility functions
export const formatIngredient = (ingredient: StructuredIngredient): string => {
  const quantity = ingredient.quantity % 1 === 0 
    ? ingredient.quantity.toString() 
    : ingredient.quantity.toFixed(2).replace(/\.?0+$/, '')
  const notesStr = ingredient.notes ? ` (${ingredient.notes})` : ''
  return `${quantity} ${ingredient.unit} ${ingredient.ingredient}${notesStr}`
}

export const scaleIngredient = (ingredient: StructuredIngredient, factor: number): StructuredIngredient => {
  return {
    ...ingredient,
    quantity: Math.round(ingredient.quantity * factor * 100) / 100
  }
}

export const combineIngredients = (ingredients: StructuredIngredient[]): StructuredIngredient[] => {
  const combinedMap = new Map<string, StructuredIngredient>()
  
  ingredients.forEach(ingredient => {
    const key = `${ingredient.ingredient.toLowerCase().trim()}-${ingredient.unit.toLowerCase().trim()}`
    
    if (combinedMap.has(key)) {
      const existing = combinedMap.get(key)!
      combinedMap.set(key, {
        ...existing,
        quantity: existing.quantity + ingredient.quantity,
        notes: [existing.notes, ingredient.notes]
          .filter(Boolean)
          .join(', ') || undefined
      })
    } else {
      combinedMap.set(key, { ...ingredient })
    }
  })
  
  return Array.from(combinedMap.values())
}