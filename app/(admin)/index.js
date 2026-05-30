import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { collection, getDocs } from "firebase/firestore";

import { router } from "expo-router";

import { signOut } from "firebase/auth";

import Footer from "../../components/Footer";
import { auth, db } from "../../configs/firebase.config";

const AdminHome = () => {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalUsers: 0,

    todayMeals: 0,
    todayAmount: 0,

    monthlyMeals: 0,
    monthlyAmount: 0,

    breakfastCount: 0,
    lunchCount: 0,
    snacksCount: 0,
    dinnerCount: 0,
  });

  const today = new Date().toISOString().split("T")[0];

  const currentMonth = new Date().getMonth();

  const currentYear = new Date().getFullYear();

  // ================= LOGOUT =================
  const handleLogout = async () => {
    try {
      Alert.alert("Logout", "Are you sure you want to logout?", [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Logout",

          style: "destructive",

          onPress: async () => {
            await signOut(auth);

            router.replace("/(auth)");
          },
        },
      ]);
    } catch (error) {
      console.log(error);

      Alert.alert("Error", "Failed to logout");
    }
  };

  // ================= FETCH DASHBOARD DATA =================
  const fetchDashboardData = async () => {
    try {
      // USERS
      const usersSnapshot = await getDocs(collection(db, "users"));

      // ATTENDANCE
      const attendanceSnapshot = await getDocs(collection(db, "attendance"));

      let todayMeals = 0;
      let todayAmount = 0;

      let monthlyMeals = 0;
      let monthlyAmount = 0;

      let breakfastCount = 0;
      let lunchCount = 0;
      let snacksCount = 0;
      let dinnerCount = 0;

      attendanceSnapshot.forEach((doc) => {
        const data = doc.data();

        // TODAY STATS
        if (data.date === today) {
          todayMeals += 1;

          todayAmount += data.mealPrice || 0;
        }

        // MONTHLY STATS
        const createdDate = data.createdAt?.toDate();

        if (createdDate) {
          const month = createdDate.getMonth();

          const year = createdDate.getFullYear();

          if (month === currentMonth && year === currentYear) {
            monthlyMeals += 1;

            monthlyAmount += data.mealPrice || 0;
          }
        }

        // MEAL COUNTS
        switch (data.mealType) {
          case "breakfast":
            breakfastCount += 1;
            break;

          case "lunch":
            lunchCount += 1;
            break;

          case "snacks":
            snacksCount += 1;
            break;

          case "dinner":
            dinnerCount += 1;
            break;
        }
      });

      setStats({
        totalUsers: usersSnapshot.size,

        todayMeals,
        todayAmount,

        monthlyMeals,
        monthlyAmount,

        breakfastCount,
        lunchCount,
        snacksCount,
        dinnerCount,
      });
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const mealCards = [
    {
      title: "Breakfast",

      count: stats.breakfastCount,

      icon: "egg-fried",
    },

    {
      title: "Lunch",

      count: stats.lunchCount,

      icon: "food",
    },

    {
      title: "Snacks",

      count: stats.snacksCount,

      icon: "coffee",
    },

    {
      title: "Dinner",

      count: stats.dinnerCount,

      icon: "silverware-fork-knife",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      <LinearGradient
        colors={["#fff1f2", "#ffffff", "#fdf2f8"]}
        style={{ flex: 1 }}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#ec4899" />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* HEADER */}
            <View className="px-6 pt-6 flex-row items-center justify-between">
              <View>
                <Text className="text-gray-500 text-base">
                  Dashboard Overview
                </Text>

                <Text className="text-3xl font-bold text-gray-900 mt-1">
                  Admin Dashboard
                </Text>

                <Text className="text-pink-500 mt-2 font-medium">
                  Jay Shree Caterers Analytics
                </Text>
              </View>

              {/* LOGOUT BUTTON */}
              <TouchableOpacity
                onPress={handleLogout}
                className="w-14 h-14 rounded-2xl bg-red-50 items-center justify-center border border-red-100"
              >
                <Ionicons name="log-out-outline" size={26} color="#ef4444" />
              </TouchableOpacity>
            </View>

            {/* ACTIVE USERS CARD */}
            <LinearGradient
              colors={["#ec4899", "#f472b6"]}
              style={{
                marginHorizontal: 24,

                marginTop: 28,

                borderRadius: 28,

                padding: 24,
              }}
            >
              <TouchableOpacity
                onPress={() => router.push("/user-lists")}
                className="flex-row items-center justify-between"
              >
                <View>
                  <Text className="text-pink-100 text-base">
                    Total Active Users
                  </Text>

                  <Text className="text-white text-5xl font-bold mt-2">
                    {stats.totalUsers}
                  </Text>

                  <Text className="text-pink-100 mt-2">
                    Registered users in app
                  </Text>
                </View>

                <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center">
                  <Ionicons name="people" size={38} color="white" />
                </View>
              </TouchableOpacity>
            </LinearGradient>
            {/* REPORTS */}
            <View className="flex-row px-6 mt-5 gap-4">
              <TouchableOpacity
                onPress={() => router.push("/user-lists")}
                className="flex-1 bg-pink-500 rounded-2xl p-4 items-center"
              >
                <Ionicons name="people" size={24} color="white" />
                <Text className="text-white font-semibold mt-2">Users</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/report")}
                className="flex-1 bg-blue-500 rounded-2xl p-4 items-center"
              >
                <Ionicons name="document-text" size={24} color="white" />
                <Text className="text-white font-semibold mt-2">Reports</Text>
              </TouchableOpacity>
            </View>

            {/* TODAY STATS */}
            <View className="px-6 mt-8">
              <Text className="text-2xl font-bold text-gray-900">
                Today's Stats
              </Text>
            </View>

            <View className="flex-row px-6 mt-5 gap-4">
              <View className="flex-1 bg-white rounded-3xl p-5 border border-pink-100">
                <View className="w-14 h-14 rounded-2xl bg-pink-50 items-center justify-center">
                  <MaterialCommunityIcons
                    name="food"
                    size={28}
                    color="#ec4899"
                  />
                </View>

                <Text className="text-3xl font-bold text-gray-900 mt-5">
                  {stats.todayMeals}
                </Text>

                <Text className="text-gray-500 mt-1">Meals Today</Text>
              </View>

              <View className="flex-1 bg-white rounded-3xl p-5 border border-pink-100">
                <View className="w-14 h-14 rounded-2xl bg-pink-50 items-center justify-center">
                  <Ionicons name="wallet" size={28} color="#ec4899" />
                </View>

                <Text className="text-3xl font-bold text-gray-900 mt-5">
                  ₹ {stats.todayAmount}
                </Text>

                <Text className="text-gray-500 mt-1">Today's Amount</Text>
              </View>
            </View>

            {/* MONTHLY STATS */}
            <View className="px-6 mt-8">
              <Text className="text-2xl font-bold text-gray-900">
                Monthly Stats
              </Text>
            </View>

            <View className="flex-row px-6 mt-5 gap-4">
              <View className="flex-1 bg-white rounded-3xl p-5 border border-pink-100">
                <View className="w-14 h-14 rounded-2xl bg-pink-50 items-center justify-center">
                  <Ionicons name="calendar" size={28} color="#ec4899" />
                </View>

                <Text className="text-3xl font-bold text-gray-900 mt-5">
                  {stats.monthlyMeals}
                </Text>

                <Text className="text-gray-500 mt-1">Monthly Meals</Text>
              </View>

              <View className="flex-1 bg-white rounded-3xl p-5 border border-pink-100">
                <View className="w-14 h-14 rounded-2xl bg-pink-50 items-center justify-center">
                  <Ionicons name="cash" size={28} color="#ec4899" />
                </View>

                <Text className="text-3xl font-bold text-gray-900 mt-5">
                  ₹ {stats.monthlyAmount}
                </Text>

                <Text className="text-gray-500 mt-1">Monthly Amount</Text>
              </View>
            </View>

            {/* MEAL BREAKDOWN */}
            <View className="px-6 mt-8">
              <Text className="text-2xl font-bold text-gray-900">
                Meal Breakdown
              </Text>

              <Text className="text-gray-500 mt-1">
                Total meals consumed category wise
              </Text>
            </View>

            <View className="px-6 mt-5 gap-4">
              {mealCards.map((meal) => (
                <View
                  key={meal.title}
                  className="bg-white rounded-3xl p-5 border border-pink-100 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center">
                    <View className="w-16 h-16 rounded-2xl bg-pink-50 items-center justify-center">
                      <MaterialCommunityIcons
                        name={meal.icon}
                        size={30}
                        color="#ec4899"
                      />
                    </View>

                    <View className="ml-4">
                      <Text className="text-xl font-bold text-gray-900">
                        {meal.title}
                      </Text>

                      <Text className="text-gray-500 mt-1">
                        Total consumed meals
                      </Text>
                    </View>
                  </View>

                  <Text className="text-3xl font-bold text-pink-500">
                    {meal.count}
                  </Text>
                </View>
              ))}
            </View>

            {/* FOOTER */}
            <Footer />
            <View className="h-10" />
          </ScrollView>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

export default AdminHome;
