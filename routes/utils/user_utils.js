const DButils = require("./DButils");
const Recipe = require("./recipe");

// async function markAsFavorite(user_id, recipe_id){
//     await DButils.execQuery(`insert into FavoriteRecipes values ('${user_id}',${recipe_id})`);
// }
async function markAsFavorite(user_id, recipe_id) {
  await DButils.execQuery(
    `INSERT INTO FavoriteRecipes (user_id, recipe_id) VALUES (${user_id}, ${recipe_id})`
  );
}

async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from FavoriteRecipes where user_id='${user_id}'`);
    return recipes_id;
}


async function getMyRecipes(user_id){
    console.log(`fetching ${user_id} user's recipes`);
    const result = await DButils.execQuery(`SELECT * FROM recipes WHERE created_by=${user_id}`);
    console.log(`fetched ${result.length} recipes`);
    const myrecipes = result.map(row => Recipe.fromDbRow(row));
    return myrecipes;
}

exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.getMyRecipes = getMyRecipes;
