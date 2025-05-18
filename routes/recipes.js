var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
const DButils = require("./utils/DButils");
const Recipe = require("./utils/recipe");


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


router.get("/search", async (req, res) => {
  try {
    const { search, number = 5, cuisine, diet, intolerance } = req.query; 
    console.log("Got search request with query:", req.query);
    const recipes = await recipes_utils.getSearchResults(search, number, cuisine, diet, intolerance);

    // If no recipes are found, return a 404 response
    if (!recipes || recipes.length === 0) {
      return res.status(404).send({ message: "No recipes found for the given search criteria" });
    }
    res.send(recipes);
  } catch (error) {
    console.error("Error fetching search results:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});



router.get("/", (req, res) => res.send("im here"));


router.get("/:recipeId", async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});


module.exports = router;
