import { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { collection, getDocs, query, where } from "firebase/firestore";

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { db } from "../../configs/firebase.config";

const mealTypes = ["breakfast", "lunch", "snacks", "dinner", "all"];

// Replace with your hosted logo URL
const LOGO_URL =
  "https://res.cloudinary.com/dho0vgult/image/upload/v1780125981/jay_shree_canteen_logo_ij4dyc.png";

export default function ReportScreen() {
  const [loadingMeal, setLoadingMeal] = useState("");

  const [selectedFilter, setSelectedFilter] = useState("today");

  const dateFilters = [
    { label: "Today", value: "today" },
    { label: "Last 7 Days", value: "7" },
    { label: "Last 30 Days", value: "30" },
    { label: "Last 90 Days", value: "90" },
    { label: "All Time", value: "all" },
  ];

  const today = new Date().toISOString().split("T")[0];

  const generateReport = async (mealType) => {
    try {
      setLoadingMeal(mealType);

      let attendanceQuery;

      if (mealType === "all") {
        attendanceQuery = collection(db, "attendance");
      } else {
        attendanceQuery = query(
          collection(db, "attendance"),
          where("mealType", "==", mealType),
        );
      }

      const snapshot = await getDocs(attendanceQuery);

      const now = new Date();

      const filteredDocs = snapshot.docs.filter((doc) => {
        const data = doc.data();

        if (!data.date) return false;

        if (selectedFilter === "all") {
          return true;
        }

        const recordDate = new Date(data.date);

        if (selectedFilter === "today") {
          return (
            recordDate.toISOString().split("T")[0] ===
            now.toISOString().split("T")[0]
          );
        }

        const days = Number(selectedFilter);

        const fromDate = new Date();

        fromDate.setDate(now.getDate() - days);

        return recordDate >= fromDate;
      });

      let rows = "";

      let totalAmount = 0;

      filteredDocs.forEach((doc) => {
        const data = doc.data();

        totalAmount += Number(data.mealPrice || 0);

        rows += `
    <tr>
      <td>${data.userName || "-"}</td>
      <td>${data.userEmail || "-"}</td>
      <td style="text-transform:capitalize">
        ${data.mealType}
      </td>
      <td>₹${data.mealPrice}</td>
      <td>${data.date}</td>
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
        font-family:Arial,sans-serif;
        padding:25px;
        color:#1f2937;
      }

      .header{
        text-align:center;
        margin-bottom:30px;
      }

      .logo{
        width:90px;
        height:90px;
        border-radius:45px;
        object-fit:cover;
      }

      .company{
        font-size:28px;
        font-weight:bold;
        margin-top:10px;
        color:#ec4899;
      }

      .tagline{
        color:#6b7280;
        margin-top:4px;
      }

      .report-title{
        margin-top:20px;
        font-size:22px;
        font-weight:bold;
      }

      .summary{
        display:flex;
        justify-content:space-between;
        gap:15px;
        margin:25px 0;
      }

      .card{
        flex:1;
        background:#fdf2f8;
        border:1px solid #fbcfe8;
        border-radius:12px;
        padding:15px;
      }

      .card-title{
        color:#6b7280;
        font-size:12px;
      }

      .card-value{
        font-size:20px;
        font-weight:bold;
        margin-top:6px;
        color:#ec4899;
      }

      table{
        width:100%;
        border-collapse:collapse;
      }

      th{
        background:#ec4899;
        color:white;
        padding:12px;
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
        margin-top:30px;
        text-align:center;
        color:#6b7280;
        font-size:12px;
      }

      </style>
      </head>

      <body>

        <div class="header">

          <img
            src="${LOGO_URL}"
            class="logo"
          />

          <div class="company">
            JAY SHREE CATERERS
          </div>

          <div class="tagline">
            Meal Management & Attendance Report
          </div>

          <div class="report-title">
  ${mealType.toUpperCase()} REPORT
</div>

<div
  style="
    margin-top:8px;
    color:#6b7280;
    font-size:14px;
  "
>
  ${
    selectedFilter === "today"
      ? "Today"
      : selectedFilter === "all"
        ? "All Time"
        : `Last ${selectedFilter} Days`
  }
</div>

        </div>

        <div class="summary">

          <div class="card">
  <div class="card-title">
    DATE RANGE
  </div>

  <div class="card-value">
    ${
      selectedFilter === "today"
        ? "Today"
        : selectedFilter === "all"
          ? "All Time"
          : `Last ${selectedFilter} Days`
    }
  </div>
</div>

          <div class="card">
            <div class="card-title">
              TOTAL RECORDS
            </div>
            <div class="card-value">
              ${filteredDocs.length}
            </div>
          </div>

          <div class="card">
            <div class="card-title">
              TOTAL AMOUNT
            </div>
            <div class="card-value">
              ₹${totalAmount}
            </div>
          </div>

        </div>

        <table>

          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Meal</th>
              <th>Price</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>

        </table>

        <div class="footer">
          Generated by Cygnite Studios • Jay Shree Caterers
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
      setLoadingMeal("");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Text className="text-3xl font-bold mt-4">Reports</Text>

        <Text className="text-gray-500 mt-2">
          Download professionally formatted PDF reports
        </Text>
        <View className="mt-8">
          <Text className="text-lg font-bold mb-4">Select Date Range</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              {dateFilters.map((filter) => (
                <Pressable
                  key={filter.value}
                  onPress={() => setSelectedFilter(filter.value)}
                  className={`px-4 py-3 rounded-full ${
                    selectedFilter === filter.value
                      ? "bg-pink-500"
                      : "bg-pink-100"
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      selectedFilter === filter.value
                        ? "text-white"
                        : "text-pink-600"
                    }`}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
        <View className="mt-8 gap-4">
          {mealTypes.map((meal) => {
            const isLoading = loadingMeal === meal;

            return (
              <Pressable
                key={meal}
                onPress={() => generateReport(meal)}
                disabled={!!loadingMeal}
                className="bg-pink-500 rounded-2xl p-5 flex-row items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text className="text-white font-bold ml-3">
                      Generating...
                    </Text>
                  </>
                ) : (
                  <Text className="text-white text-lg font-bold">
                    Download {meal.toUpperCase()} Report
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
