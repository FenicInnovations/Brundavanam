const express = require("express");
const router = express.Router();
const { optionalAuth } = require("../middleware/auth");
const { handleGraphQL } = require("../controllers/graphqlController");

// Mount GraphQL query and mutation handlers with optional auth
router.post("/", optionalAuth, handleGraphQL);
router.get("/", optionalAuth, handleGraphQL);

module.exports = router;
