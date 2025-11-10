const { validationResult } = require("express-validator");
const fs = require("fs");
const path = require("path");

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file) {
      const filePath = path.join(__dirname, "..", req.file.path);
      fs.unlink(filePath, (err) => {
        if (err)
          console.warn(
            "Errore nella rimozione del file temporaneo:",
            err.message
          );
      });
    }

    return res.status(422).json({
      message: "Errore nei campi di input",
      errors: errors.array(),
    });
  }

  next();
};
