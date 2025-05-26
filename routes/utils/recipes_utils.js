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
    let recipe = Recipe.fromSpoonacularApi(recipe_info.data);


    const externalId = -1 * Math.abs(recipe_id);
    const likesResult = await DButils.execQuery(`
        SELECT COUNT(*) AS likesCount FROM Likes WHERE recipe_id = ${externalId}
    `);
    const likesCount = likesResult[0]?.likesCount || 0;

    recipe.popularity = (recipe.popularity || 0) + likesCount;

    return recipe;
}


async function getRandomRecipes() {
    // let response =  await axios.get(`${api_domain}/random`, {
    //     params: {
    //         number: 3,
    //         apiKey: process.env.spooncular_apiKey
    //     }
    // });
    // console.log("Got random recipes response");
    // let recipes = [];
    // for (const r of response.data.recipes) {
    //     let recipe = Recipe.fromSpoonacularApi(r);

    //     // המרה ל-ID שלילי לצורך חיפוש בטבלת הלייקים המקומית
    //     const externalId = -1 * Math.abs(recipe.recipe_id);

    //     try {
    //         const likesResult = await DButils.execQuery(`
    //             SELECT COUNT(*) AS likesCount FROM Likes WHERE recipe_id = ${externalId}
    //         `);
    //         const likesCount = likesResult[0]?.likesCount || 0;

    //         // חיבור בין הפופולריות של Spoonacular ללייקים המקומיים
    //         recipe.popularity = (recipe.popularity || 0) + likesCount;
    //     } catch (error) {
    //         console.error(`Error fetching likes for recipe_id ${externalId}:`, error);
    //         recipe.popularity = recipe.popularity || 0;
    //     }

    //     recipes.push(recipe);
    // }
    // return recipes;   
    
    let response = await axios.get(`${api_domain}/random`, {
        params: {
            number: 3,
            apiKey: process.env.spooncular_apiKey
        }
    });

    console.log("Got random recipes response");

    const recipes = await Promise.all(
        response.data.recipes.map(r => getRecipeDetails(r.id))
    );

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
      if (!(await isRecipeInLocalDb(recipe.recipe_id))) {
        recipe.recipe_id = -1 * recipe.recipe_id;
      }
      const watchedResult = await DButils.execQuery(`
        SELECT * FROM views 
        WHERE user_id = ${user_id} AND recipe_id = ${recipe.recipe_id}
      `);
      if (recipe.recipe_id < 0) {
        recipe.recipe_id = -1 * recipe.recipe_id;
      }
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
      if (!(await isRecipeInLocalDb(recipe.recipe_id))) {
        recipe.recipe_id = -1 * recipe.recipe_id;
      }
      const favoriteResult = await DButils.execQuery(`
        SELECT * FROM FavoriteRecipes 
        WHERE user_id = ${user_id} AND recipe_id = ${recipe.recipe_id}
      `);
      if (recipe.recipe_id < 0) {
        recipe.recipe_id = -1 * recipe.recipe_id;
      }
      recipe['isFavorite'] = favoriteResult.length > 0;
    }
  }


  async function getRecipesPreview(recipeIds) {
  if (!recipeIds || recipeIds.length === 0) {
    return [];
  }

  console.log("Fetching recipes preview");
  const idsString = recipeIds.join(",");
  
  // Fetch recipes from the local database
  const recipes = await DButils.execQuery(`
    SELECT *
    FROM project.recipes
    WHERE recipe_id IN (${idsString})
  `);

  // Map existing recipe IDs
  const existingRecipeIds = recipes.map(recipe => recipe.recipe_id);

  // Find missing recipe IDs
  const missingRecipeIds = recipeIds.filter(id => !existingRecipeIds.includes(id));
  console.log("Missing recipe IDs:", missingRecipeIds);

  // Fetch missing recipes from Spoonacular
  const missingRecipes = await Promise.all(
    missingRecipeIds.map(async (id) => {
      try {
        const recipeDetails = await getRecipeDetails(id); // Fetch from Spoonacular
        console.log("Fetched recipe ${id} from Spoonacular");
        return recipeDetails;
      } catch (error) {
        console.error("Error fetching recipe ${id} from Spoonacular:", error);
        return null; // Skip if there's an error
      }
    })
  );

  // Filter out any null results (in case of errors)
  const validMissingRecipes = missingRecipes.filter(recipe => recipe !== null);

  // Combine local and fetched recipes
  const allRecipes = [
    ...recipes.map(recipeRow => Recipe.fromDbRow(recipeRow)), // Local recipes
    ...validMissingRecipes // Recipes fetched from Spoonacular
  ];

  return allRecipes;
}
//helper function to check if a recipe is in the local database
async function isRecipeInLocalDb(recipe_id) {
  const result = await DButils.execQuery(`SELECT 1 FROM recipes WHERE recipe_id = ${recipe_id}`);
  return result.length > 0;
}

exports.getRecipeDetails = getRecipeDetails;
module.exports = {
    getRecipeDetails,
    getRandomRecipes,
    getSearchResults,
    addFavoriteMetadata,
    addWatchedMetadata,
    getRecipesPreview,
    isRecipeInLocalDb,
};