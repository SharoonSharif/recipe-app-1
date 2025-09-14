// convex/auth.config.js - Fixed authentication configuration
export default {
  providers: [
    {
      domain: process.env.DESCOPE_DOMAIN || "P2nTyWz0FLCIrVuSI9LVzz8zAiMa.descope.com",
      applicationID: process.env.DESCOPE_APPLICATION_ID || "default",
    },
  ]
};

// convex/recipes.ts - Fixed with better error handling and logging
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper to get user ID from auth with comprehensive error handling
async function getUserId(ctx: any) {
  try {
    const identity = await ctx.auth.getUserIdentity();
    
    if (!identity) {
      console.log('getUserId - No identity found, user not authenticated');
      throw new Error("Not authenticated - please log in");
    }
    
    // Log the identity structure for debugging
    console.log('getUserId - Identity received:', {
      subject: identity.subject,
      tokenIdentifier: identity.tokenIdentifier,
      issuer: identity.issuer
    });
    
    return identity.subject;
  } catch (error) {
    console.error('getUserId - Authentication error:', error);
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

// Ingredient validation helper
function validateIngredient(ingredient: any): boolean {
  return (
    ingredient &&
    typeof ingredient.quantity === 'number' &&
    ingredient.quantity > 0 &&
    typeof ingredient.unit === 'string' &&
    ingredient.unit.trim() !== '' &&
    typeof ingredient.ingredient === 'string' &&
    ingredient.ingredient.trim() !== ''
  );
}

// Get all recipes for the authenticated user
export const getByUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      console.log('=== getByUser query started ===');
      const userId = await getUserId(ctx);
      console.log('getByUser - Authenticated user:', userId);
      
      const recipes = await ctx.db
        .query("recipes")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      
      console.log(`getByUser - Found ${recipes.length} recipes`);
      
      // Ensure consistent data structure
      return recipes.map(recipe => ({
        ...recipe,
        isFavorite: recipe.isFavorite ?? false,
        // Ensure ingredients is always an array
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : []
      }));
    } catch (error) {
      console.error('getByUser - Error:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  },
});

// Create a new recipe with comprehensive validation
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
      console.log('=== create recipe mutation started ===');
      
      // Validate inputs
      if (!args.name || args.name.trim() === '') {
        throw new Error("Recipe name is required");
      }
      
      if (!args.instructions || args.instructions.trim() === '') {
        throw new Error("Instructions are required");
      }
      
      if (args.prepTime <= 0) {
        throw new Error("Prep time must be greater than 0");
      }
      
      if (!args.category || args.category.trim() === '') {
        throw new Error("Category is required");
      }
      
      // Validate ingredients
      const validIngredients = args.ingredients.filter(validateIngredient);
      if (validIngredients.length === 0) {
        throw new Error("At least one valid ingredient is required");
      }
      
      const userId = await getUserId(ctx);
      console.log('create - Authenticated user:', userId);
      
      const now = Date.now();
      const recipeData = {
        name: args.name.trim(),
        ingredients: validIngredients,
        instructions: args.instructions.trim(),
        prepTime: args.prepTime,
        category: args.category.trim(),
        userId,
        createdAt: now,
        updatedAt: now,
        isFavorite: false,
      };
      
      console.log('create - Inserting recipe:', recipeData.name);
      const result = await ctx.db.insert("recipes", recipeData);
      console.log('create - Recipe created with ID:', result);
      
      return result;
    } catch (error) {
      console.error('create - Error:', error);
      throw new Error(`Failed to create recipe: ${error.message}`);
    }
  },
});

// Update recipe with ownership verification
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
      console.log('=== update recipe mutation started ===');
      
      const userId = await getUserId(ctx);
      const recipe = await ctx.db.get(args.id);
      
      if (!recipe) {
        throw new Error("Recipe not found");
      }
      
      if (recipe.userId !== userId) {
        throw new Error("You don't have permission to edit this recipe");
      }
      
      // Validate inputs (same as create)
      if (!args.name || args.name.trim() === '') {
        throw new Error("Recipe name is required");
      }
      
      const validIngredients = args.ingredients.filter(validateIngredient);
      if (validIngredients.length === 0) {
        throw new Error("At least one valid ingredient is required");
      }
      
      const { id, ...updateData } = args;
      const result = await ctx.db.patch(id, {
        ...updateData,
        name: updateData.name.trim(),
        instructions: updateData.instructions.trim(),
        category: updateData.category.trim(),
        ingredients: validIngredients,
        updatedAt: Date.now(),
      });
      
      console.log('update - Recipe updated successfully');
      return result;
    } catch (error) {
      console.error('update - Error:', error);
      throw new Error(`Failed to update recipe: ${error.message}`);
    }
  },
});

// Toggle favorite with ownership check
export const toggleFavorite = mutation({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    try {
      const userId = await getUserId(ctx);
      const recipe = await ctx.db.get(args.id);
      
      if (!recipe || recipe.userId !== userId) {
        throw new Error("Recipe not found or access denied");
      }
      
      const currentFavorite = recipe.isFavorite ?? false;
      
      return await ctx.db.patch(args.id, {
        isFavorite: !currentFavorite,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('toggleFavorite - Error:', error);
      throw new Error(`Failed to update favorite status: ${error.message}`);
    }
  },
});

// Delete recipe with ownership check
export const remove = mutation({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    try {
      const userId = await getUserId(ctx);
      const recipe = await ctx.db.get(args.id);
      
      if (!recipe || recipe.userId !== userId) {
        throw new Error("Recipe not found or access denied");
      }
      
      return await ctx.db.delete(args.id);
    } catch (error) {
      console.error('remove - Error:', error);
      throw new Error(`Failed to delete recipe: ${error.message}`);
    }
  },
});

// Get shopping lists with error handling
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

// Create shopping list with smart ingredient combining
export const createShoppingList = mutation({
  args: {
    name: v.string(),
    recipeIds: v.array(v.id("recipes")),
  },
  handler: async (ctx, args) => {
    try {
      if (!args.name || args.name.trim() === '') {
        throw new Error("Shopping list name is required");
      }
      
      if (args.recipeIds.length === 0) {
        throw new Error("At least one recipe must be selected");
      }
      
      const userId = await getUserId(ctx);
      
      // Fetch and verify ownership of all recipes
      const recipes = await Promise.all(
        args.recipeIds.map(id => ctx.db.get(id))
      );
      
      const invalidRecipes = recipes.filter(recipe => !recipe || recipe.userId !== userId);
      if (invalidRecipes.length > 0) {
        throw new Error("Some selected recipes are not accessible");
      }
      
      // Smart ingredient combining logic
      const combinedIngredients = new Map();
      
      recipes.forEach(recipe => {
        if (recipe && Array.isArray(recipe.ingredients)) {
          recipe.ingredients.forEach(ingredient => {
            if (validateIngredient(ingredient)) {
              const key = `${ingredient.ingredient.toLowerCase().trim()}-${ingredient.unit.toLowerCase().trim()}`;
              
              if (combinedIngredients.has(key)) {
                const existing = combinedIngredients.get(key);
                combinedIngredients.set(key, {
                  ...existing,
                  quantity: existing.quantity + ingredient.quantity,
                  notes: [existing.notes, ingredient.notes]
                    .filter(Boolean)
                    .join(', ') || undefined
                });
              } else {
                combinedIngredients.set(key, { ...ingredient });
              }
            }
          });
        }
      });
      
      const finalIngredients = Array.from(combinedIngredients.values());
      const now = Date.now();
      
      return await ctx.db.insert("shoppingLists", {
        name: args.name.trim(),
        recipeIds: args.recipeIds,
        ingredients: finalIngredients,
        userId,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      console.error('createShoppingList - Error:', error);
      throw new Error(`Failed to create shopping list: ${error.message}`);
    }
  },
});

// Delete shopping list with ownership check
export const deleteShoppingList = mutation({
  args: { id: v.id("shoppingLists") },
  handler: async (ctx, args) => {
    try {
      const userId = await getUserId(ctx);
      const list = await ctx.db.get(args.id);
      
      if (!list || list.userId !== userId) {
        throw new Error("Shopping list not found or access denied");
      }
      
      return await ctx.db.delete(args.id);
    } catch (error) {
      console.error('deleteShoppingList - Error:', error);
      throw new Error(`Failed to delete shopping list: ${error.message}`);
    }
  },
});