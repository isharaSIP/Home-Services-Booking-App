const Availability = require("../models/Availability");
const User = require("../models/User");

const APPROVED_PROVIDER = {
  role: "provider",
  isVerified: true,
  isApprovedByAdmin: true,
  "providerDetails.approvalStatus": "approved",
};

const publicProvider = (provider) => {
  const details = provider.providerDetails || {};
  const pricing = details.pricing && typeof details.pricing === "object"
    ? { ...details.pricing }
    : null;
  if (pricing) delete pricing.bankDetails;

  return {
    id: String(provider._id),
    name: provider.name,
    category: details.category || "",
    serviceArea: details.serviceArea || "",
    price: details.pricing && details.pricing.type !== "inspection" ? details.price ?? null : null,
    priceUnit: details.priceUnit || "visit",
    pricing,
    rating: details.rating ?? null,
    reviewCount: details.reviewCount ?? 0,
    latitude: details.latitude ?? null,
    longitude: details.longitude ?? null,
    nextAvailableAt: details.nextAvailableAt ?? null,
    acceptingRequests: details.acceptingRequests !== false,
    verified: true,
    bio: details.bio || "",
    experience: details.experience || "",
  };
};

const createProviderController = (UserModel) => ({
  async list(_req, res) {
    try {
      const providers = await UserModel.find(APPROVED_PROVIDER)
        .select("name providerDetails")
        .sort({ name: 1, _id: 1 })
        .lean();
      return res.status(200).json({
        total: providers.length,
        providers: providers
          .filter((provider) => provider.providerDetails?.acceptingRequests !== false)
          .map(publicProvider),
      });
    } catch (error) {
      console.error("List Providers Error:", error);
      return res.status(503).json({ message: "Unable to load providers. Please try again." });
    }
  },

  async detail(req, res) {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ message: "Invalid provider id." });
    }
    try {
      const provider = await UserModel.findOne({
        _id: req.params.id,
        ...APPROVED_PROVIDER,
      })
        .select("name providerDetails")
        .lean();
      if (!provider) return res.status(404).json({ message: "Provider not found." });
      if (provider.providerDetails?.acceptingRequests === false) {
        return res.status(404).json({ message: "Provider not found." });
      }
      return res.status(200).json({ provider: publicProvider(provider) });
    } catch (error) {
      console.error("Get Provider Error:", error);
      return res.status(503).json({ message: "Unable to load this provider. Please try again." });
    }
  },
});

const publicController = createProviderController(User);

/**
 * @desc    Get current provider's availability data (working days, off dates, slots)
 * @route   GET /api/provider/availability
 * @access  Private (Provider)
 */
const getAvailability = async (req, res) => {
  try {
    const providerId = req.user._id;

    let availability = await Availability.findOne({ provider: providerId });

    if (!availability) {
      availability = await Availability.create({
        provider: providerId,
        workingDays: {
          0: false,
          1: true,
          2: true,
          3: true,
          4: true,
          5: true,
          6: true,
        },
        offDates: [],
        slots: [],
      });
    }

    return res.status(200).json({
      workingDays: availability.workingDays,
      offDates: availability.offDates,
      slots: availability.slots,
    });
  } catch (error) {
    console.error("Get Availability Error:", error);
    return res.status(500).json({ message: "Server error fetching availability" });
  }
};

/**
 * @desc    Update provider's working days
 * @route   PUT /api/provider/availability/working-days
 * @access  Private (Provider)
 */
const updateWorkingDays = async (req, res) => {
  try {
    const providerId = req.user._id;
    const { workingDays } = req.body;

    if (!workingDays) {
      return res.status(400).json({ message: "Working days data is required" });
    }

    let availability = await Availability.findOne({ provider: providerId });

    if (!availability) {
      availability = new Availability({ provider: providerId });
    }

    availability.workingDays = workingDays;
    await availability.save();

    return res.status(200).json({
      message: "Working days updated successfully",
      workingDays: availability.workingDays,
    });
  } catch (error) {
    console.error("Update Working Days Error:", error);
    return res.status(500).json({ message: "Server error updating working days" });
  }
};

/**
 * @desc    Toggle a date as unavailable (offDate) or available
 * @route   POST /api/provider/availability/toggle-off-date
 * @access  Private (Provider)
 */
const toggleOffDate = async (req, res) => {
  try {
    const providerId = req.user._id;
    const { dateKey } = req.body;

    if (!dateKey) {
      return res.status(400).json({ message: "Date key is required" });
    }

    let availability = await Availability.findOne({ provider: providerId });

    if (!availability) {
      availability = new Availability({ provider: providerId });
    }

    const index = availability.offDates.indexOf(dateKey);
    let isOff = false;

    if (index > -1) {
      // Remove from offDates (mark available)
      availability.offDates.splice(index, 1);
      isOff = false;
    } else {
      // Add to offDates (mark unavailable)
      availability.offDates.push(dateKey);
      isOff = true;
    }

    await availability.save();

    return res.status(200).json({
      message: isOff ? "Date marked as unavailable" : "Date marked as available",
      isOff,
      offDates: availability.offDates,
    });
  } catch (error) {
    console.error("Toggle Off Date Error:", error);
    return res.status(500).json({ message: "Server error toggling date availability" });
  }
};

/**
 * @desc    Add a new availability slot
 * @route   POST /api/provider/availability/slot
 * @access  Private (Provider)
 */
const addSlot = async (req, res) => {
  try {
    const providerId = req.user._id;
    const { dateKey, start, end, title } = req.body;

    if (!dateKey || start === undefined || end === undefined) {
      return res.status(400).json({ message: "Date, start time, and end time are required" });
    }

    let availability = await Availability.findOne({ provider: providerId });

    if (!availability) {
      availability = new Availability({ provider: providerId });
    }

    // Check for overlapping slots on the same dateKey
    const dateSlots = availability.slots.filter((s) => s.dateKey === dateKey);
    const hasConflict = dateSlots.some((s) => start < s.end && end > s.start);

    if (hasConflict) {
      return res.status(400).json({ message: "This slot overlaps with an existing slot on this date." });
    }

    const newSlot = {
      dateKey,
      start,
      end,
      title: title || "Open for bookings",
      type: "available",
      custom: true,
    };

    availability.slots.push(newSlot);
    await availability.save();

    return res.status(201).json({
      message: "Availability slot added successfully",
      slot: availability.slots[availability.slots.length - 1],
      slots: availability.slots,
    });
  } catch (error) {
    console.error("Add Slot Error:", error);
    return res.status(500).json({ message: "Server error adding slot" });
  }
};

/**
 * @desc    Remove an availability slot
 * @route   DELETE /api/provider/availability/slot/:slotId
 * @access  Private (Provider)
 */
const removeSlot = async (req, res) => {
  try {
    const providerId = req.user._id;
    const { slotId } = req.params;

    let availability = await Availability.findOne({ provider: providerId });

    if (!availability) {
      return res.status(404).json({ message: "Availability record not found" });
    }

    const slotIndex = availability.slots.findIndex((s) => s._id.toString() === slotId);

    if (slotIndex === -1) {
      return res.status(404).json({ message: "Slot not found" });
    }

    if (availability.slots[slotIndex].type === "booked") {
      return res.status(400).json({ message: "Cannot remove a booked slot." });
    }

    availability.slots.splice(slotIndex, 1);
    await availability.save();

    return res.status(200).json({
      message: "Slot removed successfully",
      slots: availability.slots,
    });
  } catch (error) {
    console.error("Remove Slot Error:", error);
    return res.status(500).json({ message: "Server error removing slot" });
  }
};

module.exports = {
  createProviderController,
  publicProvider,
  list: publicController.list,
  detail: publicController.detail,
  getAvailability,
  updateWorkingDays,
  toggleOffDate,
  addSlot,
  removeSlot,
};
