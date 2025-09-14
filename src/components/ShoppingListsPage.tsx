import { ShoppingList, Recipe } from '../types/recipe'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

interface ShoppingListsPageProps {
  shoppingLists: ShoppingList[]
  recipes: Recipe[]
  onViewList: (list: ShoppingList) => void
  onDeleteList: (id: string) => void
  onCreateNew: () => void
  onBack: () => void
}

export function ShoppingListsPage({ 
  shoppingLists, 
  recipes, 
  onViewList, 
  onDeleteList, 
  onCreateNew, 
  onBack 
}: ShoppingListsPageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button onClick={onBack} variant="outline" size="sm">
                ← Back to Recipes
              </Button>
              <h1 className="text-3xl font-bold">Shopping Lists</h1>
              <Badge variant="secondary">{shoppingLists.length} lists</Badge>
            </div>
            
            <Button onClick={onCreateNew}>
              🛒 Create New List
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {shoppingLists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shoppingLists.map((list) => {
              const listRecipes = recipes.filter(recipe => 
                list.recipeIds.includes(recipe._id)
              )
              
              return (
                <Card key={list._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      <span className="flex-1">{list.name}</span>
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(list.createdAt).toLocaleDateString()}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Recipes ({listRecipes.length}):
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {listRecipes.slice(0, 3).map(recipe => (
                          <Badge key={recipe._id} variant="outline" className="text-xs">
                            {recipe.name}
                          </Badge>
                        ))}
                        {listRecipes.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{listRecipes.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      🛒 {list.ingredients.length} ingredients
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => onViewList(list)} 
                        variant="outline" 
                        className="flex-1"
                      >
                        View & Shop
                      </Button>
                      <Button 
                        onClick={() => onDeleteList(list._id)} 
                        variant="destructive"
                        size="sm"
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8">
                <div className="text-6xl mb-4">🛒</div>
                <h3 className="text-xl font-semibold mb-2">No shopping lists yet!</h3>
                <p className="text-muted-foreground mb-6">
                  Create shopping lists from your recipes to make grocery shopping easier.
                </p>
                <Button onClick={onCreateNew} size="lg" className="w-full">
                  Create Your First Shopping List
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}