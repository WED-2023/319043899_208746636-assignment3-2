var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipes_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async (req, res, next) => {
  console.log("Session object:", req.session);
  console.log("Session object:", req.session.user_id);
  if (req.session && req.session.user_id) {
    console.log("User authenticated, user_id:", req.session.user_id);
    try {
      const result = await DButils.execQuery(
        `SELECT 1 FROM users WHERE user_id = ${req.session.user_id}`
      );

      if (result.length === 0) {
        return res.status(401).send({ message: "Invalid session" });
      }

      req.user_id = req.session.user_id;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    console.log("User not authenticated");
    res.status(401).send({ message: "User not authenticated" });
  }
});



/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
router.post('/favorites', async (req,res,next) => {
  try{
    console.log("Session object:", req.session);
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    if (!recipe_id) {
      return res.status(400).send({ message: "Missing recipeId in body" });
    }
    // const recipeExists = await DButils.execQuery(`SELECT recipe_id FROM recipes WHERE recipe_id = ${recipe_id}`);
    // if (recipeExists.length === 0) {
    //   return res.status(404).send({ message: "Recipe not found", success: false });
    // }

    await user_utils.markAsFavorite(user_id,recipe_id);

    await DButils.execQuery(`
      UPDATE project.recipes SET popularity = popularity + 1 WHERE recipe_id = ${recipe_id}
    `);


    res.status(200).send("The Recipe successfully saved as favorite");
    } catch(error){
      console.error("Error in /favorites:", error);
      if (error.code === 'ER_DUP_ENTRY'||error.message.includes("Duplicate entry") ) {
         res.status(409).send({ message: "This favorite recipe already exists", success: false });
      }
    next(error);
  }
})

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    let favorite_recipes = {};
    console.log("attempting to get favorite recipes");
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
        console.log("attempting for preview");

    const results = await recipes_utils.getRecipesPreview(recipes_id_array);
    if (!results || results.length === 0) {
      return res.status(404).send({ message: "No favorite recipes found" });
    }
    console.log("Got favorite recipes response from DB");

    await recipes_utils.addWatchedMetadata(user_id, results);
    for (const recipe of results) {
      recipe['isFavorite'] = true;
    } 
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});

router.delete('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    
    if (!recipe_id) {
      return res.status(400).send({ message: "Missing recipeId" });
    }

    await user_utils.removeFavorite(user_id, recipe_id);

    res.status(200).send({ message: "Recipe removed from favorites" });
  } catch (error) {
    console.error("Error in DELETE /favorites/:recipeId:", error);
    next(error);
  }

});


router.post("/lastViews", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;

    if (!recipe_id) {
      return res.status(400).send({ message: "Missing recipeId in body" });
    }

    await user_utils.recordView(user_id, recipe_id);

    res.status(201).send({ message: "View recorded successfully" });
  } catch (error) {
    console.error("Error in POST /views:", error);
    next(error);
  }
});


router.get("/lastViews", async (req, res) => {
  try {
    console.log("Got last views request");
    const recipes = await user_utils.getLastThreeViews(req.user_id);
    if (!recipes || recipes.length === 0) {
      return res.status(404).send({ message: "No views found" });
    }

    console.log("Adding metadata to last viewed recipes");

    await recipes_utils.addFavoriteMetadata(req.user_id, recipes);
    for (const recipe of recipes) {
      recipe['isWatched'] = true;
    }

    res.status(200).send(recipes); 
  } catch (error) {
    console.error("Error fetching last views:", error);
    res.status(500).send("Internal Server Error");
  }
});


router.get('/myrecipes', async (req,res) => {
  try{
    myrecipes = await user_utils.getMyRecipes(req.session.user_id);
    res.status(200).send(myrecipes);
  } catch (error) {
    if (error.status === 404) {
      res.status(404).send({ message: error.message });
    } else {
      console.error("Error fetching user's recipes:", error);
      res.status(500).send({ message: "Internal Server Error" });
    }
  }
});

router.post("/recipes", async (req, res) => {
  try {
    const {
      name,
      picture,
      timeToMake,
      dietCategory,
      isGlutenFree,
      description,
      ingredients,
      cuisine,
      dishes
    } = req.body;

    const created_by = req.user_id;

    if (
      !name || !picture || !timeToMake || !dietCategory || isGlutenFree === undefined ||
      !description || !ingredients || !cuisine || dishes === undefined
    ) {
      return res.status(400).send({ message: "Missing required fields" });
    }

    if (!Array.isArray(ingredients) || !ingredients.every(item => typeof item === "string")) {
      return res.status(400).send({ message: "Ingredients must be an array of strings" });
    }
    const result = await user_utils.createRecipe({
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
    });
    res.status(201).send({ message: "Recipe created successfully", recipe_id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' || (error.message && error.message.includes("Duplicate entry"))) {
      return res.status(409).send({ message: "This recipe already exists", success: false });
    }
    console.error("Error creating recipe:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

module.exports = router;
