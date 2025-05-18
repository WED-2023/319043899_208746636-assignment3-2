var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipes_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users").then((users) => {
      if (users.find((x) => x.user_id === req.session.user_id)) {
        req.user_id = req.session.user_id;
        next();
      }
    }).catch(err => next(err));
  } else {
    res.sendStatus(401);
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

    await user_utils.markAsFavorite(user_id,recipe_id);
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
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
    const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});

router.get("/lastViews", async (req, res) => {
  try {
    console.log("Got last views request");
    const recipes =  await recipes_utils.getLastThreeViews(req.user_id);
    if (!recipes || recipes.length === 0) {
      return res.status(404).send({ message: "No views found" });
    }
    res.send(recipes);
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
      time,
      popularity,
      diet_type,
      gluten,
      description,
    } = req.body;
    const created_by = req.user_id;
    // Validate required fields
    if (!name || !picture || !time || !popularity || !diet_type || !description) {
      return res.status(400).send({ message: "Missing required fields" });
    }

    // Insert the recipe into the database
    const result = await DButils.execQuery(`
      INSERT INTO recipes (name, picture, time, popularity, diet_type, gluten, created_by, description)
      VALUES ('${name}', '${picture}', '${time}', '${popularity}', '${diet_type}', ${gluten}, ${created_by}, '${description}')
    `);

    // Respond with success
    res.status(201).send({ message: "Recipe created successfully", recipe_id: result.insertId });
  } catch (error) {
    console.error("Error creating recipe:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

module.exports = router;
