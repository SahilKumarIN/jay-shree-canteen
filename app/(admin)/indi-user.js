import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { LinearGradient } from "expo-linear-gradient";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { useLocalSearchParams } from "expo-router";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import Footer from "../../components/Footer";
import { db } from "../../configs/firebase.config";

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const LOGO_URL =
  "https://res.cloudinary.com/dho0vgult/image/upload/v1780125981/jay_shree_canteen_logo_ij4dyc.png";

const reportFilters = [
  {
    id: "today",
    title: "Today",
    days: 0,
  },

  {
    id: "7days",
    title: "Last 7 Days",
    days: 7,
  },

  {
    id: "30days",
    title: "Last 30 Days",
    days: 30,
  },

  {
    id: "90days",
    title: "Last 90 Days",
    days: 90,
  },

  {
    id: "all",
    title: "All Time",
    days: null,
  },
];

const IndiUser = () => {
  const { userId } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);

  const [userData, setUserData] = useState(null);

  const [transactions, setTransactions] = useState([]);

  const [payments, setPayments] = useState([]);

  const [totalAmount, setTotalAmount] = useState(0);

  const [totalMeals, setTotalMeals] = useState(0);

  const [editingId, setEditingId] = useState("");

  const [newAmount, setNewAmount] = useState("");

  const [reportLoading, setReportLoading] = useState("");

  // ================= FETCH USER DETAILS =================
  const fetchUserDetails = async () => {
    try {
      setLoading(true);

      // USER DATA
      const userRef = doc(db, "users", userId);

      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setUserData(userSnap.data());
      }

      // ================= ATTENDANCE =================
      const attendanceRef = collection(db, "attendance");

      const attendanceQuery = query(
        attendanceRef,
        where("userId", "==", userId),
      );

      const attendanceSnapshot = await getDocs(attendanceQuery);

      const attendanceData = [];

      let totalMealAmount = 0;
      let meals = 0;

      attendanceSnapshot.forEach((doc) => {
        const data = doc.data();

        totalMealAmount += data.mealPrice || 0;

        meals += 1;

        attendanceData.push({
          id: doc.id,
          ...data,
        });
      });

      attendanceData.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
      );

      setTransactions(attendanceData);

      setTotalMeals(meals);

      // ================= PAYMENTS =================
      const paymentRef = collection(db, "payments");

      const paymentQuery = query(paymentRef, where("userId", "==", userId));

      const paymentSnapshot = await getDocs(paymentQuery);

      const paymentData = [];

      let totalPaidAmount = 0;

      paymentSnapshot.forEach((doc) => {
        const data = doc.data();

        totalPaidAmount += data.amountPaid || 0;

        paymentData.push({
          id: doc.id,
          ...data,
        });
      });

      paymentData.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
      );

      setPayments(paymentData);

      // ================= FINAL DUE =================
      const finalDue = totalMealAmount - totalPaidAmount;

      setTotalAmount(finalDue);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const generateUserReport = async (filter) => {
    try {
      setReportLoading(filter.id);

      const attendanceSnapshot = await getDocs(
        query(collection(db, "attendance"), where("userId", "==", userId)),
      );

      const paymentSnapshot = await getDocs(
        query(collection(db, "payments"), where("userId", "==", userId)),
      );

      let attendanceRows = "";
      let paymentRows = "";

      let reportMeals = 0;
      let reportAmount = 0;
      let reportPayments = 0;

      attendanceSnapshot.forEach((doc) => {
        const data = doc.data();

        const createdDate = data.createdAt?.toDate();

        let include = true;

        if (filter.days !== null && createdDate) {
          const cutoffDate = new Date();

          if (filter.days === 0) {
            cutoffDate.setHours(0, 0, 0, 0);
          } else {
            cutoffDate.setDate(cutoffDate.getDate() - filter.days);
            cutoffDate.setHours(0, 0, 0, 0);
          }

          include = createdDate >= cutoffDate;
        }

        if (!include) return;

        reportMeals++;

        reportAmount += Number(data.mealPrice || 0);

        attendanceRows += `
        <tr>
          <td>${data.date || "-"}</td>
          <td style="text-transform:capitalize">
            ${data.mealType || "-"}
          </td>
          <td>₹${data.mealPrice || 0}</td>
        </tr>
      `;
      });

      paymentSnapshot.forEach((doc) => {
        const data = doc.data();

        const createdDate = data.createdAt?.toDate();

        let include = true;

        if (filter.days !== null && createdDate) {
          const cutoffDate = new Date();

          if (filter.days === 0) {
            cutoffDate.setHours(0, 0, 0, 0);
          } else {
            cutoffDate.setDate(cutoffDate.getDate() - filter.days);
            cutoffDate.setHours(0, 0, 0, 0);
          }

          include = createdDate >= cutoffDate;
        }

        if (!include) return;

        reportPayments += Number(data.amountPaid || 0);

        paymentRows += `
        <tr>
          <td>
            ${createdDate ? createdDate.toLocaleDateString() : "-"}
          </td>
          <td>
            ${data.paymentType || "due_clearance"}
          </td>
          <td>
            ₹${data.amountPaid || 0}
          </td>
        </tr>
      `;
      });

      const html = `
      <html>
      <head>
      <style>

      *{
        box-sizing:border-box;
      }

      body{
        font-family:Arial, sans-serif;
        padding:25px;
        color:#111827;
      }

      .header{
        text-align:center;
        margin-bottom:20px;
      }

      .logo{
        width:90px;
        height:90px;
        border-radius:45px;
      }

      .title{
        font-size:28px;
        color:#ec4899;
        font-weight:bold;
        margin-top:10px;
      }

      .subtitle{
        color:#6b7280;
      }

      .summary{
        background:#fdf2f8;
        border:1px solid #fbcfe8;
        border-radius:12px;
        padding:20px;
        margin-top:20px;
      }

      .summary p{
        margin:6px 0;
      }

      .section{
        margin-top:30px;
      }

      table{
        width:100%;
        border-collapse:collapse;
        margin-top:15px;
      }

      thead{
        display:table-header-group;
      }

      tr{
        page-break-inside:avoid;
      }

      th{
        background:#ec4899;
        color:white;
        padding:10px;
        text-align:left;
      }

      td{
        border:1px solid #e5e7eb;
        padding:10px;
      }

      tr:nth-child(even){
        background:#fafafa;
      }

      .footer{
        margin-top:40px;
        text-align:center;
        color:#6b7280;
        font-size:12px;
        page-break-inside:avoid;
      }

      </style>
      </head>

      <body>

        <div class="header">
          <img src="${LOGO_URL}" class="logo" />

          <div class="title">
            JAY SHREE CATERERS
          </div>

          <div class="subtitle">
            Individual User Report
          </div>
        </div>

        <div class="summary">
          <h2>${userData?.name || "-"}</h2>

          <p>
            <strong>Email:</strong>
            ${userData?.email || "-"}
          </p>

          <p>
            <strong>Report Filter:</strong>
            ${filter.title}
          </p>

          <p>
            <strong>Total Meals:</strong>
            ${reportMeals}
          </p>

          <p>
            <strong>Meal Amount:</strong>
            ₹${reportAmount}
          </p>

          <p>
            <strong>Payments During Period:</strong>
            ₹${reportPayments}
          </p>

          <p>
            <strong>Net Amount During Period:</strong>
            ₹${reportAmount - reportPayments}
          </p>

          <p>
            <strong>Current Outstanding Due:</strong>
            ₹${totalAmount}
          </p>
        </div>

        <div class="section">
          <h2>Meal History</h2>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Meal</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>
              ${
                attendanceRows ||
                `
                  <tr>
                    <td colspan="3">
                      No meal records found
                    </td>
                  </tr>
                `
              }
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Payment History</h2>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Payment Type</th>
                <th>Amount</th>
              </tr>
            </thead>

            <tbody>
              ${
                paymentRows ||
                `
                  <tr>
                    <td colspan="3">
                      No payment records found
                    </td>
                  </tr>
                `
              }
            </tbody>
          </table>
        </div>

        <div class="footer">
          Generated by Cygnite Studios •
          Jay Shree Caterers
        </div>

      </body>
      </html>
    `;

      const { uri } = await Print.printToFileAsync({
        html,
      });

      await Sharing.shareAsync(uri);
    } catch (error) {
      console.log(error);

      Alert.alert("Error", "Failed to generate report");
    } finally {
      setReportLoading("");
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, []);

  // ================= UPDATE MEAL PRICE =================
  const handleUpdateMealAmount = async (transaction) => {
    try {
      if (!newAmount) {
        Alert.alert("Error", "Please enter amount");

        return;
      }

      const oldAmount = transaction.mealPrice || 0;

      const updatedAmount = Number(newAmount);

      await updateDoc(doc(db, "attendance", transaction.id), {
        mealPrice: updatedAmount,

        updatedAt: serverTimestamp(),

        updatedByAdmin: true,
      });

      // SAVE HISTORY
      const historyRef = doc(collection(db, "payment-history"));

      await setDoc(historyRef, {
        type: "meal_amount_updated",

        userId,

        mealType: transaction.mealType,

        oldAmount,

        newAmount: updatedAmount,

        date: transaction.date,

        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Meal amount updated successfully");

      setEditingId("");

      setNewAmount("");

      fetchUserDetails();
    } catch (error) {
      console.log(error);

      Alert.alert("Error", "Failed to update amount");
    }
  };

  // ================= CLEAR COMPLETE DUE =================
  const handleClearDue = async () => {
    try {
      Alert.alert(
        "Clear Due Amount",
        "Are you sure you want to clear all dues for this user?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },

          {
            text: "Clear",
            style: "destructive",

            onPress: async () => {
              const paymentRef = doc(collection(db, "payments"));

              await setDoc(paymentRef, {
                paymentId: paymentRef.id,

                userId,

                userName: userData?.name || "",

                userEmail: userData?.email || "",

                amountPaid: totalAmount,

                paymentType: "due_clearance",

                createdAt: serverTimestamp(),
              });

              Alert.alert(
                "Success",
                `₹ ${totalAmount} due cleared successfully`,
              );

              fetchUserDetails();
            },
          },
        ],
      );
    } catch (error) {
      console.log(error);

      Alert.alert("Error", "Failed to clear dues");
    }
  };

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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#ec4899" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      <LinearGradient
        colors={["#fff1f2", "#ffffff", "#fdf2f8"]}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <View className="px-6 pt-6">
            <Text className="text-gray-500 text-base">User Details</Text>

            <Text className="text-3xl font-bold text-gray-900 mt-1">
              {userData?.name}
            </Text>

            <Text className="text-pink-500 mt-2 font-medium">
              {userData?.email}
            </Text>
          </View>

          {/* USER CARD */}
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
                  ₹ {totalAmount}
                </Text>

                <Text className="text-pink-100 mt-2">
                  {totalMeals} meals consumed
                </Text>
              </View>

              <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center">
                <Ionicons name="person" size={38} color="white" />
              </View>
            </View>
          </LinearGradient>

          <View className="px-6 mt-8">
            <Text className="text-2xl font-bold text-gray-900">
              User Reports
            </Text>

            <Text className="text-gray-500 mt-1">
              Generate detailed reports for this user
            </Text>
          </View>

          <View className="px-6 mt-5 gap-3">
            {reportFilters.map((filter) => {
              const isLoading = reportLoading === filter.id;

              return (
                <Pressable
                  key={filter.id}
                  disabled={!!reportLoading}
                  onPress={() => generateUserReport(filter)}
                  className="bg-pink-500 rounded-2xl py-4 items-center"
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-bold">
                      Download {filter.title} Report
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* CLEAR DUE BUTTON */}
          <View className="px-6 mt-6">
            <Pressable
              onPress={handleClearDue}
              className="bg-green-500 rounded-2xl py-4 items-center"
            >
              <Text className="text-white font-bold text-lg">
                Clear Complete Due Amount
              </Text>
            </Pressable>
          </View>

          {/* STATS */}
          <View className="flex-row px-6 mt-8 gap-4">
            <View className="flex-1 bg-white rounded-3xl p-5 border border-pink-100">
              <Ionicons name="restaurant" size={28} color="#ec4899" />

              <Text className="text-3xl font-bold text-gray-900 mt-4">
                {totalMeals}
              </Text>

              <Text className="text-gray-500 mt-1">Total Meals</Text>
            </View>

            <View className="flex-1 bg-white rounded-3xl p-5 border border-pink-100">
              <Ionicons name="wallet" size={28} color="#ec4899" />

              <Text className="text-3xl font-bold text-gray-900 mt-4">
                ₹ {totalAmount}
              </Text>

              <Text className="text-gray-500 mt-1">Current Due</Text>
            </View>
          </View>

          {/* MEAL HISTORY */}
          <View className="px-6 mt-8">
            <Text className="text-2xl font-bold text-gray-900">
              Meal History
            </Text>

            <Text className="text-gray-500 mt-1">
              Admin can modify meal pricing
            </Text>
          </View>

          <View className="px-6 mt-5 gap-4">
            {transactions.map((item) => (
              <View
                key={item.id}
                className="bg-white rounded-3xl p-5 border border-pink-100"
              >
                <View className="flex-row items-center">
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

                    <Text className="text-gray-500 mt-1">{item.date}</Text>

                    <Text className="text-pink-500 mt-2 font-semibold">
                      ₹ {item.mealPrice}
                    </Text>
                  </View>
                </View>

                {/* EDIT */}
                {editingId === item.id ? (
                  <View className="mt-5">
                    <TextInput
                      placeholder="Enter new amount"
                      keyboardType="numeric"
                      value={newAmount}
                      onChangeText={setNewAmount}
                      className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-black"
                    />

                    <View className="flex-row mt-4 gap-3">
                      <Pressable
                        onPress={() => handleUpdateMealAmount(item)}
                        className="flex-1 bg-pink-500 rounded-2xl py-4 items-center"
                      >
                        <Text className="text-white font-bold">Save</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          setEditingId("");
                          setNewAmount("");
                        }}
                        className="flex-1 bg-gray-200 rounded-2xl py-4 items-center"
                      >
                        <Text className="text-black font-bold">Cancel</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => {
                      setEditingId(item.id);

                      setNewAmount(String(item.mealPrice));
                    }}
                    className="mt-5 bg-pink-500 rounded-2xl py-4 items-center"
                  >
                    <Text className="text-white font-bold">
                      Change Meal Amount
                    </Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>

          {/* PAYMENT HISTORY */}
          <View className="px-6 mt-10">
            <Text className="text-2xl font-bold text-gray-900">
              Payment History
            </Text>

            <Text className="text-gray-500 mt-1">
              Due clearance & payment records
            </Text>
          </View>

          <View className="px-6 mt-5 gap-4">
            {payments.length === 0 ? (
              <View className="bg-white rounded-3xl p-6 border border-pink-100 items-center">
                <Ionicons name="receipt-outline" size={40} color="#ec4899" />

                <Text className="text-lg font-bold text-gray-900 mt-4">
                  No Payments Yet
                </Text>

                <Text className="text-gray-500 mt-2 text-center">
                  Payment history will appear here
                </Text>
              </View>
            ) : (
              payments.map((payment) => (
                <View
                  key={payment.id}
                  className="bg-white rounded-3xl p-5 border border-green-100"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-16 h-16 rounded-2xl bg-green-50 items-center justify-center">
                        <Ionicons
                          name="checkmark-done"
                          size={30}
                          color="#22c55e"
                        />
                      </View>

                      <View className="ml-4 flex-1">
                        <Text className="text-xl font-bold text-gray-900">
                          Due Cleared
                        </Text>

                        <Text className="text-gray-500 mt-1">
                          Payment Recorded
                        </Text>

                        <Text className="text-green-600 mt-2 font-semibold">
                          ₹ {payment.amountPaid}
                        </Text>
                      </View>
                    </View>

                    <View className="bg-green-100 px-3 py-1 rounded-full">
                      <Text className="text-green-700 font-medium">Paid</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
          <Footer />
          <View className="h-10" />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default IndiUser;
