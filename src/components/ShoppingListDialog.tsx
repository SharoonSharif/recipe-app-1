import { useState } from 'react'
import { Recipe, StructuredIngredient } from '../types/recipe'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Checkbox } from './ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

interface ShoppingListDialogProps {
  recipes: Recipe[]
  onCreateList: (name: string, selectedRecipeIds: string[]) => void
  onClose: () => void
}

export function ShoppingListDialog({ recipes, onCreateList, onClose }: ShoppingListDialogProps) {
  const [listName, setListName] = useState(`Shopping List - ${new Date().toLocaleDateString()}`)
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([])

  const toggleRecipe = (recipeId: string) => {
    setSelectedRecipes(prev => 
      prev.includes(recipeId) 
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId]
    )
  }

  const handleCreate = () => {
    if (selectedRecipes.length === 0) {
      alert('Please select at least one recipe')
      return
    }
    onCreateList(listName, selectedRecipes)
  }

  const selectedRecipeObjects = recipes.filter(recipe => selectedRecipes.includes(recipe._id))
  
  // Smart ingredient combining for preview
  const combineIngredients = (recipeList: Recipe[]): StructuredIngredient[] => {
    const combinedMap = new Map<string, StructuredIngredient>()
    
    recipeList.forEach(recipe => {
      recipe.ingredients.forEach(ingredient => {
        const key = `${ingredient.ingredient.toLowerCase()}-${ingredient.unit}`
        
        if (combinedMap.has(key)) {
          const existing = combinedMap.get(key)!
          combinedMap.set(key, {
            ...existing,
            quantity: existing.quantity + ingredient.quantity,
            notes: existing.notes && ingredient.notes 
              ? `${existing.notes}, ${ingredient.notes}` 
              : existing.notes || ingredient.notes
          })
        } else {
          combinedMap.set(key, { ...ingredient })
        }
      })
    })
    
    return Array.from(combinedMap.values())
  }

  const combinedIngredients = combineIngredients(selectedRecipeObjects)

  // Helper function to format ingredient display
  const formatIngredient = (ingredient: StructuredIngredient) => {
    const quantity = ingredient.quantity % 1 === 0 
      ? ingredient.quantity.toString() 
      : ingredient.quantity.toFixed(2).replace(/\.?0+$/, '')
    const notesStr = ingredient.notes ? ` (${ingredient.notes})` : ''
    return `${quantity} ${ingredient.unit} ${ingredient.ingredient}${notesStr}`
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Shopping List</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Recipe Selection */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="listName">Shopping List Name</Label>
              <Input
                id="listName"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="Enter list name"
              />
            </div>

            <div>
              <Label>Select Recipes ({selectedRecipes.length} selected)</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-3">
                {recipes.map(recipe => (
                  <div key={recipe._id} className="flex items-center space-x-3">
                    <Checkbox
                      id={recipe._id}
                      checked={selectedRecipes.includes(recipe._id)}
                      onCheckedChange={() => toggleRecipe(recipe._id)}
                    />
                    <Label htmlFor={recipe._id} className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-center">
                        <span>{recipe.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {recipe.category}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {recipe.ingredients.length} ingredients
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Preview */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Shopping List Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedRecipes.length === 0 ? (
                  <p className="text-muted-foreground italic">Select recipes to see ingredients</p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Selected Recipes:</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedRecipeObjects.map(recipe => (
                          <Badge key={recipe._id} variant="secondary" className="text-xs">
                            {recipe.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">
                        Combined Shopping List ({combinedIngredients.length} items):
                      </h4>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {combinedIngredients.map((ingredient, index) => (
                          <div key={index} className="text-sm p-2 bg-muted rounded">
                            • {formatIngredient(ingredient)}
                          </div>
                        ))}
                      </div>
                    </div>

                    {combinedIngredients.length !== selectedRecipeObjects.reduce((total, recipe) => total + recipe.ingredients.length, 0) && (
                      <div className="text-xs text-muted-foreground bg-green-50 p-2 rounded border">
                        ✨ Smart combining: {selectedRecipeObjects.reduce((total, recipe) => total + recipe.ingredients.length, 0)} individual ingredients combined into {combinedIngredients.length} shopping items!
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            onClick={handleCreate} 
            disabled={selectedRecipes.length === 0}
            className="flex-1"
          >
            Create Shopping List ({selectedRecipes.length} recipes)
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}