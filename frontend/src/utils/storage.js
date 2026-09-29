import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

export const setSecureItem = async (key, value) => {
  try {
    if (isWeb) {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    console.error(`Error saving secure item ${key}:`, error);
  }
};

export const getSecureItem = async (key) => {
  try {
    if (isWeb) {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  } catch (error) {
    console.error(`Error fetching secure item ${key}:`, error);
    return null;
  }
};

export const deleteSecureItem = async (key) => {
  try {
    if (isWeb) {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.error(`Error deleting secure item ${key}:`, error);
  }
};
