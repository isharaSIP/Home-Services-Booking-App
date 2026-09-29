import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { COLORS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

const SplashScreen = ({ navigation }) => {
  const { isAuthenticated, userRole, isLoading } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoading) {
        if (isAuthenticated && userRole) {
          // Navigate to appropriate role navigator
          if (userRole === "customer") {
            navigation.replace("CustomerNavigator");
          } else if (userRole === "provider") {
            navigation.replace("ProviderNavigator");
          } else if (userRole === "admin") {
            navigation.replace("AdminNavigator");
          } else {
            navigation.replace("Login");
          }
        } else {
          navigation.replace("Login");
        }
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, userRole]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Brand Icon / Logo Placeholder */}
      <View style={styles.logoBadge}>
        <Text style={styles.logoBadgeText}>FM</Text>
      </View>

      <Text style={styles.appName}>FixMate</Text>
      <Text style={styles.tagline}>Trusted Services, Right at Your Door</Text>

      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>

      <Text style={styles.footerText}>Version 1.0.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoBadge: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  logoBadgeText: {
    fontSize: 38,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 1,
  },
  appName: {
    fontSize: 42,
    fontWeight: "bold",
    color: COLORS.secondary,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 40,
    fontWeight: "500",
  },
  loaderContainer: {
    position: "absolute",
    bottom: 80,
  },
  footerText: {
    position: "absolute",
    bottom: 30,
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
  },
});

export default SplashScreen;
