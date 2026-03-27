import { useSyndicateStore } from "@/store/syndicate-store";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ChevronLeft, Send } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const phoenixIcon = require("@/assets/image/assets_images_icons_sanctuary_phoenix.webp");

interface Message {
  id: string;
  user: string;
  text: string;
  time: string;
  type: "message" | "system" | "alert";
  alertType?: "FLASH SALE" | "BOUNTY";
}

const MOCK_MESSAGES: Message[] = [
  {
    id: "1",
    user: "GreenQueen",
    text: "GreenQueen joined the syndicate",
    time: "",
    type: "system",
  },
  {
    id: "2",
    user: "FarmKing",
    text: "Welcome everyone to Season 4! Let's dominate the carrot market this week.",
    time: "Yesterday",
    type: "message",
  },
  {
    id: "3",
    user: "GreenQueen",
    text: "I'm in. Already have 200 carrots ready to deposit.",
    time: "Yesterday",
    type: "message",
  },
  {
    id: "4",
    user: "System",
    text: "Carrot prices spiked 12% - sell window open for 2h.",
    time: "3h ago",
    type: "alert",
    alertType: "FLASH SALE",
  },
  {
    id: "5",
    user: "HarvestHero",
    text: "Should we hold or sell now?",
    time: "2h ago",
    type: "message",
  },
  {
    id: "6",
    user: "FarmKing",
    text: "Sell half, hold half. We want to keep our monopoly.",
    time: "2h ago",
    type: "message",
  },
  {
    id: "7",
    user: "System",
    text: "Bounty progress: 340/500 corn harvested.",
    time: "1h ago",
    type: "alert",
    alertType: "BOUNTY",
  },
];

export default function SyndicateChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { joinedSyndicate } = useSyndicateStore();
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  const topPadding = Math.max(insets.top, 20) + 8;

  const clanName = joinedSyndicate?.name || "Phoenix Order";
  const clanLogo = joinedSyndicate?.logo || phoenixIcon;

  const handleSend = () => {
    if (inputText.trim().length === 0) return;

    const newMessage: Message = {
      id: Math.random().toString(),
      user: "You",
      text: inputText.trim(),
      time: "Just now",
      type: "message",
    };

    setMessages([...messages, newMessage]);
    setInputText("");
    scrollToBottom();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft color="#032018" size={24} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.logoBox}>
            <Image source={clanLogo} style={styles.logo} contentFit="contain" />
          </View>
          <View>
            <Text style={styles.headerTitle}>{clanName}</Text>
            <Text style={styles.headerSubtitle}>12 members · 8 online</Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatList}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
      >
        {messages.map((msg) => {
          if (msg.type === "system") {
            return (
              <View key={msg.id} style={styles.systemMsg}>
                <Text style={styles.systemText}>{msg.text}</Text>
              </View>
            );
          }

          if (msg.type === "alert") {
            return (
              <View key={msg.id} style={styles.msgContainer}>
                <Text style={styles.msgTime}>{msg.time}</Text>
                <View style={styles.alertBubble}>
                  <View style={styles.alertHeader}>
                    <View
                      style={[
                        styles.tag,
                        msg.alertType === "FLASH SALE"
                          ? styles.flashTag
                          : styles.bountyTag,
                      ]}
                    >
                      <Text style={styles.tagText}>{msg.alertType}</Text>
                    </View>
                    <Text style={styles.alertTime}>{msg.time}</Text>
                  </View>
                  <Text style={styles.chatText}>{msg.text}</Text>
                </View>
              </View>
            );
          }

          const isMe = msg.user === "You";
          return (
            <View
              key={msg.id}
              style={[styles.msgContainer, isMe && styles.msgContainerMe]}
            >
              <Text style={[styles.userLabel, isMe && styles.userLabelMe]}>
                {msg.user}
              </Text>
              <View style={[styles.chatBubble, isMe && styles.chatBubbleMe]}>
                <Text style={[styles.chatText, isMe && styles.chatTextMe]}>
                  {msg.text}
                </Text>
              </View>
              <Text style={[styles.msgTimeBelow, isMe && styles.msgTimeMe]}>
                {msg.time}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Input Section */}
      <View
        style={[
          styles.inputRow,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Message syndicate..."
            placeholderTextColor="rgba(3, 32, 24, 0.4)"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
          />
        </View>
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Send color="white" size={20} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#DAF8B7",
  },
  backBtn: {
    padding: 4,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
    gap: 12,
  },
  logoBox: {
    width: 40,
    height: 40,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 28,
    height: 28,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "#032018",
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.3,
  },
  chatList: {
    flex: 1,
  },
  chatContent: {
    padding: 20,
    gap: 20,
  },
  systemMsg: {
    alignItems: "center",
    marginVertical: 10,
  },
  systemText: {
    fontSize: 12,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.3,
  },
  msgContainer: {
    gap: 4,
  },
  msgContainerMe: {
    alignItems: "flex-end",
  },
  userLabel: {
    fontSize: 12,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.3,
    marginLeft: 4,
  },
  userLabelMe: {
    marginRight: 4,
    marginLeft: 0,
  },
  chatBubble: {
    backgroundColor: "#DAF8B7",
    padding: 16,
    borderRadius: 16,
    maxWidth: "85%",
  },
  chatBubbleMe: {
    backgroundColor: "#032018",
  },
  chatText: {
    fontSize: 14,
    fontFamily: "Space Mono",
    color: "#032018",
    lineHeight: 20,
  },
  chatTextMe: {
    color: "#DAF8B7",
  },
  msgTimeBelow: {
    fontSize: 10,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.2,
    marginLeft: 4,
    marginTop: 2,
  },
  msgTimeMe: {
    marginRight: 4,
    marginLeft: 0,
  },
  msgTime: {
    fontSize: 10,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.2,
    marginLeft: 4,
    marginBottom: 4,
  },
  alertBubble: {
    backgroundColor: "#DAF8B7",
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  flashTag: {
    backgroundColor: "#FF383C",
  },
  bountyTag: {
    backgroundColor: "#032018",
  },
  tagText: {
    fontSize: 9,
    fontFamily: "Space Mono",
    fontWeight: "700",
    color: "white",
  },
  alertTime: {
    fontSize: 11,
    fontFamily: "Space Mono",
    color: "#032018",
    opacity: 0.4,
  },
  inputRow: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "white",
    alignItems: "center",
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: "#DAF8B7",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    opacity: 0.6,
  },
  input: {
    fontSize: 14,
    fontFamily: "Space Mono",
    color: "#032018",
  },
  sendBtn: {
    width: 44,
    height: 44,
    backgroundColor: "#DAF8B7",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});
