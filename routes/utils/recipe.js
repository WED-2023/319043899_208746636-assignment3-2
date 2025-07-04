class Recipe {
  constructor(
    recipe_id,
    name,
    picture,
    timeToMake,
    popularity,
    dietCategory,
    isGlutenFree,
    created_by,
    description,
    ingredients,
    cuisine,
    dishes,
    analyzedInstructions // <-- renamed property
  ) {
    this.recipe_id = recipe_id;
    this.name = name;
    this.picture = picture;
    this.timeToMake = timeToMake;
    this.popularity = popularity;
    this.dietCategory = dietCategory;
    this.isGlutenFree = isGlutenFree;
    this.created_by = created_by;
    this.description = description;
    this.ingredients = ingredients;  
    this.cuisine = cuisine;          
    this.dishes = dishes;           
    this.analyzedInstructions = analyzedInstructions; // <-- renamed property
  }

  getDetails() {
    return {
      recipe_id: this.recipe_id,
      name: this.name,
      picture: this.picture,
      timeToMake: this.timeToMake,
      popularity: this.popularity,
      dietCategory: this.dietCategory,
      isGlutenFree: this.isGlutenFree,
      created_by: this.created_by,
      description: this.description,
      ingredients: this.ingredients,
      cuisine: this.cuisine,
      dishes: this.dishes,
      analyzedInstructions: this.analyzedInstructions, // <-- renamed property
    };
  }

  static fromDbRow(row) {
    console.log("Row from DB:", row);
    console.log("Row ingredients:", row.ingredients);
    return new Recipe(
      row.recipe_id,
      row.name,
      row.picture,
      row.timeToMake,
      row.popularity,
      row.dietCategory,
      row.isGlutenFree,
      row.created_by,
      row.description,
      row.ingredients ,
      row.cuisine,
      row.dishes,
      row.analyzedInstructions // <-- renamed property
    );
  }

  static fromSpoonacularApi(apiResponse, created_by = null) {
    // Save analyzedInstructions as is
    const analyzedInstructions = apiResponse.analyzedInstructions || null;
    return new Recipe(
      apiResponse.id,
      apiResponse.title,
      apiResponse.image,
      `${apiResponse.readyInMinutes} minutes`,
      apiResponse.aggregateLikes,          
      apiResponse.vegan ? "vegan" : apiResponse.vegetarian ? "vegetarian" : "none",
      apiResponse.glutenFree,             
      created_by,
      apiResponse.summary || "No description available",
      apiResponse.extendedIngredients ? apiResponse.extendedIngredients.map(i => i.original) : [],
    (apiResponse.cuisines && apiResponse.cuisines.length > 0) ? apiResponse.cuisines[0] : "unknown",
    (apiResponse.dishes && apiResponse.dishes.length > 0) ? apiResponse.dishes[0] : "unknown",
    analyzedInstructions // renamed property
    );
  }
}

module.exports = Recipe;
