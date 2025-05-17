var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
const DButils = require("./utils/DButils");
const Recipe = require("./utils/recipe");


router.get("/", (req, res) => res.send("im here"));


/**
 * This path returns a full details of a recipe by its id
 */
router.get("/:recipeId", async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});


router.get("/random", async (req, res) => {
  try {
    console.log("Got random recipes request");
    const recipes = await recipes_utils.getRandomRecipes();
    res.send(recipes);
  } catch (error) {
    console.error("Error fetching random recipe:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/lastViews", async (req, res) => {
  try {
    console.log("Got last views request");
    const user_id = req.query.user_id;
    if (!user_id) {
      return res.status(400).send({ message: "Missing user_id in path" });
    }
    const recipes = await recipes_utils.getLastThreeViews(user_id);
    if (!recipes || recipes.length === 0) {
      return res.status(404).send({ message: "No views found" });
    }
    res.send(recipes);
  } catch (error) {
    console.error("Error fetching last views:", error);
    res.status(500).send("Internal Server Error");
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
      created_by,
      description,
    } = req.body;

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
