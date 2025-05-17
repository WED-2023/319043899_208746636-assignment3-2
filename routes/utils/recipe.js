var express = require("express");
class Recipe {
    constructor(recipe_id, name, picture, time, popularity, diet_type, gluten, created_by, description) {
      this.recipe_id = recipe_id; 
      this.name = name; 
      this.picture = picture;
      this.time = time; 
      this.popularity = popularity; 
      this.diet_type = diet_type;
      this.gluten = gluten;
      this.created_by = created_by; 
      this.description = description;
    }
  
    // Method to display recipe details
    getDetails() {
      return {
        recipe_id: this.recipe_id,
        name: this.name,
        picture: this.picture,
        time: this.time,
        popularity: this.popularity,
        diet_type: this.diet_type,
        gluten: this.gluten,
        created_by: this.created_by,
        description: this.description,
      };
    }
  
    static fromDbRow(row) {
      return new Recipe(
        row.recipe_id,
        row.name,
        row.picture,
        row.time,
        row.popularity,
        row.diet_type,
        row.gluten,
        row.created_by,
        row.description
      );
    }

    static fromSpoonacularApi(apiResponse, created_by = null) {
        return new Recipe(
          apiResponse.id,
          apiResponse.title,
          apiResponse.image,
          `${apiResponse.readyInMinutes} minutes`,
          apiResponse.spoonacularScore.toString(),
          apiResponse.vegan ? "vegan" : apiResponse.vegetarian ? "vegetarian" : "none",
          !apiResponse.glutenFree, 
          created_by, 
          apiResponse.summary || "No description available"
        );
      }
  }
  
  module.exports = Recipe;