const DButils = require("./DButils");
const Recipe = require("./recipe");

// async function markAsFavorite(user_id, recipe_id){
//     await DButils.execQuery(`insert into FavoriteRecipes values ('${user_id}',${recipe_id})`);
// }

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


async function markAsFavorite(user_id, recipe_id) {
  await DButils.execQuery(
    `INSERT INTO FavoriteRecipes (user_id, recipe_id) VALUES (${user_id}, ${recipe_id})`
  );
}

async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from FavoriteRecipes where user_id='${user_id}'`);
    return recipes_id;
}

async function removeFavorite(user_id, recipe_id) {
  const query = `
    DELETE FROM favoriterecipes 
    WHERE user_id = ${user_id} AND recipe_id = ${recipe_id}
  `;
  await DButils.execQuery(query);
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
// Remove the old view of the same user and recipe
    console.log(`Removing old view for user ${user_id} and recipe ${recipe_id}`);
    await DButils.execQuery(`
        DELETE FROM views 
        WHERE user_id = ${user_id} AND recipe_id = ${recipe_id}
    `);
    console.log(`Adding new view for user ${user_id} and recipe ${recipe_id}`);
    // Add the new view
    await DButils.execQuery(`
        INSERT INTO views (user_id, recipe_id)
        VALUES (${user_id}, ${recipe_id})
    `);
    console.log(`View recorded for user ${user_id} and recipe ${recipe_id}`);
}



exports.recordView = recordView;
exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.getMyRecipes = getMyRecipes;
exports.createRecipe = createRecipe;
exports.getLastThreeViews = getLastThreeViews;
exports.removeFavorite = removeFavorite;
