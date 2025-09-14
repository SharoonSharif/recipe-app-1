import { useState } from 'react'
import { Recipe, RecipeFormData, StructuredIngredient } from '../types/recipe'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, } from './ui/card'
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
  'dash', 'pinch', 'to taste'
]

export function RecipeForm({ recipe, onSave, onCancel }: RecipeFormProps) {
  const [formData, setFormData] = useState({
    name: recipe?.name || '',
    ingredients: recipe?.ingredients || [{ quantity: 1, unit: 'cup', ingredient: '', notes: '' }] as StructuredIngredient[],
    instructions: recipe?.instructions || '',
    prepTime: recipe?.prepTime || 30,
    category: recipe?.category || 'main course',
  })

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { quantity: 1, unit: 'cup', ingredient: '', notes: '' }]
    }))
  }

  const removeIngredient = (index: number) => {
    if (formData.ingredients.length > 1) {
      setFormData(prev => ({
        ...prev,
        ingredients: prev.ingredients.filter((_, i) => i !== index)
      }))
    }
  }

  const updateIngredient = (index: number, field: keyof StructuredIngredient, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ingredient, i) => 
        i === index ? { ...ingredient, [field]: value } : ingredient
      )
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate ingredients
    const validIngredients = formData.ingredients.filter(ing => 
      ing.ingredient.trim() !== '' && ing.quantity > 0
    )
    
    if (validIngredients.length === 0) {
      alert('Please add at least one ingredient')
      return
    }

    onSave({
      ...formData,
      ingredients: validIngredients
    })
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold">
            {recipe ? 'Edit Recipe' : 'Create New Recipe'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Basic Info Section */}
            <div className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-base font-medium">Recipe Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter recipe name..."
                  className="mt-2 text-base"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="category" className="text-base font-medium">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="appetizer">Appetizer</SelectItem>
                      <SelectItem value="main course">Main Course</SelectItem>
                      <SelectItem value="side dish">Side Dish</SelectItem>
                      <SelectItem value="dessert">Dessert</SelectItem>
                      <SelectItem value="beverage">Beverage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="prepTime" className="text-base font-medium">Prep Time (minutes)</Label>
                  <Input
                    id="prepTime"
                    type="number"
                    value={formData.prepTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, prepTime: parseInt(e.target.value) || 0 }))}
                    min="0"
                    className="mt-2"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Ingredients Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <Label className="text-base font-medium">
                  Ingredients ({formData.ingredients.length})
                </Label>
                <Button
                  type="button"
                  onClick={addIngredient}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Ingredient
                </Button>
              </div>

              <div className="space-y-4">
                {formData.ingredients.map((ingredient, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-12 gap-4 items-start">
                      {/* Quantity */}
                      <div className="col-span-2">
                        <Label htmlFor={`quantity-${index}`} className="text-sm font-medium text-gray-700">
                          Qty
                        </Label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          step="0.25"
                          min="0"
                          value={ingredient.quantity}
                          onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>

                      {/* Unit */}
                      <div className="col-span-2">
                        <Label htmlFor={`unit-${index}`} className="text-sm font-medium text-gray-700">
                          Unit
                        </Label>
                        <Select
                          value={ingredient.unit}
                          onValueChange={(value) => updateIngredient(index, 'unit', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COMMON_UNITS.map(unit => (
                              <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Ingredient Name */}
                      <div className="col-span-5">
                        <Label htmlFor={`ingredient-${index}`} className="text-sm font-medium text-gray-700">
                          Ingredient
                        </Label>
                        <Input
                          id={`ingredient-${index}`}
                          type="text"
                          value={ingredient.ingredient}
                          onChange={(e) => updateIngredient(index, 'ingredient', e.target.value)}
                          placeholder="e.g., all-purpose flour"
                          className="mt-1"
                        />
                      </div>

                      {/* Notes */}
                      <div className="col-span-2">
                        <Label htmlFor={`notes-${index}`} className="text-sm font-medium text-gray-700">
                          Notes
                        </Label>
                        <Input
                          id={`notes-${index}`}
                          type="text"
                          value={ingredient.notes || ''}
                          onChange={(e) => updateIngredient(index, 'notes', e.target.value)}
                          placeholder="optional"
                          className="mt-1"
                        />
                      </div>

                      {/* Delete Button */}
                      <div className="col-span-1 flex justify-end pt-6">
                        {formData.ingredients.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeIngredient(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Instructions Section */}
            <div className="pb-4">
              <Label htmlFor="instructions" className="text-base font-medium">Instructions</Label>
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
        <div className="flex-shrink-0 flex gap-4 pt-4 border-t bg-white">
          <Button type="button" onClick={onCancel} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} className="flex-1">
            {recipe ? 'Update Recipe' : 'Save Recipe'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}