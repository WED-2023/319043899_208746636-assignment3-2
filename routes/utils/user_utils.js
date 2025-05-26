const DButils = require("./DButils");
const recipes_utils = require("./recipes_utils");
const Recipe = require("./recipe");



async function createRecipe(recipeData) {
  const {
    name,
    picture,
    timeToMake,
    dietCategory,
    isGlutenFree,
    created_by,
    description,
    ingredients,
    cuisine,
    dishes
  } = recipeData;

  const escape = str => str.replace(/'/g, "''");
  const ingredientsStr = JSON.stringify(ingredients).replace(/'/g, "''");

  const query = `
    INSERT INTO recipes 
    (name, picture, timeToMake, dietCategory, isGlutenFree, created_by, description, ingredients, cuisine, dishes)
    VALUES 
    ('${escape(name)}', '${escape(picture)}', '${escape(timeToMake)}', '${escape(dietCategory)}', ${isGlutenFree}, ${created_by}, '${escape(description)}', '${ingredientsStr}', '${escape(cuisine)}', ${dishes})
  `;

  return await DButils.execQuery(query);
}


async function getLastThreeViews(user_id) {
  try {
    console.log("Fetching last 3 views for user:", user_id);
    
    // Get last 3 view records
    const viewRecords = await DButils.execQuery(`
      SELECT recipe_id
      FROM views
      WHERE user_id = ${user_id}
      ORDER BY viewed_at DESC
      LIMIT 3
    `);

    const recipes = await Promise.all(
      viewRecords.map(async ({ recipe_id }) => {
        if (recipe_id > 0) {
          // Get from DB
          const dbResults = await DButils.execQuery(`
            SELECT *
            FROM recipes
            WHERE recipe_id = ${recipe_id}
          `);
          if (dbResults.length > 0) {
            return Recipe.fromDbRow(dbResults[0]);
          }
        } else {
          // Get from Spoonacular or external API
          const realId = -1 * recipe_id;
          try {
            const externalRecipe = await recipes_utils.getRecipeDetails(realId);
            return externalRecipe;
          } catch (err) {
            console.error(`Failed to fetch external recipe for ID ${realId}`, err);
            return null;
          }
        }
        return null;
      })
    );

    // Filter out failed/null results
    return recipes.filter(Boolean);
  } catch (error) {
    console.error("Error fetching last 3 views:", error);
    throw error;
  }
}


async function markAsFavorite(user_id, recipe_id) {
    // Check if the recipe exists in the recipes table
    const recipeExists = await DButils.execQuery(`
      SELECT recipe_id FROM recipes WHERE recipe_id = ${recipe_id}
    `);

    // If the recipe does not exist, set recipe_id = recipe_id * -1
    if (recipeExists.length === 0) {
      console.log(`Recipe ${recipe_id} does not exist. Setting recipe_id to ${recipe_id * -1}`);
      recipe_id = recipe_id * -1;

    await DButils.execQuery(
      `INSERT INTO FavoriteRecipes (user_id, recipe_id) VALUES (${user_id}, ${recipe_id})`
    );
    await DButils.execQuery(
      `INSERT INTO Likes (user_id, recipe_id) VALUES (${user_id}, ${recipe_id})`
    );

    }
else{
  await DButils.execQuery(
    `INSERT INTO FavoriteRecipes (user_id, recipe_id) VALUES (${user_id}, ${recipe_id})`
  );
  await DButils.execQuery(`
      UPDATE project.recipes SET popularity = popularity + 1 WHERE recipe_id = ${recipe_id}
  `);
}
}


async function getFavoriteRecipes(user_id) {
  const recipeRows = await DButils.execQuery(`
    SELECT recipe_id 
    FROM FavoriteRecipes 
    WHERE user_id = '${user_id}'
  `);

  const recipes = await Promise.all(
    recipeRows.map(async ({ recipe_id }) => {
      if (recipe_id > 0) {
        // Fetch from DB
        const dbResults = await DButils.execQuery(`
          SELECT * 
          FROM recipes 
          WHERE recipe_id = ${recipe_id}
        `);
        if (dbResults.length > 0) {
          return Recipe.fromDbRow(dbResults[0]);
        }
      } else {
        // Fetch from external API
        const realId = -1 * recipe_id;
        try {
          const externalRecipe = await recipes_utils.getRecipeDetails(realId);
          return externalRecipe;
        } catch (err) {
          console.error(`Failed to fetch recipe ${realId} from external API`, err);
          return null;
        }
      }
      return null;
    })
  );

  return recipes.filter(Boolean); // Remove nulls (failed fetches)
}

async function removeFavorite(user_id, recipe_id) {
  if (!(await recipes_utils.isRecipeInLocalDb(recipe_id))) {
    recipe_id = -1 * recipe_id;
  }
  const query = `
    DELETE FROM favoriterecipes 
    WHERE user_id = ${user_id} AND recipe_id = ${recipe_id}
  `;
  const result = await DButils.execQuery(query);

  if (result.affectedRows === 0) {
    const error = new Error("Favorite recipe not found");
    error.status = 404;
    throw error;
  }
}


async function getMyRecipes(user_id){
    console.log(`fetching ${user_id} user's recipes`);
    const result = await DButils.execQuery(`SELECT * FROM recipes WHERE created_by=${user_id}`);
    console.log(`fetched ${result.length} recipes`);
    if (result.length === 0) {
        throw { status: 404, message: "No recipes found for this user" };
    }
    const myrecipes = result.map(row => Recipe.fromDbRow(row));
    return myrecipes;
}


async function recordView(user_id, recipe_id) {
  try {
    console.log(`Checking if recipe ${recipe_id} exists in the recipes table`);

    // Check if the recipe exists in the recipes table
    const recipeExists = await DButils.execQuery(`
      SELECT recipe_id FROM recipes WHERE recipe_id = ${recipe_id}
    `);

    // If the recipe does not exist, set recipe_id = recipe_id * -1
    if (recipeExists.length === 0) {
      console.log(`Recipe ${recipe_id} does not exist. Setting recipe_id to ${recipe_id * -1}`);
      recipe_id = recipe_id * -1;
    }

    // Remove the old view of the same user and recipe
    console.log(`Removing old view for user ${user_id} and recipe ${recipe_id}`);
    await DButils.execQuery(`
      DELETE FROM views 
      WHERE user_id = ${user_id} AND recipe_id = ${recipe_id}
    `);

    // Add the new view
    console.log(`Adding new view for user ${user_id} and recipe ${recipe_id}`);
    await DButils.execQuery(`
      INSERT INTO views (user_id, recipe_id)
      VALUES (${user_id}, ${recipe_id})
    `);

    console.log(  `View recorded for user ${user_id} and recipe ${recipe_id}`);
  } catch (error) {
    console.error(`Error in recordView for user ${user_id} and recipe ${recipe_id}:`, error);
    throw error;
  }
}




exports.recordView = recordView;
exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.getMyRecipes = getMyRecipes;
exports.createRecipe = createRecipe;
exports.getLastThreeViews = getLastThreeViews;
exports.removeFavorite = removeFavorite;
