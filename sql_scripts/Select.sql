SELECT * FROM `Project`.views;

INSERT INTO views (user_id, recipe_id, viewed_at)
VALUES (5, 1, NOW());

INSERT INTO views (user_id, recipe_id, viewed_at)
VALUES (5, 2, NOW());

INSERT INTO views (user_id, recipe_id, viewed_at)
VALUES (5, 4, NOW());

SELECT v.recipe_id, r.name, r.picture, v.viewed_at
FROM views v
JOIN recipes r ON v.recipe_id = r.recipe_id
WHERE v.user_id = 5
ORDER BY v.viewed_at DESC
LIMIT 3;