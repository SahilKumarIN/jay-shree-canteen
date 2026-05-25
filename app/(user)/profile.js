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

import { SafeAreaView } from "react-native-safe-area-context";

import { LinearGradient } from "expo-linear-gradient";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { router } from "expo-router";

import { deleteUser, signOut, updatePassword } from "firebase/auth";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import Footer from "../../components/Footer";
import { auth, db } from "../../configs/firebase.config";

const Profile = () => {
  const [transactions, setTransactions] = useState([]);

  const [balance, setBalance] = useState(0);

  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  // ================= FETCH LIVE DATA =================
  useEffect(() => {
    if (!user) return;

    // ================= ATTENDANCE =================
    const attendanceRef = collection(db, "attendance");

    const attendanceQuery = query(
      attendanceRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
    );

    // ================= PAYMENTS =================
    const paymentsRef = collection(db, "payments");

    const paymentsQuery = query(
      paymentsRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
    );

    // ================= PAYMENT HISTORY =================
    const paymentHistoryRef = collection(db, "payment-history");

    const paymentHistoryQuery = query(
      paymentHistoryRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
    );

    let attendanceData = [];

    let paymentsData = [];

    let paymentHistoryData = [];

    // ================= CALCULATE EVERYTHING =================
    const calculateData = () => {
      // ================= TOTAL MEAL AMOUNT =================
      let totalMealAmount = 0;

      attendanceData.forEach((item) => {
        totalMealAmount += Number(item?.mealPrice || 0);
      });

      // ================= TOTAL PAID AMOUNT =================
      let totalPaidAmount = 0;

      paymentsData.forEach((item) => {
        if (
          item.paymentType === "due_clearance" ||
          item.type === "due_clearance"
        ) {
          totalPaidAmount += Number(item.amountPaid || item.amount || 0);
        }
      });

      // ================= FINAL BALANCE =================
      const finalBalance = totalMealAmount - totalPaidAmount;

      setBalance(finalBalance < 0 ? 0 : finalBalance);

      // ================= MERGE HISTORY =================
      const mergedTransactions = [
        // ================= MEALS =================
        ...attendanceData.map((item) => ({
          ...item,
          historyType: "meal",
        })),

        // ================= PAYMENTS =================
        ...paymentsData.map((item) => ({
          ...item,
          historyType: "payment",
        })),

        // ================= PRICE UPDATE HISTORY =================
        ...paymentHistoryData.map((item) => ({
          ...item,
          historyType: "price_update",
        })),
      ];

      // ================= SORT =================
      mergedTransactions.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;

        const bTime = b.createdAt?.seconds || 0;

        return bTime - aTime;
      });

      setTransactions(mergedTransactions);

      setLoading(false);
    };

    // ================= ATTENDANCE SNAPSHOT =================
    const unsubscribeAttendance = onSnapshot(attendanceQuery, (snapshot) => {
      attendanceData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      calculateData();
    });

    // ================= PAYMENTS SNAPSHOT =================
    const unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
      paymentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      calculateData();
    });

    // ================= PAYMENT HISTORY SNAPSHOT =================
    const unsubscribePaymentHistory = onSnapshot(
      paymentHistoryQuery,
      (snapshot) => {
        paymentHistoryData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        calculateData();
      },
    );

    return () => {
      unsubscribeAttendance();

      unsubscribePayments();

      unsubscribePaymentHistory();
    };
  }, []);

  // ================= LOGOUT =================
  const handleLogout = async () => {
    try {
      await signOut(auth);

      router.replace("/(auth)");
    } catch (error) {
      Alert.alert("Error", "Failed to logout");
    }
  };

  // ================= CHANGE PASSWORD =================
  const handleChangePassword = async () => {
    try {
      Alert.prompt(
        "Change Password",
        "Enter your new password",
        async (newPassword) => {
          if (!newPassword) return;

          if (newPassword.length < 6) {
            Alert.alert(
              "Invalid Password",
              "Password must be at least 6 characters",
            );

            return;
          }

          await updatePassword(user, newPassword);

          Alert.alert("Success", "Password updated successfully");
        },
        "secure-text",
      );
    } catch (error) {
      Alert.alert("Error", "Please login again");
    }
  };

  // ================= DELETE ACCOUNT =================
  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "This action is permanent and cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Delete",
          style: "destructive",

          onPress: async () => {
            try {
              if (!user) return;

              // DELETE ATTENDANCE
              const attendanceRef = collection(db, "attendance");

              const attendanceQuery = query(
                attendanceRef,
                where("userId", "==", user.uid),
              );

              const attendanceSnapshot = await getDocs(attendanceQuery);

              const deletePromises = [];

              attendanceSnapshot.forEach((attendanceDoc) => {
                deletePromises.push(
                  deleteDoc(doc(db, "attendance", attendanceDoc.id)),
                );
              });

              // DELETE PAYMENTS
              const paymentRef = collection(db, "payments");

              const paymentQuery = query(
                paymentRef,
                where("userId", "==", user.uid),
              );

              const paymentSnapshot = await getDocs(paymentQuery);

              paymentSnapshot.forEach((paymentDoc) => {
                deletePromises.push(
                  deleteDoc(doc(db, "payments", paymentDoc.id)),
                );
              });

              // DELETE PAYMENT HISTORY
              const paymentHistoryRef = collection(db, "payment-history");

              const paymentHistoryQuery = query(
                paymentHistoryRef,
                where("userId", "==", user.uid),
              );

              const paymentHistorySnapshot = await getDocs(paymentHistoryQuery);

              paymentHistorySnapshot.forEach((historyDoc) => {
                deletePromises.push(
                  deleteDoc(doc(db, "payment-history", historyDoc.id)),
                );
              });

              await Promise.all(deletePromises);

              // DELETE USER DOC
              await deleteDoc(doc(db, "users", user.uid));

              // DELETE AUTH ACCOUNT
              await deleteUser(user);

              Alert.alert(
                "Account Deleted",
                "Your account has been deleted permanently",
              );

              router.replace("/(auth)");
            } catch (error) {
              console.log(error);

              Alert.alert(
                "Failed",
                "Please login again before deleting account",
              );
            }
          },
        },
      ],
    );
  };

  // ================= GET MEAL ICON =================
  const getMealIcon = (mealType) => {
    switch (mealType) {
      case "breakfast":
        return "egg-fried";

      case "lunch":
        return "food";

      case "snacks":
        return "coffee";

      case "dinner":
        return "silverware-fork-knife";

      default:
        return "food";
    }
  };

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
            <View className="px-6 pt-6">
              <Text className="text-3xl font-bold text-gray-900">
                My Profile
              </Text>

              <Text className="text-gray-500 mt-2">
                Manage your account & transactions
              </Text>
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
                    Current Due Amount
                  </Text>

                  <Text className="text-white text-4xl font-bold mt-2">
                    ₹ {balance}
                  </Text>

                  <Text className="text-pink-100 mt-2">
                    Live updated balance
                  </Text>
                </View>

                <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center">
                  <Ionicons name="wallet" size={38} color="white" />
                </View>
              </View>
            </LinearGradient>

            {/* ACTIONS */}
            <View className="px-6 mt-8 gap-4">
              {/* CHANGE PASSWORD */}
              <Pressable
                onPress={handleChangePassword}
                className="bg-white rounded-3xl p-5 border border-pink-100 flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <View className="w-14 h-14 rounded-2xl bg-pink-50 items-center justify-center">
                    <Ionicons name="lock-closed" size={24} color="#ec4899" />
                  </View>

                  <View className="ml-4">
                    <Text className="text-lg font-bold text-gray-900">
                      Change Password
                    </Text>

                    <Text className="text-gray-500 mt-1">
                      Update your password
                    </Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
              </Pressable>

              {/* LOGOUT */}
              <Pressable
                onPress={handleLogout}
                className="bg-white rounded-3xl p-5 border border-pink-100 flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <View className="w-14 h-14 rounded-2xl bg-red-50 items-center justify-center">
                    <Ionicons name="log-out" size={24} color="#ef4444" />
                  </View>

                  <View className="ml-4">
                    <Text className="text-lg font-bold text-gray-900">
                      Logout
                    </Text>

                    <Text className="text-gray-500 mt-1">
                      Sign out from account
                    </Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
              </Pressable>

              {/* DELETE ACCOUNT */}
              <Pressable
                onPress={handleDeleteAccount}
                className="bg-white rounded-3xl p-5 border border-red-100 flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <View className="w-14 h-14 rounded-2xl bg-red-50 items-center justify-center">
                    <Ionicons name="trash" size={24} color="#ef4444" />
                  </View>

                  <View className="ml-4">
                    <Text className="text-lg font-bold text-red-500">
                      Delete Account
                    </Text>

                    <Text className="text-gray-500 mt-1">
                      Permanently remove account
                    </Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
              </Pressable>
            </View>

            {/* TRANSACTION HISTORY */}
            <View className="px-6 mt-10">
              <Text className="text-2xl font-bold text-gray-900">
                Transaction History
              </Text>

              <Text className="text-gray-500 mt-1">
                Meals + due clearances + price updates
              </Text>
            </View>

            <View className="px-6 mt-5 gap-4">
              {transactions.length === 0 ? (
                <View className="bg-white rounded-3xl p-8 border border-pink-100 items-center">
                  <Ionicons name="receipt-outline" size={50} color="#ec4899" />

                  <Text className="text-xl font-bold text-gray-900 mt-4">
                    No Transactions Yet
                  </Text>

                  <Text className="text-gray-500 mt-2 text-center">
                    Your history will appear here
                  </Text>
                </View>
              ) : (
                transactions.map((item) => {
                  // ================= DUE CLEARANCE =================
                  if (
                    item.historyType === "payment" ||
                    item.paymentType === "due_clearance" ||
                    item.type === "due_clearance"
                  ) {
                    return (
                      <View
                        key={item.id}
                        className="bg-green-50 rounded-3xl p-5 border border-green-100"
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center flex-1">
                            <View className="w-16 h-16 rounded-2xl bg-green-100 items-center justify-center">
                              <Ionicons
                                name="checkmark-done"
                                size={30}
                                color="#16a34a"
                              />
                            </View>

                            <View className="ml-4 flex-1">
                              <Text className="text-xl font-bold text-green-700">
                                Due Cleared
                              </Text>

                              <Text className="text-gray-500 mt-1">
                                Admin cleared your due amount
                              </Text>

                              <Text className="text-green-600 mt-2 font-semibold">
                                ₹ {item.amountPaid || item.amount || 0}
                              </Text>
                            </View>
                          </View>

                          <View className="bg-green-200 px-3 py-1 rounded-full">
                            <Text className="text-green-700 font-medium">
                              Paid
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  }

                  // ================= PRICE UPDATED =================
                  if (
                    item.historyType === "price_update" ||
                    item.type === "meal_amount_updated"
                  ) {
                    return (
                      <View
                        key={item.id}
                        className="bg-yellow-50 rounded-3xl p-5 border border-yellow-100"
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center flex-1">
                            <View className="w-16 h-16 rounded-2xl bg-yellow-100 items-center justify-center">
                              <Ionicons
                                name="create"
                                size={28}
                                color="#ca8a04"
                              />
                            </View>

                            <View className="ml-4 flex-1">
                              <Text className="text-xl font-bold text-yellow-700">
                                Meal Price Updated
                              </Text>

                              <Text className="text-gray-500 mt-1 capitalize">
                                {item.mealType} amount updated
                              </Text>

                              <Text className="text-yellow-700 mt-2 font-semibold">
                                ₹ {item.oldAmount} → ₹ {item.newAmount}
                              </Text>
                            </View>
                          </View>

                          <View className="bg-yellow-200 px-3 py-1 rounded-full">
                            <Text className="text-yellow-700 font-medium">
                              Updated
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  }

                  // ================= MEAL CARD =================
                  return (
                    <View
                      key={item.id}
                      className="bg-white rounded-3xl p-5 border border-pink-100"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                          <View className="w-16 h-16 rounded-2xl bg-pink-50 items-center justify-center">
                            <MaterialCommunityIcons
                              name={getMealIcon(item.mealType)}
                              size={28}
                              color="#ec4899"
                            />
                          </View>

                          <View className="ml-4 flex-1">
                            <Text className="text-xl font-bold text-gray-900 capitalize">
                              {item.mealType}
                            </Text>

                            <Text className="text-gray-500 mt-1">
                              {item.date}
                            </Text>

                            <Text className="text-pink-500 mt-2 font-semibold">
                              ₹ {item.mealPrice}
                            </Text>
                          </View>
                        </View>

                        <View className="bg-pink-100 px-3 py-1 rounded-full">
                          <Text className="text-pink-700 font-medium">
                            Meal
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
            <Footer />
            <View className="h-10" />
          </ScrollView>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

export default Profile;
