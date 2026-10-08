const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  getAvailability,
  updateWorkingDays,
  toggleOffDate,
  addSlot,
  removeSlot,
} = require("../controllers/providerController");

// All routes require authenticated Provider
router.use(protect);
router.use(authorizeRoles("provider"));

router.get("/availability", getAvailability);
router.put("/availability/working-days", updateWorkingDays);
router.post("/availability/toggle-off-date", toggleOffDate);
router.post("/availability/slot", addSlot);
router.delete("/availability/slot/:slotId", removeSlot);

module.exports = router;
