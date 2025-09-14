// src/components/RecipeForm.tsx - Fixed with better validation and error handling
import { useState, useEffect } from 'react'
import { Recipe, RecipeFormData, StructuredIngredient } from '../types/recipe'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent } from './ui/card'
import { Trash2, Plus } from 'lucide-react'

interface RecipeFormProps {
  recipe?: Recipe | null
  onSave: (recipe: RecipeFormData) => void
  onCancel: () => void
}

const COMMON_UNITS = [
  // Volume
  'tsp', 'tbsp', 'cup', 'fl oz', 'pint', 'quart', 'gallon', 'ml', 'liter', 'L',
  // Weight
  'oz', 'lb', 'gram', 'g', 'kg', 'pound',
  // Pieces
  'piece', 'pieces', 'slice', 'slices', 'whole', 'clove', 'cloves', 'bunch', 'head', 'can', 'jar', 'package', 'box',
  // Other
  'dash', 'pinch', 'to taste', 'handful',
] as const

const CATEGORIES = [
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

export function RecipeForm({ recipe, onSave, onCancel }: RecipeFormProps) {
  const [formData, setFormData] = useState<RecipeFormData>({
    name: '',
    category: 'Other',
    ingredients: [{ quantity: 1, unit: 'cup', ingredient: '', notes: '' }],
    instructions: '',
    prepTime: 30,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form data when recipe prop changes
  useEffect(() => {
    if (recipe) {
      setFormData({
        name: recipe.name || '',
        category: recipe.category as RecipeFormData['category'] || 'Other',
        ingredients: recipe.ingredients?.length > 0 
          ? recipe.ingredients.map(ing => ({
              quantity: ing.quantity || 1,
              unit: ing.unit || 'cup',
              ingredient: ing.ingredient || '',
              notes: ing.notes || ''
            }))
          : [{ quantity: 1, unit: 'cup', ingredient: '', notes: '' }],
        instructions: recipe.instructions || '',
        prepTime: recipe.prepTime || 30,
      })
    } else {
      // Reset form for new recipe
      setFormData({
        name: '',
        category: 'Other',
        ingredients: [{ quantity: 1, unit: 'cup', ingredient: '', notes: '' }],
        instructions: '',
        prepTime: 30,
      })
    }
    setErrors({})
  }, [recipe])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Recipe name is required'
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required'
    }

    if (formData.prepTime <= 0) {
      newErrors.prepTime = 'Prep time must be greater than 0'
    }

    if (!formData.instructions.trim()) {
      newErrors.instructions = 'Instructions are required'
    }

    // Validate ingredients
    const validIngredients = formData.ingredients.filter(ing => 
      ing.ingredient.trim() && ing.quantity > 0 && ing.unit.trim()
    )

    if (validIngredients.length === 0) {
      newErrors.ingredients = 'At least one valid ingredient is required'
    }

    // Check for individual ingredient errors
    formData.ingredients.forEach((ing, index) => {
      if (ing.ingredient.trim()) { // Only validate if ingredient name is provided
        if (ing.quantity <= 0) {
          newErrors[`ingredient_${index}_quantity`] = 'Quantity must be greater than 0'
        }
        if (!ing.unit.trim()) {
          newErrors[`ingredient_${index}_unit`] = 'Unit is required'
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const updateIngredient = (index: number, patch: Partial<StructuredIngredient>) => {
    setFormData(prev => {
      const next = [...prev.ingredients]
      next[index] = { ...next[index], ...patch }
      return { ...prev, ingredients: next }
    })
    
    // Clear related errors when user starts typing
    if (patch.ingredient !== undefined) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[`ingredient_${index}_ingredient`]
        delete next.ingredients
        return next
      })
    }
  }

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { quantity: 1, unit: 'cup', ingredient: '', notes: '' },
      ],
    }))
  }

  const removeIngredient = (index: number) => {
    if (formData.ingredients.length <= 1) return // Keep at least one ingredient
    
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }))
    
    // Clear errors for removed ingredient
    setErrors(prev => {
      const next = { ...prev }
      delete next[`ingredient_${index}_quantity`]
      delete next[`ingredient_${index}_unit`]
      delete next[`ingredient_${index}_ingredient`]
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      // Clean up ingredients - only include those with ingredient names
      const cleanedIngredients = formData.ingredients.filter(ing => 
        ing.ingredient.trim() && ing.quantity > 0 && ing.unit.trim()
      )

      const cleanedFormData = {
        ...formData,
        name: formData.name.trim(),
        instructions: formData.instructions.trim(),
        category: formData.category.trim(),
        ingredients: cleanedIngredients,
      }

      await onSave(cleanedFormData)
    } catch (error) {
      console.error('Error saving recipe:', error)
      setErrors({ submit: 'Failed to save recipe. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const clearError = (field: string) => {
    setErrors(prev => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {recipe ? 'Edit Recipe' : 'New Recipe'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Global error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Recipe name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                    clearError('name')
                  }}
                  placeholder="e.g., Creamy Tomato Pasta"
                  className={errors.name ? 'border-red-500' : ''}
                  required
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Category and Prep Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => {
                      setFormData(prev => ({ ...prev, category: val as RecipeFormData['category'] }))
                      clearError('category')
                    }}
                  >
                    <SelectTrigger 
                      id="category"
                      className={errors.category ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-600">{errors.category}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prepTime">Prep time (min) *</Label>
                  <Input
                    id="prepTime"
                    type="number"
                    min={1}
                    max={1440}
                    step="1"
                    value={formData.prepTime}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, prepTime: Number(e.target.value) || 0 }))
                      clearError('prepTime')
                    }}
                    className={errors.prepTime ? 'border-red-500' : ''}
                    required
                  />
                  {errors.prepTime && (
                    <p className="text-sm text-red-600">{errors.prepTime}</p>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions *</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, instructions: e.target.value }))
                    clearError('instructions')
                  }}
                  rows={8}
                  placeholder="Enter step-by-step cooking instructions..."
                  className={`text-base leading-relaxed ${errors.instructions ? 'border-red-500' : ''}`}
                  required
                />
                {errors.instructions && (
                  <p className="text-sm text-red-600">{errors.instructions}</p>
                )}
              </div>
            </div>

            {/* Right Column - Ingredients */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Ingredients *</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addIngredient}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              
              {errors.ingredients && (
                <p className="text-sm text-red-600">{errors.ingredients}</p>
              )}

              <Card>
                <CardContent className="p-4 space-y-4 max-h-96 overflow-y-auto">
                  {formData.ingredients.map((ing, idx) => (
                    <div key={idx} className="space-y-3 p-3 border rounded-lg">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Quantity *</Label>
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="any"
                            min="0.01"
                            value={ing.quantity}
                            onChange={(e) => updateIngredient(idx, { 
                              quantity: parseFloat(e.target.value) || 0 
                            })}
                            className={errors[`ingredient_${idx}_quantity`] ? 'border-red-500' : ''}
                          />
                          {errors[`ingredient_${idx}_quantity`] && (
                            <p className="text-xs text-red-600 mt-1">
                              {errors[`ingredient_${idx}_quantity`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label className="text-xs">Unit *</Label>
                          <Select
                            value={ing.unit}
                            onValueChange={(val) => updateIngredient(idx, { unit: val })}
                          >
                            <SelectTrigger className={errors[`ingredient_${idx}_unit`] ? 'border-red-500' : ''}>
                              <SelectValue placeholder="unit" />
                            </SelectTrigger>
                            <SelectContent>
                              {COMMON_UNITS.map(u => (
                                <SelectItem key={u} value={u}>
                                  {u}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors[`ingredient_${idx}_unit`] && (
                            <p className="text-xs text-red-600 mt-1">
                              {errors[`ingredient_${idx}_unit`]}
                            </p>
                          )}
                        </div>

                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeIngredient(idx)}
                            disabled={formData.ingredients.length <= 1}
                            className="h-9 px-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Ingredient *</Label>
                        <Input
                          value={ing.ingredient}
                          onChange={(e) => updateIngredient(idx, { ingredient: e.target.value })}
                          placeholder="e.g., diced tomatoes"
                          className={errors[`ingredient_${idx}_ingredient`] ? 'border-red-500' : ''}
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Notes (optional)</Label>
                        <Input
                          value={ing.notes || ''}
                          onChange={(e) => updateIngredient(idx, { notes: e.target.value })}
                          placeholder="e.g., canned, no salt added"
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              type="button" 
              onClick={onCancel} 
              variant="outline"
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                recipe ? 'Update Recipe' : 'Save Recipe'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}