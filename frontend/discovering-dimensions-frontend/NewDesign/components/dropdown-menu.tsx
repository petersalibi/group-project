import * as React from "react";
import { 
  View, 
  Pressable, 
  Modal, 
  StyleSheet, 
  Dimensions,
  TouchableOpacity,
  ScrollView 
} from "react-native";
import { Check, ChevronRight, Circle } from "lucide-react-native";
import { useTheme } from "./theme-provider";
import { Text } from "./text";

const DropdownMenuContext = React.createContext<{
  visible: boolean;
  setVisible: (v: boolean) => void;
  triggerLayout: { x: number; y: number; w: number; h: number } | null;
} | null>(null);

function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = React.useState(false);
  const [triggerLayout, setTriggerLayout] = React.useState<any>(null);

  return (
    <DropdownMenuContext.Provider value={{ visible, setVisible, triggerLayout }}>
      <View onLayout={(e) => {
        // This helps position the dropdown near the trigger
        const { x, y, width, height } = e.nativeEvent.layout;
        setTriggerLayout({ x, y, w: width, h: height });
      }}>
        {children}
      </View>
    </DropdownMenuContext.Provider>
  );
}

function DropdownMenuTrigger({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) {
  const context = React.useContext(DropdownMenuContext);
  return (
    <Pressable onPress={() => context?.setVisible(true)}>
      {children}
    </Pressable>
  );
}

function DropdownMenuContent({ children }: { children: React.ReactNode }) {
  const context = React.useContext(DropdownMenuContext);
  const { theme } = useTheme();

  if (!context) return null;

  return (
    <Modal visible={context.visible} transparent animationType="fade">
      <Pressable 
        style={styles.overlay} 
        onPress={() => context.setVisible(false)}
      >
        <View style={[
          styles.content, 
          { 
            backgroundColor: theme.colors.card, 
            borderColor: theme.colors.border,
            // Logic to position roughly below the trigger
            marginTop: context.triggerLayout ? context.triggerLayout.y + 40 : 100 
          }
        ]}>
          <ScrollView bounces={false}>{children}</ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

function DropdownMenuItem({ 
  children, 
  onSelect,
  disabled
}: { 
  children: React.ReactNode, 
  onSelect?: () => void,
  disabled?: boolean 
}) {
  const context = React.useContext(DropdownMenuContext);
  const { theme } = useTheme();

  return (
    <TouchableOpacity 
      disabled={disabled}
      onPress={() => {
        onSelect?.();
        context?.setVisible(false);
      }}
      style={styles.item}
    >
      <View style={{ flex: 1 }}>{children}</View>
    </TouchableOpacity>
  );
}

function DropdownMenuSeparator() {
  const { theme } = useTheme();
  return <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
  },
  content: {
    width: 200,
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  item: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  separator: {
    height: 1,
    marginVertical: 4,
    marginHorizontal: -4,
  }
});

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
};