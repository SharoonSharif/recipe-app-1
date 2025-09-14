import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all recipes for a specific user
export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const recipes = await ctx.db.query("recipes").collect();
    return recipes
      .filter(recipe => recipe.userId === args.userId)
      .map(recipe => ({
        ...recipe,
        isFavorite: recipe.isFavorite ?? false, // Default to false if missing
      }));
  },
});

// Create a new recipe
export const create = mutation({
  args: {
    name: v.string(),
    ingredients: v.array(v.object({
      quantity: v.number(),
      unit: v.string(),
      ingredient: v.string(),
      notes: v.optional(v.string()),
    })),
    instructions: v.string(),
    prepTime: v.number(),
    category: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("recipes", {
      name: args.name,
      ingredients: args.ingredients,
      instructions: args.instructions,
      prepTime: args.prepTime,
      category: args.category,
      userId: args.userId,
      createdAt: now,
      updatedAt: now,
      isFavorite: false, // New recipes default to false
    });
  },
});

// Update an existing recipe
export const update = mutation({
  args: {
    id: v.id("recipes"),
    name: v.string(),
    ingredients: v.array(v.object({
      quantity: v.number(),
      unit: v.string(),
      ingredient: v.string(),
      notes: v.optional(v.string()),
    })),
    instructions: v.string(),
    prepTime: v.number(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      name: args.name,
      ingredients: args.ingredients,
      instructions: args.instructions,
      prepTime: args.prepTime,
      category: args.category,
      updatedAt: Date.now(),
    });
  },
});

// Toggle favorite status
export const toggleFavorite = mutation({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get(args.id);
    if (!recipe) {
      throw new Error("Recipe not found");
    }
    
    const currentFavorite = recipe.isFavorite ?? false; // Handle missing field
    
    return await ctx.db.patch(args.id, {
      isFavorite: !currentFavorite,
      updatedAt: Date.now(),
    });
  },
});

// Delete a recipe
export const remove = mutation({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

// Create shopping list with smart ingredient combining
export const createShoppingList = mutation({
  args: {
    name: v.string(),
    recipeIds: v.array(v.id("recipes")),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all selected recipes
    const recipes = await Promise.all(
      args.recipeIds.map(id => ctx.db.get(id))
    );
    
    // Combine ingredients intelligently
    const combinedIngredients = new Map();
    
    recipes.forEach(recipe => {
      if (recipe && recipe.ingredients) {
        recipe.ingredients.forEach(ingredient => {
          const key = `${ingredient.ingredient.toLowerCase()}-${ingredient.unit}`;
          
          if (combinedIngredients.has(key)) {
            const existing = combinedIngredients.get(key);
            combinedIngredients.set(key, {
              ...existing,
              quantity: existing.quantity + ingredient.quantity,
              notes: existing.notes && ingredient.notes 
                ? `${existing.notes}, ${ingredient.notes}` 
                : existing.notes || ingredient.notes || undefined
            });
          } else {
            combinedIngredients.set(key, { 
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              ingredient: ingredient.ingredient,
              notes: ingredient.notes || undefined
            });
          }
        });
      }
    });
    
    const finalIngredients = Array.from(combinedIngredients.values());
    
    const now = Date.now();
    return await ctx.db.insert("shoppingLists", {
      name: args.name,
      recipeIds: args.recipeIds,
      ingredients: finalIngredients,
      userId: args.userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get shopping lists for user
export const getShoppingLists = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("shoppingLists")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Delete shopping list
export const deleteShoppingList = mutation({
  args: { id: v.id("shoppingLists") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});