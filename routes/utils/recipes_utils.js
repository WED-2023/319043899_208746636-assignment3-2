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


async function getLastThreeViews(user_id) {
    try {
        console.log("Fetching last 3 views for user:", user_id);
        const result = await DButils.execQuery(`
            SELECT *
            FROM views v
            JOIN recipes r ON v.recipe_id = r.recipe_id
            WHERE v.user_id = ${user_id}
            ORDER BY v.viewed_at DESC
            LIMIT 3
        `);
      console.log("Last 3 views result:", result);
      const recipes = result.map(row => Recipe.fromDbRow(row));
      return recipes;
    } catch (error) {
      console.error("Error fetching last 3 views:", error);
      throw error;
    }
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



async function getRecipesPreview(recipeIds) {
  if (!recipeIds || recipeIds.length === 0) {
    return [];
  }
    console.log("1");

  // המרת מערך לשרשרת מופרדת בפסיקים לשימוש ב-IN ב-SQL
  const idsString = recipeIds.join(",");

  // שליפת פרטים רלוונטיים מהטבלה recipes בבסיס הנתונים
      console.log("2");
  const recipes = await DButils.execQuery(`
    SELECT *
    FROM project.recipes
    WHERE recipe_id IN (${idsString})
  `);
      console.log("3");

  // אם יש לך מחלקת Recipe עם פונקציה fromDbRow, אפשר להשתמש בה להמרה
  return recipes.map(recipeRow => Recipe.fromDbRow(recipeRow));
  
}


exports.getRecipeDetails = getRecipeDetails;
module.exports = {
    getRecipeDetails,
    getRandomRecipes,
    getLastThreeViews,
    getSearchResults
    getRecipesPreview,
};