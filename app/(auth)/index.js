import { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

import { router } from "expo-router";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

import { doc, getDoc, setDoc } from "firebase/firestore";

import Footer from "../../components/Footer";
import { auth, db } from "../../configs/firebase.config";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    try {
      setLoading(true);

      // ================= LOGIN =================
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );

        // Fetch user role from Firestore
        const userRef = doc(db, "users", userCredential.user.uid);

        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();

          Alert.alert("Success", "Logged in successfully");

          // Redirect Based On Role
          if (userData?.role === "admin") {
            router.replace("/(admin)");
          } else {
            router.replace("/(user)");
          }
        } else {
          Alert.alert("Error", "User data not found");
        }
      }

      // ================= REGISTER =================
      else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );

        // Update Firebase Auth Profile
        await updateProfile(userCredential.user, {
          displayName: name,
        });

        // Store User Data In Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          name,
          email,
          role: "user",
          createdAt: new Date(),
        });

        Alert.alert("Success", "Account created successfully");

        // Redirect New User
        router.replace("/(user)");
      }
    } catch (error) {
      Alert.alert(
        "Authentication Error",
        error?.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

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

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <View className="flex-1 items-center justify-center px-6">
            {/* Logo */}
            <View
              style={{
                elevation: 8,
                shadowColor: "#ec4899",
                shadowOffset: {
                  width: 0,
                  height: 8,
                },
                shadowOpacity: 0.2,
                shadowRadius: 12,
              }}
              className="bg-white p-4 rounded-3xl border border-pink-100"
            >
              <Image
                source={require("../../assets/images/new_icon.png")}
                style={{
                  width: 120,
                  height: 120,
                }}
                resizeMode="contain"
              />
            </View>

            {/* Heading */}
            <View className="items-center mt-6">
              <Text className="text-3xl font-bold text-gray-900">
                Welcome to
              </Text>

              <Text className="text-4xl font-bold text-pink-500 mt-1">
                {"Jay Shree Caterer"}
              </Text>

              <Text className="text-gray-500 mt-3 text-center">
                Delicious Food • Premium Service
              </Text>
            </View>

            {/* Form Card */}
            <View className="w-full mt-10 bg-white rounded-3xl p-6 border border-pink-100">
              {/* Name */}
              {!isLogin && (
                <View className="mb-4">
                  <Text className="text-gray-700 mb-2 font-medium">
                    Full Name
                  </Text>

                  <TextInput
                    placeholder="Enter your name"
                    placeholderTextColor="#9ca3af"
                    value={name}
                    onChangeText={setName}
                    className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-black"
                  />
                </View>
              )}

              {/* Email */}
              <View className="mb-4">
                <Text className="text-gray-700 mb-2 font-medium">Email</Text>

                <TextInput
                  placeholder="Enter your email"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-black"
                />
              </View>

              {/* Password */}
              <View className="mb-6">
                <Text className="text-gray-700 mb-2 font-medium">Password</Text>

                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-black"
                />
              </View>

              {/* Button */}
              <Pressable
                disabled={loading}
                onPress={handleAuth}
                className="bg-pink-500 rounded-2xl py-4 items-center"
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">
                    {isLogin ? "Sign In" : "Create Account"}
                  </Text>
                )}
              </Pressable>

              {/* Toggle Auth */}
              <Pressable onPress={() => setIsLogin(!isLogin)} className="mt-6">
                <Text className="text-center text-gray-600">
                  {isLogin
                    ? "Don't have an account? "
                    : "Already have an account? "}

                  <Text className="text-pink-500 font-bold">
                    {isLogin ? "Sign Up" : "Sign In"}
                  </Text>
                </Text>
              </Pressable>
            </View>

            {/* Footer */}
            <View className="absolute bottom-10">
              {/* <Text className="text-gray-400 text-sm text-center">
                Owned & Managed by Ashok Sharma
              </Text> */}
            </View>
          </View>
          <Footer />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default AuthPage;
