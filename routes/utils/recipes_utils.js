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
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;

    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
        
    }
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
    //   const recipes = result.map(row => Recipe.fromDbRow(row));
      return result;
    } catch (error) {
      console.error("Error fetching last 3 views:", error);
      throw error;
    }
}

exports.getRecipeDetails = getRecipeDetails;
module.exports = {
    getRecipeDetails,
    getRandomRecipes,
    getLastThreeViews
};