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
} from "react-native";
import { COLORS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

const ForgotPasswordScreen = ({ navigation }) => {
  const { forgotPassword, verifyResetOTP, resetPassword } = useAuth();

  // Step 1: Identifier input, Step 2: OTP & New Password
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSendResetOTP = async () => {
    if (!identifier.trim()) {
      setErrorMessage("Please enter your registered email or phone number.");
      return;
    }

    setErrorMessage("");
    setLoading(true);

    const result = await forgotPassword(identifier.trim());
    setLoading(false);

    if (result.success) {
      setSuccessMessage("OTP sent! Please check backend console logs.");
      setStep(2);
    } else {
      setErrorMessage(result.message || "User not found or error sending OTP");
    }
  };

  const handleResetPassword = async () => {
    if (!otp || otp.trim().length !== 6) {
      setErrorMessage("Please enter the 6-digit OTP code");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setErrorMessage("");
    setLoading(true);

    const result = await resetPassword(
      identifier.trim(),
      otp.trim(),
      newPassword
    );
    setLoading(false);

    if (result.success) {
      Alert.alert(
        "Password Reset Successful!",
        "You can now log in with your new password.",
        [
          {
            text: "Go to Login",
            onPress: () => navigation.navigate("Login"),
          },
        ]
      );
    } else {
      setErrorMessage(result.message || "Failed to reset password");
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
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>🔒</Text>
            </View>
            <Text style={styles.title}>
              {step === 1 ? "Forgot Password?" : "Create New Password"}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1
                ? "Enter your email or phone number to receive a password reset code."
                : "Enter the OTP code sent to your account and your new password."}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {successMessage ? (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            {step === 1 ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address or Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. john@example.com or +1234567890"
                    placeholderTextColor="#94A3B8"
                    value={identifier}
                    onChangeText={(text) => {
                      setIdentifier(text);
                      setErrorMessage("");
                    }}
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={styles.mainButton}
                  onPress={handleSendResetOTP}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.secondary} />
                  ) : (
                    <Text style={styles.mainButtonText}>Send Reset Code</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>6-Digit OTP Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={setOtp}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="At least 6 characters"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm New Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter new password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>

                <TouchableOpacity
                  style={styles.mainButton}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.secondary} />
                  ) : (
                    <Text style={styles.mainButtonText}>Reset Password</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Back to Login */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.backButtonText}>← Back to Login</Text>
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
    paddingTop: 40,
    paddingBottom: 32,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F4F0FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
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
  successContainer: {
    backgroundColor: "#D1FAE5",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  successText: {
    color: COLORS.success,
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
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
  mainButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  mainButtonText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: "bold",
  },
  backButton: {
    marginTop: 24,
    alignItems: "center",
  },
  backButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default ForgotPasswordScreen;
