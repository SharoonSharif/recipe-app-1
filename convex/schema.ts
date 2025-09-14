import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  recipes: defineTable({
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
    createdAt: v.number(),
    updatedAt: v.number(),
    isFavorite: v.optional(v.boolean()),
    // New fields for enhanced features
    rating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
    lastMade: v.optional(v.number()),
    timesCooked: v.optional(v.number()),
    personalNotes: v.optional(v.string()),
    difficulty: v.optional(v.union(
      v.literal("easy"), 
      v.literal("medium"), 
      v.literal("hard")
    )),
    tags: v.optional(v.array(v.string())),
  })
    .index("by_user", ["userId"])
    .index("by_category", ["category"])
    .index("by_favorite", ["userId", "isFavorite"])
    .index("by_rating", ["userId", "rating"]),
    
  shoppingLists: defineTable({
    name: v.string(),
    recipeIds: v.array(v.id("recipes")),
    ingredients: v.array(v.object({
      quantity: v.number(),
      unit: v.string(),
      ingredient: v.string(),
      notes: v.optional(v.string()),
    })),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // New tables for advanced features
  mealPlans: defineTable({
    name: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    meals: v.array(v.object({
      date: v.string(),
      breakfast: v.optional(v.array(v.id("recipes"))),
      lunch: v.optional(v.array(v.id("recipes"))),
      dinner: v.optional(v.array(v.id("recipes"))),
      snacks: v.optional(v.array(v.id("recipes"))),
    })),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
  
  recipeCollections: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    recipeIds: v.array(v.id("recipes")),
    isPublic: v.boolean(),
    tags: v.array(v.string()),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_public", ["isPublic"]),
});
