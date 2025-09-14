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
    })), // 👈 CHANGED: Now structured
    instructions: v.string(),
    prepTime: v.number(),
    category: v.string(),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    isFavorite: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_category", ["category"])
    .index("by_favorite", ["userId", "isFavorite"]),
    
  shoppingLists: defineTable({
    name: v.string(),
    recipeIds: v.array(v.id("recipes")),
    ingredients: v.array(v.object({
      quantity: v.number(),
      unit: v.string(),
      ingredient: v.string(),
      notes: v.optional(v.string()),
    })), // 👈 CHANGED: Now structured
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),
});