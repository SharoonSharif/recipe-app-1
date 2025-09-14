import { useState } from 'react'
import { Recipe, RecipeFormData, StructuredIngredient } from '../types/recipe'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card } from './ui/card'
import { Trash2, Plus } from 'lucide-react'

interface RecipeFormProps {
  recipe?: Recipe | null
  onSave: (recipe: RecipeFormData) => void
  onCancel: () => void
}

const COMMON_UNITS = [
  // Volume
  'tsp', 'tbsp', 'cup', 'fl oz', 'pint', 'quart', 'gallon', 'ml', 'liter',
  // Weight
  'oz', 'lb', 'gram', 'kg',
  // Pieces
  'piece', 'slice', 'whole', 'clove', 'bunch', 'head', 'can', 'jar', 'package',
  // Other
  'dash', 'pinch', 'to taste',
] as const

// Adjust these to match whatever your backend/type allows.
// If RecipeFormData['category'] is a union, ensure the strings below are in that union.
const CATEGORIES: string[] = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Dessert',
  'Drink',
  'Other',
]

export function RecipeForm({ recipe, onSave, onCancel }: RecipeFormProps) {
  const [formData, setFormData] = useState<RecipeFormData>({
    name: recipe?.name ?? '',
    category: (recipe?.category as RecipeFormData['category']) ?? ('Other' as RecipeFormData['category']),
    ingredients:
      (recipe?.ingredients as StructuredIngredient[] | undefined) ??
      ([{ quantity: 1, unit: 'cup', ingredient: '', notes: '' }] as StructuredIngredient[]),
    instructions: recipe?.instructions ?? '',
    prepTime: recipe?.prepTime ?? 30,
  })

  const updateIngredient = (index: number, patch: Partial<StructuredIngredient>) => {
    setFormData(prev => {
      const next = [...prev.ingredients]
      next[index] = { ...next[index], ...patch }
      return { ...prev, ingredients: next }
    })
  }

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { quantity: 1, unit: 'cup', ingredient: '', notes: '' } as StructuredIngredient,
      ],
    }))
  }

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = () => {
    // Basic validation
    if (!formData.name.trim()) return
    if (!formData.category || !String(formData.category).trim()) return
    const hasAtLeastOneItem = formData.ingredients.some(i => (i.ingredient ?? '').trim())
    if (!hasAtLeastOneItem) return
    onSave(formData)
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent className="sm:max-w-2xl flex max-h-[85vh]">
        <div className="flex-1 overflow-y-auto pr-2">
          <DialogHeader>
            <DialogTitle>{recipe ? 'Edit Recipe' : 'New Recipe'}</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit()
            }}
            className="space-y-6"
          >
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Recipe name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Creamy Tomato Pasta"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={String(formData.category)}
                onValueChange={(val) =>
                  setFormData(prev => ({ ...prev, category: val as RecipeFormData['category'] }))
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prep Time */}
            <div className="space-y-2">
              <Label htmlFor="prepTime">Prep time (minutes)</Label>
              <Input
                id="prepTime"
                type="number"
                min={0}
                step="1"
                value={formData.prepTime ?? 0}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, prepTime: Number(e.target.value || 0) }))
                }
                required
              />
            </div>

            {/* Ingredients */}
            <div className="space-y-3">
              <Label>Ingredients</Label>
              <Card className="p-4 space-y-3">
                {formData.ingredients.map((ing, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-3">
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={ing.quantity ?? 0}
                        onChange={(e) => updateIngredient(idx, { quantity: Number(e.target.value || 0) })}
                      />
                    </div>

                    <div className="col-span-3">
                      <Label className="text-xs">Unit</Label>
                      <Select
                        value={ing.unit ?? ''}
                        onValueChange={(val) => updateIngredient(idx, { unit: val })}
                      >
                        <SelectTrigger>
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
                    </div>

                    <div className="col-span-5">
                      <Label className="text-xs">Ingredient</Label>
                      <Input
                        value={ing.ingredient ?? ''}
                        onChange={(e) => updateIngredient(idx, { ingredient: e.target.value })}
                        placeholder="e.g., diced tomatoes"
                      />
                    </div>

                    <div className="col-span-12">
                      <Label className="text-xs">Notes (optional)</Label>
                      <Input
                        value={ing.notes ?? ''}
                        onChange={(e) => updateIngredient(idx, { notes: e.target.value })}
                        placeholder="e.g., canned, no salt added"
                      />
                    </div>

                    <div className="col-span-12 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeIngredient(idx)}
                        className="h-8 px-2"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>

                    <div className="col-span-12 border-b" />
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={addIngredient} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add ingredient
                </Button>
              </Card>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                rows={8}
                placeholder="Enter step-by-step cooking instructions..."
                className="mt-2 text-base leading-relaxed"
                required
              />
            </div>
          </form>
        </div>

        {/* Fixed Action Buttons */}
        <div className="flex-shrink-0 flex flex-col gap-4 pt-4 border-t sm:border-t-0 sm:border-l bg-white sm:pl-4 min-w-[200px]">
          <Button type="button" onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            {recipe ? 'Update Recipe' : 'Save Recipe'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
