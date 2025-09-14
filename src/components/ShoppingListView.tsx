import { ShoppingList, Recipe, StructuredIngredient } from '../types/recipe'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Checkbox } from './ui/checkbox'
import { useState } from 'react'

interface ShoppingListViewProps {
  shoppingList: ShoppingList
  recipes: Recipe[]
  onClose: () => void
  onDelete: (id: string) => void
}

export function ShoppingListView({ shoppingList, recipes, onClose, onDelete }: ShoppingListViewProps) {
  const [checkedItems, setCheckedItems] = useState<boolean[]>(
    new Array(shoppingList.ingredients.length).fill(false)
  )

  const toggleItem = (index: number) => {
    setCheckedItems(prev => {
      const newChecked = [...prev]
      newChecked[index] = !newChecked[index]
      return newChecked
    })
  }

  const selectedRecipes = recipes.filter(recipe => 
    shoppingList.recipeIds.includes(recipe._id)
  )

  // Helper function to format ingredient display
  const formatIngredient = (ingredient: StructuredIngredient) => {
    const quantity = ingredient.quantity % 1 === 0 
      ? ingredient.quantity.toString() 
      : ingredient.quantity.toFixed(2).replace(/\.?0+$/, '')
    const notesStr = ingredient.notes ? ` (${ingredient.notes})` : ''
    return `${quantity} ${ingredient.unit} ${ingredient.ingredient}${notesStr}`
  }

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>${shoppingList.name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
            }
            h1 { 
              color: #333; 
              border-bottom: 2px solid #333; 
              padding-bottom: 10px; 
            }
            h2 { 
              color: #666; 
              margin-top: 30px; 
            }
            .ingredient { 
              padding: 8px; 
              margin: 4px 0; 
              border: 1px solid #ddd; 
            }
            .recipe { 
              background: #f5f5f5; 
              padding: 8px; 
              margin: 4px; 
              border-radius: 4px; 
            }
            @media print { 
              body { margin: 0; } 
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${shoppingList.name}</h1>
          <p>Created: ${new Date(shoppingList.createdAt).toLocaleDateString()}</p>
          
          <h2>Recipes (${selectedRecipes.length})</h2>
          ${selectedRecipes.map(recipe => `<div class="recipe">${recipe.name}</div>`).join('')}
          
          <h2>Shopping List (${shoppingList.ingredients.length} items)</h2>
          ${shoppingList.ingredients.map(ingredient => 
            `<div class="ingredient">☐ ${formatIngredient(ingredient)}</div>`
          ).join('')}
        </body>
      </html>
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const completionPercentage = (checkedItems.filter(Boolean).length / shoppingList.ingredients.length) * 100

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            {shoppingList.name}
            <div className="flex gap-2">
              <Button onClick={handlePrint} variant="outline" size="sm">
                🖨️ Print
              </Button>
              <Button 
                onClick={() => onDelete(shoppingList._id)} 
                variant="destructive" 
                size="sm"
              >
                Delete List
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Shopping List */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Shopping List ({shoppingList.ingredients.length} items)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {shoppingList.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-start space-x-3 p-2 rounded hover:bg-muted">
                      <Checkbox
                        id={`ingredient-${index}`}
                        checked={checkedItems[index]}
                        onCheckedChange={() => toggleItem(index)}
                        className="mt-1"
                      />
                      <label 
                        htmlFor={`ingredient-${index}`} 
                        className={`flex-1 cursor-pointer text-sm ${
                          checkedItems[index] ? 'line-through text-muted-foreground' : ''
                        }`}
                      >
                        <div className="font-medium">
                          {formatIngredient(ingredient)}
                        </div>
                        {ingredient.notes && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Note: {ingredient.notes}
                          </div>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Progress: {checkedItems.filter(Boolean).length} of {shoppingList.ingredients.length} items
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all" 
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Recipe Details */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recipes ({selectedRecipes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedRecipes.map(recipe => (
                    <div key={recipe._id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{recipe.name}</h4>
                        <Badge variant="outline">{recipe.category}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        🕒 {recipe.prepTime} minutes • {recipe.ingredients.length} ingredients
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                  Created: {new Date(shoppingList.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={onClose} className="flex-1">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}