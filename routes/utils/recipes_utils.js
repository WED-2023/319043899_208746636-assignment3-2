const axios = require("axios");
const Recipe = require("./recipe");
const api_domain = "https://api.spoonacular.com/recipes";
const DButils = require("./DButils");



/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */


async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

async function getRecipeDetails(recipe_id) {
    console.log("Attempting to get recipe detail form Spoonacular API, recipe_id:", recipe_id);
    let recipe_info = await getRecipeInformation(recipe_id);
    return Recipe.fromSpoonacularApi(recipe_info.data);
}


async function getRandomRecipes() {
    let response =  await axios.get(`${api_domain}/random`, {
        params: {
            number: 3,
            apiKey: process.env.spooncular_apiKey
        }
    });
    console.log("Got random recipes response");
    let recipes = [];
    for (const r of response.data.recipes) {
        recipes.push(Recipe.fromSpoonacularApi(r));
    }
    return recipes;   
}




async function getSearchResults(search, number = 5, cuisine, diet, intolerance) {
    try {
      console.log("Fetching search results from Spoonacular API");
      const params = {
        query: search,
        number: number,
        apiKey: process.env.spooncular_apiKey,
      };
  
      // Add optional filters
      if (cuisine) params.cuisine = cuisine;
      if (diet) params.diet = diet;
      if (intolerance) params.intolerances = intolerance;

      const response = await axios.get(`${api_domain}/complexSearch`, { params });
  
      const recipes = response.data.results.map(async (recipe) => {
        const recipeDetails = await getRecipeDetails(recipe.id);
        return recipeDetails;
      });
  
      // Wait for all recipe details to resolve
      return await Promise.all(recipes);
    } catch (error) {
      console.error("Error fetching search results:", error);
      throw error;
    }
  }


  async function addWatchedMetadata(user_id, recipes_list) {
    if (!user_id) {
        for (const recipe of recipes_list){
            recipe['isWatched'] = false;
        }
      return;
    }
    for (const recipe of recipes_list) {
      const watchedResult = await DButils.execQuery(`
        SELECT * FROM views 
        WHERE user_id = ${user_id} AND recipe_id = ${recipe.recipe_id}
      `);
      recipe['isWatched'] = watchedResult.length > 0;
    }
  }

  async function addFavoriteMetadata(user_id, recipes_list) {
    if (!user_id) {
        for (const recipe of recipes_list){
            recipe['isFavorite'] = false;
        }
      return;
    }
    for (const recipe of recipes_list) {
      const favoriteResult = await DButils.execQuery(`
        SELECT * FROM FavoriteRecipes 
        WHERE user_id = ${user_id} AND recipe_id = ${recipe.recipe_id}
      `);
      recipe['isFavorite'] = favoriteResult.length > 0;
    }
  }


  async function getRecipesPreview(recipeIds) {
  if (!recipeIds || recipeIds.length === 0) {
    return [];
  }
  console.log("1");
  const idsString = recipeIds.join(",");
  console.log("2");
  const recipes = await DButils.execQuery(`
    SELECT *
    FROM project.recipes
    WHERE recipe_id IN (${idsString})
  `);
      console.log("3");

  return recipes.map(recipeRow => Recipe.fromDbRow(recipeRow));
  
}

exports.getRecipeDetails = getRecipeDetails;
module.exports = {
    getRecipeDetails,
    getRandomRecipes,
    getSearchResults,
    addFavoriteMetadata,
    addWatchedMetadata,
    getRecipesPreview
};