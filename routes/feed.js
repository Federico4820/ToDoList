const express = require("express");
const router = express.Router();
const feedController = require("../controllers/feed");
const { body } = require("express-validator");
const isAuth = require("../middleware/is-auth");

//POST /feed/postIt
router.post(
  "/postIt",
  isAuth,
  [
    body("content")
      .exists()
      .withMessage("Il contenuto è richiesto")
      .bail()
      .trim()
      .isLength({ min: 3 })
      .withMessage("Il contenuto deve avere almeno 3 caratteri"),

    body("color")
      .exists()
      .withMessage("Il colore è richiesto")
      .bail()
      .isIn(["red", "yellow", "green", "orange", "blue", "purple"])
      .withMessage("Colore non valido"),
  ],
  feedController.createPostIt
);

//PUT /feed/postIt/:id
router.put(
  "/postIt/:id",
  isAuth,
  [
    body("content")
      .exists()
      .withMessage("Il contenuto è richiesto")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Contenuto mggiore di 3 caratteri"),
  ],
  feedController.editPostIt
);

//DELETE /feed/postIt/:id
router.delete("/postIt/:id", isAuth, feedController.deletePostIt);

//GET /feed/postsIt/me
router.get("/postsIt/my", isAuth, feedController.getPostsIt);

module.exports = router;
