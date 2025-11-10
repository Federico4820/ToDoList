const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const { body } = require("express-validator");
const User = require("../models/user");
const isAuth = require("../middleware/is-auth");
const hvac = require("../middleware/handleValidationAndCleanup ");

const path = require("path");
const multer = require("multer");
const { randomUUID } = require("crypto");

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "public/images/profile");
  },
  filename: (req, file, callback) => {
    callback(null, randomUUID() + path.extname(file.originalname));
  },
});
const fileFilter = (req, file, callback) => {
  if (
    file.mimetype == "image/png" ||
    file.mimetype == "image/jpg" ||
    file.mimetype == "image/jpeg"
  ) {
    callback(null, true);
  } else {
    req.fileValidationError = "Estensione non consentita, solo: png, jpg, jpeg";
    callback(null, false);
  }
};
let upload = multer({ storage: storage, fileFilter: fileFilter });
let cpUpload = upload.single("image");

//POST /auth/register
router.post(
  "/register",
  cpUpload,
  [
    body("email")
      .exists()
      .withMessage("La mail è richiesta")
      .isEmail()
      .withMessage("Inserisci una mail valida, es: name@server.com")
      .custom((value, { req }) => {
        return User.findOne({ where: { email: value } }).then((user) => {
          if (user) {
            return Promise.reject("Email o password non valide");
          }
        });
      }),
    body("name")
      .trim()
      .not()
      .isEmpty()
      .withMessage("Name non dev'essere vuoto"),
    body("password")
      .exists()
      .withMessage("La password è richiesta")
      .trim()
      .isLength({ min: 5 })
      .withMessage("password maggiore di 5 caratteri"),
    body("verifyPassword")
      .exists()
      .withMessage("La verifica della password è richiesta")
      .trim()
      .isLength({ min: 5 })
      .withMessage("La password di verifica deve avere almeno 5 caratteri")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Le password non coincidono");
        }
        return true;
      }),
  ],
  hvac,
  authController.registerUser
);

//POST /auth/login
router.post(
  "/login",
  [
    body("email")
      .exists()
      .withMessage("La mail è richiesta")
      .isEmail()
      .trim()
      .withMessage("Inserisci una mail valida, es: name@server.com"),
    body("password").exists().withMessage("La password è richiesta").trim(),
  ],
  authController.loginUser
);

//GET /auth/me
router.get("/me", isAuth, authController.loginMe);

// DELETE /auth/delete
router.delete(
  "/delete",
  [
    body("password")
      .exists()
      .withMessage("La password è obbligatoria")
      .trim()
      .isLength({ min: 5 })
      .withMessage("La vecchia password deve avere almeno 5 caratteri"),
  ],
  isAuth,
  authController.deleteUser
);

//PUT /auth/update
router.put(
  "/update",
  [isAuth, cpUpload],
  [
    body("email")
      .optional()
      .isEmail()
      .withMessage("Inserisci una mail valida")
      .custom(async (value, { req }) => {
        const existingUser = await User.findOne({ where: { email: value } });
        if (existingUser && existingUser.id !== req.user.id) {
          throw new Error("Email non valida");
        }
      }),

    body("name").optional().trim(),

    body("password")
      .exists()
      .withMessage("La password è obbligatoria")
      .trim()
      .isLength({ min: 5 })
      .withMessage("La vecchia password deve avere almeno 5 caratteri"),

    body("newPassword")
      .optional()
      .isLength({ min: 5 })
      .withMessage("La nuova password deve avere almeno 5 caratteri"),
  ],
  hvac,
  authController.updateUser
);

module.exports = router;
