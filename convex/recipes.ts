import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper to get user ID from auth with better error handling
async function getUserId(ctx: any) {
  try {
    const identity = await ctx.auth.getUserIdentity();
    console.log('getUserId - Identity:', identity);
    
    if (!identity) {
      console.log('getUserId - No identity found');
      throw new Error("Not authenticated");
    }
    
    console.log('getUserId - Subject:', identity.subject);
    return identity.subject;
  } catch (error) {
    console.error('getUserId - Error:', error);
    throw error;
  }
}

// Get all recipes for the authenticated user
export const getByUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      console.log('=== getByUser called ===');
      const userId = await getUserId(ctx);
      console.log('getByUser - Got userId:', userId);
      
      const recipes = await ctx.db
        .query("recipes")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      
      console.log('getByUser - Found recipes:', recipes.length);
      
      return recipes.map(recipe => ({
        ...recipe,
        isFavorite: recipe.isFavorite ?? false,
      }));
    } catch (error) {
      console.error('getByUser - Error:', error);
      return [];
    }
  },
});

// Create a new recipe with better error handling
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
    try {
      console.log('=== create recipe called ===');
      const userId = await getUserId(ctx);
      console.log('create - Got userId:', userId);
      
      const now = Date.now();
      const cleanedIngredients = args.ingredients.filter(
        (i) => i.ingredient.trim() !== ""
      );
      const newRecipe = {
        ...args,
        ingredients: cleanedIngredients,
        userId,
        createdAt: now,
        updatedAt: now,
        isFavorite: false,
      };
      
      console.log('create - Inserting recipe:', newRecipe.name);
      const result = await ctx.db.insert("recipes", newRecipe);
      console.log('create - Recipe created with ID:', result);
      
      return result;
    } catch (error) {
      console.error('create - Error:', error);
      throw error;
    }
  },
});

// Update recipe with better error handling
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
    try {
      console.log('=== update recipe called ===');
      const userId = await getUserId(ctx);
      const recipe = await ctx.db.get(args.id);
      
      if (!recipe || recipe.userId !== userId) {
        throw new Error("Recipe not found or unauthorized");
      }
      
      const { id, ...updateData } = args;
      const cleanedIngredients = updateData.ingredients.filter(
        (i) => i.ingredient.trim() !== ""
      );
      return await ctx.db.patch(id, {
        ...updateData,
        ingredients: cleanedIngredients,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('update - Error:', error);
      throw error;
    }
  },
});

// Toggle favorite with better error handling
export const toggleFavorite = mutation({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    try {
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
    } catch (error) {
      console.error('toggleFavorite - Error:', error);
      throw error;
    }
  },
});

// Delete recipe with better error handling
export const remove = mutation({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    try {
      const userId = await getUserId(ctx);
      const recipe = await ctx.db.get(args.id);
      
      if (!recipe || recipe.userId !== userId) {
        throw new Error("Recipe not found or unauthorized");
      }
      
      return await ctx.db.delete(args.id);
    } catch (error) {
      console.error('remove - Error:', error);
      throw error;
    }
  },
});

// Get shopping lists with better error handling
export const getShoppingLists = query({
  args: {},
  handler: async (ctx) => {
    try {
      const userId = await getUserId(ctx);
      return await ctx.db
        .query("shoppingLists")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .collect();
    } catch (error) {
      console.error('getShoppingLists - Error:', error);
      return [];
    }
  },
});

// Create shopping list with better error handling
export const createShoppingList = mutation({
  args: {
    name: v.string(),
    recipeIds: v.array(v.id("recipes")),
  },
  handler: async (ctx, args) => {
    try {
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
    } catch (error) {
      console.error('createShoppingList - Error:', error);
      throw error;
    }
  },
});

// Delete shopping list with better error handling
export const deleteShoppingList = mutation({
  args: { id: v.id("shoppingLists") },
  handler: async (ctx, args) => {
    try {
      const userId = await getUserId(ctx);
      const list = await ctx.db.get(args.id);
      
      if (!list || list.userId !== userId) {
        throw new Error("Shopping list not found or unauthorized");
      }
      
      return await ctx.db.delete(args.id);
    } catch (error) {
      console.error('deleteShoppingList - Error:', error);
      throw error;
    }
  },
});
