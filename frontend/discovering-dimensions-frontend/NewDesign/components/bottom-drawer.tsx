import React from "react";
import { View, Text, Modal, Pressable, ScrollView } from "react-native";
import { useTheme } from "./theme-provider";
import { X } from "lucide-react-native";
 
interface BottomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BottomDrawer({ isOpen, onClose, title, children }: BottomDrawerProps) {
  //  1. Call the hook inside the component
  const { theme } = useTheme();

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable 
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.4)",
          justifyContent: "flex-end",
        }}
      >
        {/* Drawer Content */}
        <Pressable 
          onPress={(e) => e.stopPropagation()} // Prevent click-through to backdrop
          style={{
            backgroundColor: theme.colors.background,
            borderTopLeftRadius: theme.radius.xl,
            borderTopRightRadius: theme.radius.xl,
            padding: theme.spacing.lg,
            maxHeight: "80%",
            width: "100%",
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          {/* Handle bar for visual cue */}
          <View style={{
            width: 40,
            height: 4,
            backgroundColor: theme.colors.border,
            borderRadius: 2,
            alignSelf: "center",
            marginBottom: theme.spacing.md,
          }} />

          {/* Header */}
          <View style={{ 
            flexDirection: "row", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: theme.spacing.lg 
          }}>
            <Text style={{ 
              fontSize: 20, 
              fontWeight: "700", 
              color: theme.colors.foreground 
            }}>
              {title}
            </Text>
            <Pressable onPress={onClose} style={{ padding: 4 }}>
              <X size={20} color={theme.colors.mutedForeground} />
            </Pressable>
          </View>

          {/* Content Area */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}