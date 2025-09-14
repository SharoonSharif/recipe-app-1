import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useSession, useUser, useDescope } from '@descope/react-sdk'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Recipe, RecipeFormData, ShoppingList } from '../../types/recipe'
import { Id } from '../../../convex/_generated/dataModel'

// Import all your components
import { RecipeCard } from '../../components/RecipeCard'
import { RecipeForm } from '../../components/RecipeForm'
import { RecipeScaler } from '../../components/RecipeScaler'
import { ShoppingListDialog } from '../../components/ShoppingListDialog'
import { ShoppingListView } from '../../components/ShoppingListView'
import { ShoppingListsPage } from '../../components/ShoppingListsPage'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

export const Route = createFileRoute('/app/')({
  component: AppHome,
})

function AppHome() {
  const { isAuthenticated, isSessionLoading } = useSession()
  const { user, isUserLoading } = useUser()
  const { logout } = useDescope()

  const handleLogout = async () => {
    await logout()
  }

  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [favoriteFilter, setFavoriteFilter] = useState<boolean>(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [scalingRecipe, setScalingRecipe] = useState<Recipe | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showShoppingDialog, setShowShoppingDialog] = useState(false)
  const [viewingShoppingList, setViewingShoppingList] = useState<ShoppingList | null>(null)
  const [currentView, setCurrentView] = useState<'recipes' | 'shopping'>('recipes')

  // Convex queries and mutations
  const recipes = useQuery(api.recipes.getByUser, isAuthenticated ? {} : 'skip') || []
  const shoppingLists = useQuery(api.recipes.getShoppingLists, isAuthenticated ? {} : 'skip') || []

  const createRecipe = useMutation(api.recipes.create)
  const updateRecipe = useMutation(api.recipes.update)
  const deleteRecipe = useMutation(api.recipes.remove)
  const toggleFavorite = useMutation(api.recipes.toggleFavorite)
  const createShoppingList = useMutation(api.recipes.createShoppingList)
  const deleteShoppingList = useMutation(api.recipes.deleteShoppingList)

  // Loading states
  if (isSessionLoading || isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-4xl">🍳</div>
          <div className="text-lg font-medium">Loading your recipes...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-4xl">🔒</div>
          <div className="text-lg font-medium">Please log in to access your recipes</div>
        </div>
      </div>
    )
  }

  // Filter recipes
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.ingredients.some(ing => ing.ingredient.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = categoryFilter === 'all' || recipe.category === categoryFilter
    const matchesFavorite = !favoriteFilter || recipe.isFavorite
    
    return matchesSearch && matchesCategory && matchesFavorite
  })

  // Get unique categories
  const categories = Array.from(new Set(recipes.map(recipe => recipe.category)))

  // Event handlers
  const handleSaveRecipe = async (recipeData: RecipeFormData) => {
    try {
      if (editingRecipe) {
        await updateRecipe({
          id: editingRecipe._id,
          ...recipeData
        })
      } else {
        await createRecipe(recipeData)
      }
      setShowForm(false)
      setEditingRecipe(null)
    } catch (error) {
      console.error('Error saving recipe:', error)
      alert('Failed to save recipe. Please try again.')
    }
  }

  const handleDeleteRecipe = async (id: Id<'recipes'>) => {
    try {
      await deleteRecipe({ id })
    } catch (error) {
      console.error('Error deleting recipe:', error)
      alert('Failed to delete recipe. Please try again.')
    }
  }

  const handleToggleFavorite = async (id: Id<'recipes'>) => {
    try {
      await toggleFavorite({ id })
    } catch (error) {
      console.error('Error toggling favorite:', error)
      alert('Failed to update favorite status. Please try again.')
    }
  }

  const handleCreateShoppingList = async (name: string, selectedRecipeIds: Id<'recipes'>[]) => {
    try {
      await createShoppingList({
        name,
        recipeIds: selectedRecipeIds
      })
      setShowShoppingDialog(false)
    } catch (error) {
      console.error('Error creating shopping list:', error)
      alert('Failed to create shopping list. Please try again.')
    }
  }

  const handleDeleteShoppingList = async (id: Id<'shoppingLists'>) => {
    try {
      await deleteShoppingList({ id })
      setViewingShoppingList(null)
    } catch (error) {
      console.error('Error deleting shopping list:', error)
      alert('Failed to delete shopping list. Please try again.')
    }
  }

  // Shopping Lists View
  if (currentView === 'shopping') {
    return (
      <ShoppingListsPage
        shoppingLists={shoppingLists}
        recipes={recipes}
        onViewList={setViewingShoppingList}
        onDeleteList={handleDeleteShoppingList}
        onCreateNew={() => setShowShoppingDialog(true)}
        onBack={() => setCurrentView('recipes')}
      />
    )
  }

  // Main Recipes View
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="text-3xl">🍳</div>
              <div>
                <h1 className="text-3xl font-bold">Recipe Collection</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user?.name || user?.email || 'Chef'}!
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setCurrentView('shopping')}
                variant="outline"
                className="hidden sm:flex"
              >
                🛒 Shopping Lists ({shoppingLists.length})
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="pb-4">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>📚 {recipes.length} recipes</span>
              <span>❤️ {recipes.filter(r => r.isFavorite).length} favorites</span>
              <span>🛒 {shoppingLists.length} shopping lists</span>
              <span>📂 {categories.length} categories</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Controls */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <Input
                  placeholder="Search recipes or ingredients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Favorites Filter */}
              <Button
                onClick={() => setFavoriteFilter(!favoriteFilter)}
                variant={favoriteFilter ? "default" : "outline"}
                className="whitespace-nowrap"
              >
                {favoriteFilter ? '❤️ Favorites' : '🤍 All Recipes'}
              </Button>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => setShowShoppingDialog(true)}
                variant="outline"
                disabled={recipes.length === 0}
                className="sm:hidden"
              >
                🛒
              </Button>
              <Button onClick={() => setShowForm(true)}>
                ✨ New Recipe
              </Button>
            </div>
          </div>
          
          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {filteredRecipes.length} of {recipes.length} recipes
              {searchTerm && ` for "${searchTerm}"`}
              {categoryFilter !== 'all' && ` in ${categoryFilter}`}
              {favoriteFilter && ` (favorites only)`}
            </div>
            
            {filteredRecipes.length > 0 && (
              <Button
                onClick={() => setShowShoppingDialog(true)}
                variant="outline"
                size="sm"
                className="hidden sm:flex"
              >
                🛒 Create Shopping List
              </Button>
            )}
          </div>
        </div>

        {/* Recipes Grid */}
        {filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRecipes.map(recipe => (
              <RecipeCard
                key={recipe._id}
                recipe={recipe}
                onEdit={setEditingRecipe}
                onDelete={handleDeleteRecipe}
                onToggleFavorite={handleToggleFavorite}
                onScale={setScalingRecipe}
              />
            ))}
          </div>
        ) : (
          /* Empty States */
          <div className="text-center py-12">
            {recipes.length === 0 ? (
              /* No recipes at all */
              <Card className="max-w-md mx-auto">
                <CardContent className="p-8">
                  <div className="text-6xl mb-4">👨‍🍳</div>
                  <h3 className="text-xl font-semibold mb-2">Ready to start cooking?</h3>
                  <p className="text-muted-foreground mb-6">
                    Add your first recipe to get started with your personal collection.
                  </p>
                  <Button onClick={() => setShowForm(true)} size="lg" className="w-full">
                    Add Your First Recipe
                  </Button>
                </CardContent>
              </Card>
            ) : (
              /* No results from filtering */
              <Card className="max-w-md mx-auto">
                <CardContent className="p-8">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibial mb-2">No recipes found</h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your search terms or filters.
                  </p>
                  <div className="space-y-2">
                    <Button
                      onClick={() => {
                        setSearchTerm('')
                        setCategoryFilter('all')
                        setFavoriteFilter(false)
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Clear All Filters
                    </Button>
                    <Button onClick={() => setShowForm(true)} className="w-full">
                      Add New Recipe Instead
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {(showForm || editingRecipe) && (
        <RecipeForm
          recipe={editingRecipe}
          onSave={handleSaveRecipe}
          onCancel={() => {
            setShowForm(false)
            setEditingRecipe(null)
          }}
        />
      )}

      {scalingRecipe && (
        <RecipeScaler
          recipe={scalingRecipe}
          onClose={() => setScalingRecipe(null)}
        />
      )}

      {showShoppingDialog && (
        <ShoppingListDialog
          recipes={recipes}
          onCreateList={handleCreateShoppingList}
          onClose={() => setShowShoppingDialog(false)}
        />
      )}

      {viewingShoppingList && (
        <ShoppingListView
          shoppingList={viewingShoppingList}
          recipes={recipes}
          onClose={() => setViewingShoppingList(null)}
          onDelete={handleDeleteShoppingList}
        />
      )}
    </div>
  )
}
