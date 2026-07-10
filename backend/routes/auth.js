const express = require("express");
const { register, login, refreshToken, logout, deleteAccount } = require("../controllers/authController");
const { registerValidator, loginValidator } = require("../validators/authValidator");
const auth = require("../middlewares/auth");

const router = express.Router();

router.post("/register", registerValidator, register);
router.post("/login", loginValidator, login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.delete("/delete-account", auth, deleteAccount);

module.exports = router;
