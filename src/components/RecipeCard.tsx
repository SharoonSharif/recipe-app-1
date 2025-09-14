import { Recipe } from '../types/recipe'
import { Card, CardContent, CardHeader, CardFooter } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'

interface RecipeCardProps {
  recipe: Recipe
  onEdit: (recipe: Recipe) => void
  onDelete: (id: string) => void
  onToggleFavorite: (id: string) => void
  onScale: (recipe: Recipe) => void
}

export function RecipeCard({ recipe, onEdit, onDelete, onToggleFavorite, onScale }: RecipeCardProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString()
  }

  // Helper function to format structured ingredients
  const formatIngredient = (ingredient: any) => {
    const quantity = ingredient.quantity % 1 === 0 
      ? ingredient.quantity.toString() 
      : ingredient.quantity.toFixed(2).replace(/\.?0+$/, '')
    const notesStr = ingredient.notes ? ` (${ingredient.notes})` : ''
    return `${quantity} ${ingredient.unit} ${ingredient.ingredient}${notesStr}`
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        {/* Header */}
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold text-gray-900 flex-1">{recipe.name}</h3>
          <div className="flex items-center gap-2">
            {/* Favorite Heart Button */}
            <Button
              onClick={() => onToggleFavorite(recipe._id)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-red-50"
            >
              {(recipe.isFavorite ?? false) ? '❤️' : '🤍'}
            </Button>
            <Badge variant="secondary">{recipe.category}</Badge>
          </div>
        </div>
        
        {/* Prep Time */}
        <div className="text-sm text-muted-foreground">
          🕒 Prep time: {recipe.prepTime} minutes
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Ingredients Preview */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Ingredients:</h4>
          <div className="text-sm text-muted-foreground">
            {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
              <div key={index}>• {formatIngredient(ingredient)}</div>
            ))}
            {recipe.ingredients.length > 3 && (
              <div className="text-muted-foreground italic">
                ... and {recipe.ingredients.length - 3} more
              </div>
            )}
          </div>
        </div>

        {/* Instructions Preview */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Instructions:</h4>
          <p className="text-sm text-muted-foreground">
            {recipe.instructions.length > 100 
              ? recipe.instructions.substring(0, 100) + '...'
              : recipe.instructions
            }
          </p>
        </div>

        {/* Date */}
        <div className="text-xs text-muted-foreground">
          Added: {formatDate(recipe.createdAt)}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-4">
        {/* Scale Button */}
        <Button 
          onClick={() => onScale(recipe)} 
          variant="outline" 
          size="sm"
          className="flex-1"
        >
          🔢 Scale
        </Button>
        
        <Button 
          onClick={() => onEdit(recipe)} 
          variant="outline" 
          size="sm"
          className="flex-1"
        >
          Edit
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="flex-1">
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{recipe.name}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(recipe._id)}>
                Delete Recipe
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
}