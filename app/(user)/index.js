import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import Footer from "../../components/Footer";

import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { router } from "expo-router";

import { auth, db } from "../../configs/firebase.config";

import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

const UserHome = () => {
  const [loadingMeal, setLoadingMeal] = useState("");

  const [checkedMeals, setCheckedMeals] = useState([]);

  const [userName, setUserName] = useState("");

  const [balance, setBalance] = useState(0);

  const [meals, setMeals] = useState([]);

  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  const today = new Date().toISOString().split("T")[0];

  // ================= FETCH MEALS LIVE =================
  useEffect(() => {
    const mealsRef = collection(db, "meals");

    const unsubscribe = onSnapshot(mealsRef, (snapshot) => {
      const mealsData = [];

      snapshot.forEach((doc) => {
        mealsData.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      mealsData.sort((a, b) => a.startHour - b.startHour);

      setMeals(mealsData);
    });

    return () => unsubscribe();
  }, []);

  // ================= CHECK TIME VALIDITY =================
  const isMealAvailable = (meal) => {
    const now = new Date();

    const currentHour = now.getHours() + now.getMinutes() / 60;

    return currentHour >= meal.startHour && currentHour <= meal.endHour;
  };

  // ================= FETCH USER DATA =================
  const fetchData = async () => {
    try {
      if (!user) return;

      setUserName(user.displayName || "User");

      // ================= FETCH ATTENDANCE =================
      const attendanceRef = collection(db, "attendance");

      const attendanceQuery = query(
        attendanceRef,
        where("userId", "==", user.uid),
      );

      const attendanceSnapshot = await getDocs(attendanceQuery);

      let totalMealAmount = 0;

      const mealsTaken = [];

      attendanceSnapshot.forEach((doc) => {
        const data = doc.data();

        totalMealAmount += Number(data?.mealPrice || 0);

        if (data.date === today) {
          mealsTaken.push(data.mealType);
        }
      });

      setCheckedMeals(mealsTaken);

      // ================= FETCH PAYMENTS =================
      const paymentRef = collection(db, "payments");

      const paymentQuery = query(paymentRef, where("userId", "==", user.uid));

      const paymentSnapshot = await getDocs(paymentQuery);

      let totalPaidAmount = 0;

      paymentSnapshot.forEach((doc) => {
        const data = doc.data();

        if (data.paymentType === "due_clearance") {
          totalPaidAmount += Number(data.amountPaid || 0);
        }
      });

      // ================= FINAL BALANCE =================
      let finalBalance = totalMealAmount - totalPaidAmount;

      if (finalBalance < 0) {
        finalBalance = 0;
      }

      setBalance(finalBalance);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= CHECK IN MEAL =================
  const handleMealCheckIn = async (meal) => {
    try {
      if (!user) return;

      if (!isMealAvailable(meal)) {
        Alert.alert(
          "Meal Closed",
          `${meal.title} check-in is only available during:\n${meal.time}`,
        );

        return;
      }

      setLoadingMeal(meal.id);

      if (checkedMeals.includes(meal.id)) {
        Alert.alert(
          "Already Checked In",
          `You already marked attendance for ${meal.title}`,
        );

        return;
      }

      const attendanceId = `${user.uid}_${today}_${meal.id}`;

      // ================= SAVE ATTENDANCE =================
      await setDoc(doc(db, "attendance", attendanceId), {
        userId: user.uid,

        userName: user.displayName,

        userEmail: user.email,

        mealType: meal.id,

        mealPrice: meal.price,

        mealTitle: meal.title,

        date: today,

        createdAt: serverTimestamp(),
      });

      setCheckedMeals((prev) => [...prev, meal.id]);

      await fetchData();

      Alert.alert(
        "Meal Confirmed",
        `${meal.title} attendance marked successfully`,
      );
    } catch (error) {
      console.log(error);

      Alert.alert("Error", "Failed to mark attendance");
    } finally {
      setLoadingMeal("");
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#ec4899" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      <LinearGradient
        colors={["#fff1f2", "#ffffff", "#fdf2f8"]}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* HEADER */}
          <View className="px-6 pt-6 flex-row items-center justify-between">
            <View>
              <Text className="text-gray-500 text-base">Welcome Back 👋</Text>

              <Text className="text-3xl font-bold text-gray-900 mt-1">
                {userName}
              </Text>

              <Text className="text-pink-500 mt-2 font-medium">
                Manage your meals & attendance
              </Text>
            </View>

            <Pressable
              onPress={() => router.push("/profile")}
              className="w-14 h-14 rounded-2xl bg-pink-500 items-center justify-center"
            >
              <Ionicons name="person" size={26} color="white" />
            </Pressable>
          </View>

          {/* BALANCE CARD */}
          <LinearGradient
            colors={["#ec4899", "#f472b6"]}
            style={{
              marginHorizontal: 24,
              marginTop: 28,
              borderRadius: 28,
              padding: 24,
            }}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-pink-100 text-base">
                  Current Due Balance
                </Text>

                <Text className="text-white text-4xl font-bold mt-2">
                  ₹ {balance}
                </Text>

                <Text className="text-pink-100 mt-2">
                  Updated after payments
                </Text>
              </View>

              <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center">
                <Ionicons name="wallet" size={38} color="white" />
              </View>
            </View>
          </LinearGradient>

          {/* TODAY SUMMARY */}
          <View className="mx-6 mt-8 bg-white rounded-3xl p-5 border border-pink-100">
            <Text className="text-xl font-bold text-gray-900">
              Today's Summary
            </Text>

            <Text className="text-gray-500 mt-1">
              {checkedMeals.length} / {meals.length} meals checked in
            </Text>

            <View className="flex-row mt-5 justify-between flex-wrap gap-3">
              {meals.map((meal) => {
                const checked = checkedMeals.includes(meal.id);

                return (
                  <View
                    key={meal.id}
                    className={`w-16 h-16 rounded-2xl items-center justify-center ${
                      checked ? "bg-pink-500" : "bg-pink-50"
                    }`}
                  >
                    <MaterialCommunityIcons
                      name={meal.icon}
                      size={28}
                      color={checked ? "white" : "#ec4899"}
                    />
                  </View>
                );
              })}
            </View>
          </View>

          {/* MEAL CARDS */}
          <View className="px-6 mt-8 gap-5">
            {meals
              .filter((meal) => meal.active !== false)
              .map((meal) => {
                const checked = checkedMeals.includes(meal.id);

                const available = isMealAvailable(meal);

                return (
                  <View
                    key={meal.id}
                    className="bg-white rounded-3xl p-5 border border-pink-100"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <View className="w-16 h-16 rounded-2xl bg-pink-50 items-center justify-center">
                          <MaterialCommunityIcons
                            name={meal.icon}
                            size={30}
                            color="#ec4899"
                          />
                        </View>

                        <View className="ml-4 flex-1">
                          <Text className="text-xl font-bold text-gray-900">
                            {meal.title}
                          </Text>

                          <Text className="text-gray-500 mt-1">
                            {meal.time}
                          </Text>

                          <Text className="text-pink-500 mt-2 font-semibold">
                            ₹ {meal.price}
                          </Text>
                        </View>
                      </View>

                      {checked ? (
                        <View className="bg-green-100 px-3 py-1 rounded-full">
                          <Text className="text-green-700 font-medium">
                            Checked
                          </Text>
                        </View>
                      ) : available ? (
                        <View className="bg-blue-100 px-3 py-1 rounded-full">
                          <Text className="text-blue-700 font-medium">
                            Open
                          </Text>
                        </View>
                      ) : (
                        <View className="bg-red-100 px-3 py-1 rounded-full">
                          <Text className="text-red-700 font-medium">
                            Closed
                          </Text>
                        </View>
                      )}
                    </View>

                    <Pressable
                      disabled={
                        checked || !available || loadingMeal === meal.id
                      }
                      onPress={() => handleMealCheckIn(meal)}
                      className={`mt-5 py-4 rounded-2xl items-center ${
                        checked
                          ? "bg-green-500"
                          : available
                            ? "bg-pink-500"
                            : "bg-gray-300"
                      }`}
                    >
                      <Text className="text-white font-bold text-lg">
                        {loadingMeal === meal.id
                          ? "Processing..."
                          : checked
                            ? "Attendance Marked"
                            : available
                              ? `Check In For ${meal.title}`
                              : "Meal Time Closed"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
          </View>
          <Footer />
          <View className="h-10" />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default UserHome;
