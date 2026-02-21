import * as React from "react";
import { 
  View, 
  Pressable, 
  Modal, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  ViewStyle,
  Dimensions
} from "react-native";
import { useTheme } from "./theme-provider";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type Layout = { x: number; y: number; w: number; h: number; px: number; py: number };

const DropdownMenuContext = React.createContext<{
  visible: boolean;
  setVisible: (v: boolean) => void;
  triggerRef: React.RefObject<View>;
  layout: Layout | null;
  setLayout: (l: Layout) => void;
} | null>(null);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = React.useState(false);
  const [layout, setLayout] = React.useState<Layout | null>(null);
  const triggerRef = React.useRef<View>(null);

  return (
    <DropdownMenuContext.Provider value={{ visible, setVisible, triggerRef, layout, setLayout }}>
      <View style={{ alignSelf: 'flex-start' }}>{children}</View>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({ children }: { children: React.ReactNode }) {
  const context = React.useContext(DropdownMenuContext);
  
  const handleOpen = () => {
    context?.triggerRef.current?.measure((x, y, width, height, px, py) => {
      context.setLayout({ x, y, w: width, h: height, px, py });
      context.setVisible(true);
    });
  };

  return (
    <View ref={context?.triggerRef} collapsable={false}>
      <Pressable onPress={handleOpen}>{children}</Pressable>
    </View>
  );
}

export function DropdownMenuContent({ children }: { children: React.ReactNode }) {
  const context = React.useContext(DropdownMenuContext);
  const { theme } = useTheme();

  if (!context || !context.layout) return null;

  const { px, py, h } = context.layout;
  const MENU_WIDTH = 200;
  const ESTIMATED_HEIGHT = 150; // Safety buffer for edge detection

  // Edge detection: If near the bottom, flip to show above the trigger
  const showAbove = py + h + ESTIMATED_HEIGHT > SCREEN_HEIGHT;
  
  const dynamicStyles: ViewStyle = {
    position: 'absolute',
    left: px,
    top: showAbove ? py - ESTIMATED_HEIGHT : py + h + 4,
    width: MENU_WIDTH,
    backgroundColor: theme.colors.popover, // Using your theme popover color
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md, // Using your theme radius
    ...theme.shadows.medium, // Spreading your existing theme shadows
  };

  return (
    <Modal visible={context.visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={() => context.setVisible(false)}>
        <View style={[styles.content, dynamicStyles]}>
          <ScrollView bounces={false} style={{ maxHeight: 300 }}>
            {children}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

export function DropdownMenuItem({ 
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
      style={[
        styles.item, 
        { opacity: disabled ? 0.5 : 1 }
      ]}
    >
      <View style={{ flex: 1 }}>{children}</View>
    </TouchableOpacity>
  );
}

export function DropdownMenuSeparator() {
  const { theme } = useTheme();
  return <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    borderWidth: 1,
    padding: 4,
    overflow: 'hidden',
  },
  item: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  separator: {
    height: 1,
    marginVertical: 4,
  }
});