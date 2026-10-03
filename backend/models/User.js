const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["customer", "provider", "admin"],
      default: "customer",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isApprovedByAdmin: {
      type: Boolean,
      default: true, // Customers and Admin default to true, Providers default to false upon registration
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
    otpAttempts: {
      type: Number,
      default: 0,
    },
    otpLastSent: {
      type: Date,
      default: null,
    },
    providerDetails: {
      category: { type: String, default: "" },
      experience: { type: String, default: "" },
      qualifications: { type: String, default: "" },
      nicFront: { type: String, default: "" }, // Base64 or Image URI (Required for Provider)
      nicBack: { type: String, default: "" },  // Base64 or Image URI (Required for Provider)
      certificates: [{ type: String }],         // Array of Base64 or Image URIs (Optional)
      approvalStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "approved",
      },
      rejectionReason: { type: String, default: "" },
    },
    location: {
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      district: { type: String, default: "" },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password before saving (Mongoose async pre-save hook)
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
