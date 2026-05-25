import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Image, StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import Footer from "@/components/Footer";
import { auth, db } from "../configs/firebase.config";

export default function Index() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        // User not logged in
        if (!firebaseUser) {
          router.replace("/(auth)");
          return;
        }

        // Fetch user role from Firestore
        const userRef = doc(db, "users", firebaseUser.uid);

        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();

          // Admin User
          if (userData?.role === "admin") {
            router.replace("/(admin)");
          } else {
            // Normal User
            router.replace("/(user)");
          }
        } else {
          // If no user document exists
          router.replace("/(auth)");
        }
      } catch (error) {
        console.log("Auth Redirect Error:", error);
        router.replace("/(auth)");
      }
    });

    return unsubscribe;
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      <LinearGradient
        colors={["#fff1f2", "#ffffff", "#fdf2f8"]}
        style={{ flex: 1 }}
      >
        {/* Background Shapes */}
        <View className="absolute top-0 left-0 w-40 h-40 rounded-full bg-pink-100 opacity-40" />

        <View className="absolute top-20 right-0 w-52 h-52 rounded-full bg-rose-100 opacity-30" />

        <View className="flex-1 items-center justify-center px-6">
          {/* Logo */}
          <View
            style={{
              elevation: 8,
              shadowColor: "#ec4899",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
            }}
            className="bg-white p-5 rounded-3xl border border-pink-100"
          >
            <Image
              source={require("../assets/images/new_icon.png")}
              style={{
                width: 200,
                height: 200,
              }}
              resizeMode="contain"
            />
          </View>

          {/* App Name */}
          <View className="items-center mt-8">
            <Text className="text-4xl font-bold text-gray-900">Jay Shree</Text>

            <Text className="text-4xl font-bold text-pink-500 mt-1">
              Caterers
            </Text>

            <View className="w-24 h-1 bg-pink-400 rounded-full mt-4" />
          </View>

          {/* Owner */}
          <View className="mt-8 bg-white px-6 py-4 rounded-3xl border border-gray-100">
            <Text className="text-gray-500 text-center">
              Owned & Managed by
            </Text>

            <Text className="text-2xl font-bold text-gray-900 text-center mt-1">
              Ashok Sharma
            </Text>
          </View>

          {/* Loader */}
          <View className="mt-10 items-center">
            <ActivityIndicator size="large" color="#ec4899" />

            <Text className="text-gray-500 mt-3">
              Preparing your experience...
            </Text>
          </View>

          {/* Footer */}
          <View className="absolute bottom-12">
            <Text className="text-gray-400 text-sm text-center">
              Delicious Food • Premium Service
            </Text>
          </View>
          <Footer />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
