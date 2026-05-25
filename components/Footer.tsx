import React from "react";

import { Image, Linking, Pressable, Text, View } from "react-native";

const Footer = () => {
  const openLinkedIn = async () => {
    await Linking.openURL("https://linkedin.com/in/krsahil");
  };

  return (
    <View
      className="mt-4 mx-6 mb-6 bg-white rounded-3xl p-5 border border-pink-100 items-center"
      style={{
        elevation: 4,
      }}
    >
      {/* LOGO + BRAND */}
      <View className="flex-row items-center">
        <Image
          source={require("../assets/images/cygnite-studio-logo.png")}
          className="w-16 h-16 rounded-full"
          resizeMode="cover"
        />

        <View className="ml-3">
          <Text className="text-xl font-bold tracking-wide text-neutral-900">
            Cygnite Studios
          </Text>

          <Text className="text-sm text-neutral-500 mt-1">
            Design • Develop • Deploy
          </Text>
        </View>
      </View>

      {/* DIVIDER */}
      <View className="w-full h-[1px] bg-pink-100 my-4" />

      {/* CREDITS */}
      <View className="flex-row flex-wrap items-center justify-center">
        <Text className="text-neutral-500 text-sm">
          Designed & Developed by{" "}
        </Text>

        <Pressable onPress={openLinkedIn}>
          <Text className="text-blue-500 font-semibold text-sm">
            Sahil Kumar
          </Text>
        </Pressable>
      </View>

      {/* VERSION */}
      <Text className="text-xs text-neutral-400 mt-3">
        Powered by Cygnite Studios
      </Text>
    </View>
  );
};

export default Footer;
