import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Temporary debug version - returns empty array if auth fails
export const getByUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      console.log('=== getByUser called ===');
      const identity = await ctx.auth.getUserIdentity();
      console.log('Identity:', identity);
      
      if (!identity) {
        console.log('No identity - returning empty array');
        return [];
      }
      
      const userId = identity.subject;
      console.log('User ID:', userId);
      
      const recipes = await ctx.db
        .query("recipes")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      
      console.log('Found recipes:', recipes.length);
      
      return recipes.map(recipe => ({
        ...recipe,
        isFavorite: recipe.isFavorite ?? false,
      }));
    } catch (error) {
      console.error('Error in getByUser:', error);
      // Return empty array instead of throwing
      return [];
    }
  },
});

// Keep all other functions the same but add error handling
export const getShoppingLists = query({
  args: {},
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return [];
      }
      const userId = identity.subject;
      return await ctx.db
        .query("shoppingLists")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .collect();
    } catch (error) {
      console.error('Error in getShoppingLists:', error);
      return [];
    }
  },
});

// Helper to get user ID from auth
async function getUserId(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity.subject;
}

// Rest of the mutations (create, update, etc.) - keeping them as is for now
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

export const createShoppingList = mutation({
  args: {
    name: v.string(),
    recipeIds: v.array(v.id("recipes")),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    
    const recipes = await Promise.all(
      args.recipeIds.map(id => ctx.db.get(id))
    );
    
    const allOwned = recipes.every(recipe => recipe && recipe.userId === userId);
    if (!allOwned) {
      throw new Error("Some recipes not found or unauthorized");
    }
    
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
