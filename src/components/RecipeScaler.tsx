import { useState } from 'react'
import { Recipe, StructuredIngredient } from '../types/recipe'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

interface RecipeScalerProps {
  recipe: Recipe
  onClose: () => void
}

export function RecipeScaler({ recipe, onClose }: RecipeScalerProps) {
  const [originalServings, setOriginalServings] = useState(2) // Default original servings
  const [newServings, setNewServings] = useState(4) // Default new servings

  const scalingFactor = newServings / originalServings

  // Function to scale structured ingredients
  const scaleStructuredIngredient = (ingredient: StructuredIngredient, factor: number): StructuredIngredient => {
    const scaledQuantity = ingredient.quantity * factor
    
    return {
      ...ingredient,
      quantity: Math.round(scaledQuantity * 100) / 100 // Round to 2 decimal places
    }
  }

  const scaledIngredients = recipe.ingredients.map(ingredient => 
    scaleStructuredIngredient(ingredient, scalingFactor)
  )

  const scaledPrepTime = Math.round(recipe.prepTime * Math.sqrt(scalingFactor)) // Prep time doesn't scale linearly

  // Helper function to format ingredient display
  const formatIngredient = (ingredient: StructuredIngredient) => {
    // Handle fractions for common decimals
    const getFraction = (num: number): string => {
      if (num === 0.25) return '1/4'
      if (num === 0.33) return '1/3'
      if (num === 0.5) return '1/2'
      if (num === 0.67) return '2/3'
      if (num === 0.75) return '3/4'
      
      // For mixed numbers
      const whole = Math.floor(num)
      const decimal = num - whole
      if (whole > 0 && decimal === 0.25) return `${whole} 1/4`
      if (whole > 0 && decimal === 0.33) return `${whole} 1/3`
      if (whole > 0 && decimal === 0.5) return `${whole} 1/2`
      if (whole > 0 && decimal === 0.67) return `${whole} 2/3`
      if (whole > 0 && decimal === 0.75) return `${whole} 3/4`
      
      return num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '')
    }

    const quantityStr = getFraction(ingredient.quantity)
    const notesStr = ingredient.notes ? ` (${ingredient.notes})` : ''
    return `${quantityStr} ${ingredient.unit} ${ingredient.ingredient}${notesStr}`
  }

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>${recipe.name} (Scaled for ${newServings} servings)</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { color: #666; margin-top: 25px; }
            .ingredient { margin: 4px 0; padding: 4px 0; }
            .scaling-info { background: #f0f8ff; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>${recipe.name}</h1>
          <div class="scaling-info">
            <strong>Scaled Recipe:</strong> ${newServings} servings (from ${originalServings} servings)<br/>
            <strong>Prep Time:</strong> ${scaledPrepTime} minutes<br/>
            <strong>Category:</strong> ${recipe.category}
          </div>
          
          <h2>Ingredients (${scaledIngredients.length} items)</h2>
          ${scaledIngredients.map(ingredient => 
            `<div class="ingredient">• ${formatIngredient(ingredient)}</div>`
          ).join('')}
          
          <h2>Instructions</h2>
          <p>${recipe.instructions.replace(/\n/g, '<br>')}</p>
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            Scale Recipe: {recipe.name}
            <Badge variant="outline">{recipe.category}</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Scaling Controls */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Serving Size Calculator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="originalServings">Original Recipe Serves</Label>
                    <Input
                      id="originalServings"
                      type="number"
                      value={originalServings}
                      onChange={(e) => setOriginalServings(Number(e.target.value) || 1)}
                      min="1"
                      max="20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newServings">Scale to Serve</Label>
                    <Input
                      id="newServings"
                      type="number"
                      value={newServings}
                      onChange={(e) => setNewServings(Number(e.target.value) || 1)}
                      min="1"
                      max="50"
                    />
                  </div>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm space-y-2">
                    <div><strong>Scaling Factor:</strong> {scalingFactor.toFixed(2)}x</div>
                    <div><strong>Original Prep Time:</strong> {recipe.prepTime} minutes</div>
                    <div><strong>Scaled Prep Time:</strong> {scaledPrepTime} minutes</div>
                  </div>
                </div>

                {/* Quick Scale Buttons */}
                <div className="space-y-2">
                  <Label>Quick Scale Options:</Label>
                  <div className="grid grid-cols-4 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {setOriginalServings(2); setNewServings(1)}}
                    >
                      Half
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {setOriginalServings(2); setNewServings(2)}}
                    >
                      Same
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {setOriginalServings(2); setNewServings(4)}}
                    >
                      Double
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {setOriginalServings(2); setNewServings(6)}}
                    >
                      Triple
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Scaled Recipe */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  Scaled Recipe 
                  <Button onClick={handlePrint} variant="outline" size="sm">
                    🖨️ Print
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Serves {newServings} people • {scaledPrepTime} minutes
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Scaled Ingredients:</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {scaledIngredients.map((ingredient, index) => (
                      <div key={index} className="text-sm p-2 bg-muted rounded">
                        <div className="font-medium">• {formatIngredient(ingredient)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Original: {formatIngredient(recipe.ingredients[index])}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Instructions:</h4>
                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded max-h-32 overflow-y-auto">
                    {recipe.instructions}
                  </div>
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