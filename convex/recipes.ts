import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper to get user ID from auth
async function getUserId(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  // Use the subject (sub) claim from the JWT as the user ID
  return identity.subject;
}

// Get all recipes for the authenticated user
export const getByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    return recipes.map(recipe => ({
      ...recipe,
      isFavorite: recipe.isFavorite ?? false,
    }));
  },
});

// Create a new recipe for the authenticated user
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
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const now = Date.now();
    
    return await ctx.db.insert("recipes", {
      ...args,
      userId,
      createdAt: now,
      updatedAt: now,
      isFavorite: false,
    });
  },
});

// Update recipe (with ownership check)
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
    const userId = await getUserId(ctx);
    const recipe = await ctx.db.get(args.id);
    
    if (!recipe || recipe.userId !== userId) {
      throw new Error("Recipe not found or unauthorized");
    }
    
    const { id, ...updateData } = args;
    return await ctx.db.patch(id, {
      ...updateData,
      updatedAt: Date.now(),
    });
  },
});

// Toggle favorite (with ownership check)
export const toggleFavorite = mutation({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const recipe = await ctx.db.get(args.id);
    
    if (!recipe || recipe.userId !== userId) {
      throw new Error("Recipe not found or unauthorized");
    }
    
    const currentFavorite = recipe.isFavorite ?? false;
    
    return await ctx.db.patch(args.id, {
      isFavorite: !currentFavorite,
      updatedAt: Date.now(),
    });
  },
});

// Delete recipe (with ownership check)
export const remove = mutation({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const recipe = await ctx.db.get(args.id);
    
    if (!recipe || recipe.userId !== userId) {
      throw new Error("Recipe not found or unauthorized");
    }
    
    return await ctx.db.delete(args.id);
  },
});

// Create shopping list
export const createShoppingList = mutation({
  args: {
    name: v.string(),
    recipeIds: v.array(v.id("recipes")),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    
    // Verify user owns all recipes
    const recipes = await Promise.all(
      args.recipeIds.map(id => ctx.db.get(id))
    );
    
    const allOwned = recipes.every(recipe => recipe && recipe.userId === userId);
    if (!allOwned) {
      throw new Error("Some recipes not found or unauthorized");
    }
    
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
            combinedIngredients.set(key, { ...ingredient });
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
      userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get shopping lists for authenticated user
export const getShoppingLists = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    return await ctx.db
      .query("shoppingLists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Delete shopping list (with ownership check)
export const deleteShoppingList = mutation({
  args: { id: v.id("shoppingLists") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const list = await ctx.db.get(args.id);
    
    if (!list || list.userId !== userId) {
      throw new Error("Shopping list not found or unauthorized");
    }
    
    return await ctx.db.delete(args.id);
  },
});
