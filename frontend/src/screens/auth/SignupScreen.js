import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

const SignupScreen = ({ navigation }) => {
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("customer"); // 'customer' or 'provider'
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Provider specific details & verification documents
  const [category, setCategory] = useState("");
  const [experience, setExperience] = useState("");
  const [nicFront, setNicFront] = useState("");
  const [nicBack, setNicBack] = useState("");
  const [certificates, setCertificates] = useState([]);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const pickImage = async (target) => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          "Permission Required",
          "Permission to access photo library is required to upload verification documents!"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.4,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        const base64Str = result.assets[0].base64
          ? `data:image/jpeg;base64,${result.assets[0].base64}`
          : imageUri;

        if (target === "nicFront") {
          setNicFront(base64Str);
        } else if (target === "nicBack") {
          setNicBack(base64Str);
        } else if (target === "cert") {
          setCertificates((prev) => [...prev, base64Str]);
        }
        setErrorMessage("");
      }
    } catch (err) {
      console.error("ImagePicker Error:", err);
      Alert.alert("Image Error", "Failed to select image. Please try again.");
    }
  };

  const removeCertificate = (index) => {
    setCertificates((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!name.trim()) return "Full name is required";
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email))
      return "Please enter a valid email address";
    if (!phone.trim() || phone.trim().length < 8)
      return "Please enter a valid phone number";
    if (!password || password.length < 6)
      return "Password must be at least 6 characters long";
    if (password !== confirmPassword) return "Passwords do not match";
    if (!role) return "Please select account role";

    if (role === "provider") {
      if (!category.trim()) return "Please select or enter your service category";
      if (!nicFront) return "NIC Front Image is required for Service Providers";
      if (!nicBack) return "NIC Back Image is required for Service Providers";
    }

    if (!agreedTerms) return "You must accept the Terms & Conditions to proceed";
    return null;
  };

  const handleSignup = async () => {
    const error = validateForm();
    if (error) {
      setErrorMessage(error);
      return;
    }

    setErrorMessage("");
    setLoading(true);

    const userData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      role,
    };

    if (role === "provider") {
      userData.providerDetails = {
        category: category.trim(),
        experience: experience.trim(),
        nicFront,
        nicBack,
        certificates,
      };
    }

    const result = await register(userData);
    setLoading(false);

    if (result.success) {
      Alert.alert(
        "Account Created!",
        role === "provider"
          ? "Please verify the OTP code. Note: Your account will require Admin Review before you can log in."
          : "A 6-digit OTP verification code has been generated.",
        [
          {
            text: "Proceed to Verification",
            onPress: () =>
              navigation.navigate("OtpVerification", {
                identifier: email.trim(),
                role,
              }),
          },
        ]
      );
    } else {
      setErrorMessage(result.message || "Failed to create account");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join FixMate for seamless home services
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Role Selector */}
            <Text style={styles.label}>Select Account Type</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  role === "customer" && styles.roleCardActive,
                ]}
                onPress={() => setRole("customer")}
              >
                <Text
                  style={[
                    styles.roleTitle,
                    role === "customer" && styles.roleTitleActive,
                  ]}
                >
                  Customer
                </Text>
                <Text
                  style={[
                    styles.roleSub,
                    role === "customer" && styles.roleSubActive,
                  ]}
                >
                  Book home services
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleCard,
                  role === "provider" && styles.roleCardActive,
                ]}
                onPress={() => setRole("provider")}
              >
                <Text
                  style={[
                    styles.roleTitle,
                    role === "provider" && styles.roleTitleActive,
                  ]}
                >
                  Service Provider
                </Text>
                <Text
                  style={[
                    styles.roleSub,
                    role === "provider" && styles.roleSubActive,
                  ]}
                >
                  Offer services
                </Text>
              </TouchableOpacity>
            </View>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setErrorMessage("");
                }}
              />
            </View>

            {/* Email Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="john@example.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrorMessage("");
                }}
              />
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+1 234 567 8900"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setErrorMessage("");
                }}
              />
            </View>

            {/* Provider Verification Fields */}
            {role === "provider" && (
              <View style={styles.providerBox}>
                <Text style={styles.providerBoxTitle}>
                  🛠️ Service Provider Verification Details
                </Text>

                {/* Service Category */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Service Category *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Plumbing, Electrical, Cleaning"
                    placeholderTextColor="#94A3B8"
                    value={category}
                    onChangeText={setCategory}
                  />
                </View>

                {/* Experience */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Years of Experience</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 3 years"
                    placeholderTextColor="#94A3B8"
                    value={experience}
                    onChangeText={setExperience}
                  />
                </View>

                {/* NIC Front Image (Required) */}
                <View style={styles.docUploadGroup}>
                  <View style={styles.docHeader}>
                    <Text style={styles.label}>NIC Front Image *</Text>
                    <Text style={styles.requiredBadge}>REQUIRED</Text>
                  </View>
                  {nicFront ? (
                    <View style={styles.previewContainer}>
                      <Image
                        source={{ uri: nicFront }}
                        style={styles.imagePreview}
                      />
                      <TouchableOpacity
                        style={styles.changeImageBtn}
                        onPress={() => pickImage("nicFront")}
                      >
                        <Text style={styles.changeImageText}>Change Image</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadBtn}
                      onPress={() => pickImage("nicFront")}
                    >
                      <Text style={styles.uploadBtnIcon}>📷</Text>
                      <Text style={styles.uploadBtnText}>
                        Upload NIC Front Photo
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* NIC Back Image (Required) */}
                <View style={styles.docUploadGroup}>
                  <View style={styles.docHeader}>
                    <Text style={styles.label}>NIC Back Image *</Text>
                    <Text style={styles.requiredBadge}>REQUIRED</Text>
                  </View>
                  {nicBack ? (
                    <View style={styles.previewContainer}>
                      <Image
                        source={{ uri: nicBack }}
                        style={styles.imagePreview}
                      />
                      <TouchableOpacity
                        style={styles.changeImageBtn}
                        onPress={() => pickImage("nicBack")}
                      >
                        <Text style={styles.changeImageText}>Change Image</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadBtn}
                      onPress={() => pickImage("nicBack")}
                    >
                      <Text style={styles.uploadBtnIcon}>📷</Text>
                      <Text style={styles.uploadBtnText}>
                        Upload NIC Back Photo
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Certifications (Optional) */}
                <View style={styles.docUploadGroup}>
                  <View style={styles.docHeader}>
                    <Text style={styles.label}>Certifications & Documents</Text>
                    <Text style={styles.optionalBadge}>OPTIONAL</Text>
                  </View>
                  
                  {certificates.length > 0 && (
                    <View style={styles.certList}>
                      {certificates.map((cert, idx) => (
                        <View key={idx} style={styles.certItem}>
                          <Image
                            source={{ uri: cert }}
                            style={styles.certThumb}
                          />
                          <TouchableOpacity
                            style={styles.removeCertBtn}
                            onPress={() => removeCertificate(idx)}
                          >
                            <Text style={styles.removeCertText}>✕ Remove</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.uploadBtnSecondary}
                    onPress={() => pickImage("cert")}
                  >
                    <Text style={styles.uploadBtnIcon}>📜</Text>
                    <Text style={styles.uploadBtnTextSecondary}>
                      + Add Certificate Photo (Optional)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setErrorMessage("");
                  }}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeText}>
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setErrorMessage("");
                }}
              />
            </View>

            {/* Terms & Conditions Checkbox */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAgreedTerms(!agreedTerms)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkbox,
                  agreedTerms && styles.checkboxSelected,
                ]}
              >
                {agreedTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                I agree to the{" "}
                <Text style={styles.termsLink}>Terms & Conditions</Text> and{" "}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            {/* Create Account Button */}
            <TouchableOpacity
              style={styles.signupButton}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.secondary} />
              ) : (
                <Text style={styles.signupButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Link */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLinkText}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  headerContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  formContainer: {
    width: "100%",
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  roleContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  roleCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    borderRadius: 14,
    padding: 14,
    backgroundColor: COLORS.inputBg,
  },
  roleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: "#F4F0FF",
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  roleTitleActive: {
    color: COLORS.primary,
  },
  roleSub: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  roleSubActive: {
    color: COLORS.primary,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  providerBox: {
    backgroundColor: "#F8F7FF",
    borderWidth: 1.5,
    borderColor: "#DDD6FE",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  providerBoxTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 16,
  },
  docUploadGroup: {
    marginBottom: 18,
  },
  docHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  requiredBadge: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.error,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  optionalBadge: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.textMuted,
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 14,
  },
  uploadBtnIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  uploadBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "bold",
  },
  uploadBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    paddingVertical: 12,
  },
  uploadBtnTextSecondary: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  previewContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  imagePreview: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  changeImageBtn: {
    backgroundColor: "#F4F0FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changeImageText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "bold",
  },
  certList: {
    gap: 8,
    marginBottom: 10,
  },
  certItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  certThumb: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 10,
  },
  removeCertBtn: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeCertText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: "bold",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  eyeText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.inputBorder,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    backgroundColor: COLORS.secondary,
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: "bold",
  },
  termsText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  signupButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  signupButtonText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: "bold",
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  loginLinkText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default SignupScreen;
