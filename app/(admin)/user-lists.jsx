import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { LinearGradient } from "expo-linear-gradient";

import { Ionicons } from "@expo/vector-icons";

import { router } from "expo-router";

import { collection, getDocs } from "firebase/firestore";

import Footer from "@/components/Footer";
import { db } from "../../configs/firebase.config";

const UserLists = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  // ================= FETCH USERS =================
  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));

      const usersData = [];

      usersSnapshot.forEach((doc) => {
        usersData.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ================= SEARCH =================
  useEffect(() => {
    if (!search.trim()) {
      setFilteredUsers(users);

      return;
    }

    const filtered = users.filter((item) =>
      item.name?.toLowerCase().includes(search.toLowerCase()),
    );

    setFilteredUsers(filtered);
  }, [search, users]);

  const renderUser = ({ item }) => {
    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/(admin)/indi-user",
            params: {
              userId: item.uid,
            },
          })
        }
        className="bg-white rounded-3xl p-5 border border-pink-100 mb-4"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-16 h-16 rounded-2xl bg-pink-50 items-center justify-center">
              <Ionicons name="person" size={30} color="#ec4899" />
            </View>

            <View className="ml-4 flex-1">
              <Text className="text-xl font-bold text-gray-900">
                {item.name}
              </Text>

              <Text className="text-gray-500 mt-1">{item.email}</Text>

              <View className="flex-row items-center mt-2">
                <View className="bg-pink-100 px-3 py-1 rounded-full">
                  <Text className="text-pink-600 font-medium capitalize">
                    {item.role}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      <LinearGradient
        colors={["#fff1f2", "#ffffff", "#fdf2f8"]}
        style={{ flex: 1 }}
      >
        {/* HEADER */}
        <View className="px-6 pt-6">
          <Text className="text-gray-500 text-base">Platform Users</Text>

          <Text className="text-3xl font-bold text-gray-900 mt-1">
            User Management
          </Text>

          <Text className="text-pink-500 mt-2 font-medium">
            Manage all registered users
          </Text>
        </View>

        {/* SEARCH */}
        <View className="px-6 mt-6">
          <View className="bg-white rounded-2xl border border-pink-100 flex-row items-center px-4">
            <Ionicons name="search" size={20} color="#9ca3af" />

            <TextInput
              placeholder="Search users..."
              value={search}
              onChangeText={setSearch}
              className="flex-1 px-3 py-4 text-black"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* USERS */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#ec4899" />
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            renderItem={renderUser}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              padding: 24,
              paddingBottom: 40,
            }}
            showsVerticalScrollIndicator={false}
          />
        )}

        <Footer />
      </LinearGradient>
    </SafeAreaView>
  );
};

export default UserLists;
