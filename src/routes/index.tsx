import { createFileRoute } from '@tanstack/react-router'
import { useSession, useUser, useDescope } from '@descope/react-sdk'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { LoginPage } from '../components/LoginPage'
import { RecipeForm } from '../components/RecipeForm'
import { RecipeCard } from '../components/RecipeCard'
import { RecipeScaler } from '../components/RecipeScaler'
import { ShoppingListDialog } from '../components/ShoppingListDialog'
import { ShoppingListView } from '../components/ShoppingListView'
import { ShoppingListsPage } from '../components/ShoppingListsPage'
import { Recipe, RecipeFormData, ShoppingList } from '../types/recipe'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { useState } from 'react'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { isAuthenticated, isSessionLoading } = useSession()
  const { user, isUserLoading } = useUser()
  const { logout } = useDescope()
  
  // State for showing/hiding different views
  const [showForm, setShowForm] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [scalingRecipe, setScalingRecipe] = useState<Recipe | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  
  // Shopping list states
  const [currentView, setCurrentView] = useState<'recipes' | 'shopping-lists'>('recipes')
  const [showShoppingListDialog, setShowShoppingListDialog] = useState(false)
  const [viewingShoppingList, setViewingShoppingList] = useState<ShoppingList | null>(null)

  // Try to get user ID from different possible properties
  const userId = (user as any)?.sub || (user as any)?.id || (user as any)?.userId || user?.email

  // Database queries and mutations
  const recipes = useQuery(api.recipes.getByUser, 
    isAuthenticated && userId ? { userId: userId } : "skip"
  )
  const shoppingLists = useQuery(api.recipes.getShoppingLists,
    isAuthenticated && userId ? { userId: userId } : "skip"
  )
  
  const createRecipe = useMutation(api.recipes.create)
  const updateRecipe = useMutation(api.recipes.update)
  const deleteRecipe = useMutation(api.recipes.remove)
  const toggleFavorite = useMutation(api.recipes.toggleFavorite)
  const createShoppingList = useMutation(api.recipes.createShoppingList)
  const deleteShoppingList = useMutation(api.recipes.deleteShoppingList)

  // Filter recipes based on search term, category, and favorites
  const filteredRecipes = recipes?.filter(recipe => {
    // Search filter
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.ingredients.some(ingredient => 
        ingredient.ingredient.toLowerCase().includes(searchTerm.toLowerCase())
      )
    
    // Category filter
    const matchesCategory = selectedCategory === 'all' || recipe.category === selectedCategory
    
    // Favorites filter
    const matchesFavorites = !showFavoritesOnly || (recipe.isFavorite ?? false)
    
    return matchesSearch && matchesCategory && matchesFavorites
  }) || []

  // Get unique categories from recipes
  const availableCategories = recipes ? 
    [...new Set(recipes.map(recipe => recipe.category))].sort() : []

  // Calculate stats
  const totalRecipes = recipes?.length || 0
  const favoriteRecipes = recipes?.filter(recipe => recipe.isFavorite ?? false).length || 0
  const totalCategories = recipes ? new Set(recipes.map(r => r.category)).size : 0
  const avgPrepTime = recipes ? Math.round(recipes.reduce((sum, r) => sum + r.prepTime, 0) / recipes.length) || 0 : 0

  // Show loading while checking auth
  if (isSessionLoading || isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <CardContent className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <div className="text-lg">Loading...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show login if not authenticated
  if (!isAuthenticated || !userId) {
    return <LoginPage />
  }

  // Handle saving a recipe (both new and edited)
  const handleSaveRecipe = async (recipeData: RecipeFormData) => {
    try {
      if (editingRecipe) {
        // Update existing recipe
        await updateRecipe({
          id: editingRecipe._id as any,
          ...recipeData
        })
      } else {
        // Create new recipe
        await createRecipe({
          ...recipeData,
          userId: userId
        })
      }
      setShowForm(false)
      setEditingRecipe(null)
    } catch (error) {
      console.error('Error saving recipe:', error)
      alert('Error saving recipe. Please try again.')
    }
  }

  // Handle editing a recipe
  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe)
    setShowForm(true)
  }

  // Handle deleting a recipe
  const handleDeleteRecipe = async (recipeId: string) => {
    try {
      await deleteRecipe({ id: recipeId as any })
    } catch (error) {
      console.error('Error deleting recipe:', error)
      alert('Error deleting recipe. Please try again.')
    }
  }

  // Handle toggling favorite status
  const handleToggleFavorite = async (recipeId: string) => {
    try {
      await toggleFavorite({ id: recipeId as any })
    } catch (error) {
      console.error('Error toggling favorite:', error)
      alert('Error updating favorite status. Please try again.')
    }
  }

  // Handle scaling a recipe
  const handleScaleRecipe = (recipe: Recipe) => {
    setScalingRecipe(recipe)
  }

  // Handle creating shopping list
  const handleCreateShoppingList = async (name: string, selectedRecipeIds: string[]) => {
    try {
      await createShoppingList({
        name,
        recipeIds: selectedRecipeIds as any,
        userId: userId
      })
      setShowShoppingListDialog(false)
      setCurrentView('shopping-lists')
    } catch (error) {
      console.error('Error creating shopping list:', error)
      alert('Error creating shopping list. Please try again.')
    }
  }

  // Handle deleting shopping list
  const handleDeleteShoppingList = async (listId: string) => {
    try {
      await deleteShoppingList({ id: listId as any })
      setViewingShoppingList(null)
    } catch (error) {
      console.error('Error deleting shopping list:', error)
      alert('Error deleting shopping list. Please try again.')
    }
  }

  // Handle opening form for new recipe
  const handleNewRecipe = () => {
    setEditingRecipe(null)
    setShowForm(true)
  }

  // Handle closing form
  const handleCloseForm = () => {
    setShowForm(false)
    setEditingRecipe(null)
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    setShowFavoritesOnly(false)
  }

  // Check if any filters are active
  const hasActiveFilters = searchTerm || selectedCategory !== 'all' || showFavoritesOnly

  // Show shopping lists view
  if (currentView === 'shopping-lists') {
    return (
      <>
        <ShoppingListsPage
          shoppingLists={shoppingLists || []}
          recipes={recipes || []}
          onViewList={setViewingShoppingList}
          onDeleteList={handleDeleteShoppingList}
          onCreateNew={() => setShowShoppingListDialog(true)}
          onBack={() => setCurrentView('recipes')}
        />
        
        {/* Shopping List Dialog */}
        {showShoppingListDialog && (
          <ShoppingListDialog
            recipes={recipes || []}
            onCreateList={handleCreateShoppingList}
            onClose={() => setShowShoppingListDialog(false)}
          />
        )}
        
        {/* Shopping List View */}
        {viewingShoppingList && (
          <ShoppingListView
            shoppingList={viewingShoppingList}
            recipes={recipes || []}
            onClose={() => setViewingShoppingList(null)}
            onDelete={handleDeleteShoppingList}
          />
        )}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold">My Recipe Collection</h1>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {hasActiveFilters ? filteredRecipes.length : totalRecipes} recipes
                {hasActiveFilters && filteredRecipes.length !== totalRecipes && (
                  <span className="text-xs ml-1">
                    (of {totalRecipes})
                  </span>
                )}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:block">
                Hello, {(user as any)?.name || user?.email || 'User'}! 👋
              </span>
              <Button 
                onClick={() => setCurrentView('shopping-lists')} 
                variant="outline" 
                size="sm"
              >
                🛒 Shopping Lists
              </Button>
              <Button onClick={handleNewRecipe} size="sm">
                ✨ Add Recipe
              </Button>
              <Button onClick={() => logout()} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Section */}
        <div className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{totalRecipes}</div>
                <div className="text-sm text-muted-foreground">Total Recipes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-500">{favoriteRecipes}</div>
                <div className="text-sm text-muted-foreground">Favorites ❤️</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{totalCategories}</div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{avgPrepTime}</div>
                <div className="text-sm text-muted-foreground">Avg. Prep Time (min)</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{shoppingLists?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Shopping Lists 🛒</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recipe Grid */}
        {filteredRecipes && filteredRecipes.length > 0 ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <h2 className="text-2xl font-semibold">Your Recipes</h2>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowShoppingListDialog(true)} 
                    variant="outline"
                    disabled={!recipes || recipes.length === 0}
                  >
                    🛒 Create Shopping List
                  </Button>
                  <Button onClick={handleNewRecipe} variant="outline">
                    Add Another Recipe
                  </Button>
                </div>
              </div>
              
              {/* Search and Filter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Search Bar */}
                <div className="md:col-span-6 relative">
                  <Input
                    type="text"
                    placeholder="Search recipes by name or ingredients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    🔍
                  </div>
                  {searchTerm && (
                    <Button
                      onClick={() => setSearchTerm('')}
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    >
                      ✕
                    </Button>
                  )}
                </div>

                {/* Category Filter */}
                <div className="md:col-span-3">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {availableCategories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Favorites Toggle */}
                <div className="md:col-span-2">
                  <Button
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    variant={showFavoritesOnly ? "default" : "outline"}
                    className="w-full"
                  >
                    {showFavoritesOnly ? "❤️ Favorites" : "🤍 Show Favorites"}
                  </Button>
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <div className="md:col-span-1">
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {searchTerm && (
                    <Badge variant="outline" className="gap-1">
                      Search: "{searchTerm}"
                      <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-destructive">
                        ✕
                      </button>
                    </Badge>
                  )}
                  {selectedCategory !== 'all' && (
                    <Badge variant="outline" className="gap-1">
                      Category: {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
                      <button onClick={() => setSelectedCategory('all')} className="ml-1 hover:text-destructive">
                        ✕
                      </button>
                    </Badge>
                  )}
                  {showFavoritesOnly && (
                    <Badge variant="outline" className="gap-1">
                      Favorites Only ❤️
                      <button onClick={() => setShowFavoritesOnly(false)} className="ml-1 hover:text-destructive">
                        ✕
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe: any) => (
                <RecipeCard
                  key={recipe._id}
                  recipe={recipe}
                  onEdit={handleEditRecipe}
                  onDelete={handleDeleteRecipe}
                  onToggleFavorite={handleToggleFavorite}
                  onScale={handleScaleRecipe}
                />
              ))}
            </div>
          </div>
        ) : recipes && recipes.length > 0 && hasActiveFilters ? (
          /* No Search Results */
          <div className="text-center py-12">
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8">
                <div className="text-4xl mb-4">
                  {showFavoritesOnly ? '💔' : '🔍'}
                </div>
                <h3 className="text-xl font-semibold mb-2">No recipes found</h3>
                <p className="text-muted-foreground mb-6">
                  {showFavoritesOnly 
                    ? "You haven't favorited any recipes yet. Try clicking the heart on recipes you love!"
                    : "No recipes match your current filters. Try adjusting your search or filters."
                  }
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8">
                <div className="text-6xl mb-4">🍳</div>
                <h3 className="text-xl font-semibold mb-2">No recipes yet!</h3>
                <p className="text-muted-foreground mb-6">
                  Start building your personal recipe collection by adding your first recipe.
                </p>
                <Button onClick={handleNewRecipe} size="lg" className="w-full">
                  Add Your First Recipe
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Recipe Form Modal */}
      {showForm && (
        <RecipeForm
          recipe={editingRecipe}
          onSave={handleSaveRecipe}
          onCancel={handleCloseForm}
        />
      )}

      {/* Recipe Scaling Modal */}
      {scalingRecipe && (
        <RecipeScaler
          recipe={scalingRecipe}
          onClose={() => setScalingRecipe(null)}
        />
      )}

      {/* Shopping List Dialog */}
      {showShoppingListDialog && (
        <ShoppingListDialog
          recipes={recipes || []}
          onCreateList={handleCreateShoppingList}
          onClose={() => setShowShoppingListDialog(false)}
        />
      )}
    </div>
  )
}