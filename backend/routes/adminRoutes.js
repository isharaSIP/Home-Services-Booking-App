const express = require("express");
const router = express.Router();
const { getProviders, verifyProvider } = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// All admin routes require JWT authentication and Admin role
router.use(protect);
router.use(authorizeRoles("admin"));

router.get("/providers", getProviders);
router.put("/verify-provider/:id", verifyProvider);

module.exports = router;
