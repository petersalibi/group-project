import * as React from "react";
import {
  View,
  Text,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
  ViewStyle,
  StyleProp,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "./theme-provider";

type AccordionType = "single" | "multiple";

type AccordionContextValue = {
  type: AccordionType;
  value: string | string[] | undefined;
  onValueChange?: (next: string | string[]) => void;
  toggleItem: (itemValue: string) => void;
  isOpen: (itemValue: string) => boolean;
};

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

function useAccordion() {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) throw new Error("Accordion components must be used within <Accordion />");
  return ctx;
}

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function Accordion({
  type = "single",
  value,
  defaultValue,
  onValueChange,
  style,
  children,
}: AccordionProps) {
  const { theme } = useTheme(); 
  
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<string | string[] | undefined>(
    defaultValue ?? (type === "multiple" ? [] : undefined)
  );

  const current = isControlled ? value : internal;

  const setCurrent = React.useCallback(
    (next: string | string[]) => {
      onValueChange?.(next);
      if (!isControlled) setInternal(next);
    },
    [isControlled, onValueChange]
  );

  const isOpen = React.useCallback(
    (itemValue: string) => {
      if (type === "multiple") return Array.isArray(current) ? current.includes(itemValue) : false;
      return current === itemValue;
    },
    [current, type]
  );

  const toggleItem = React.useCallback(
    (itemValue: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      if (type === "multiple") {
        const arr = Array.isArray(current) ? current : [];
        const next = arr.includes(itemValue)
          ? arr.filter((v) => v !== itemValue)
          : [...arr, itemValue];
        setCurrent(next);
      } else {
        setCurrent(current === itemValue ? "" : itemValue);
      }
    },
    [current, setCurrent, type]
  );

  const ctx = React.useMemo<AccordionContextValue>(
    () => ({ type, value: current, onValueChange, toggleItem, isOpen }),
    [type, current, onValueChange, toggleItem, isOpen]
  );

  return (
    <AccordionContext.Provider value={ctx}>
      <View style={[{ width: "100%" }, style]}>{children}</View>
    </AccordionContext.Provider>
  );
}

const AccordionItemContext = React.createContext<{ value: string } | null>(null);
function useAccordionItem() {
  const ctx = React.useContext(AccordionItemContext);
  if (!ctx) throw new Error("AccordionItem children must be within <AccordionItem />");
  return ctx;
}

export function AccordionItem({ value, style, children }: { value: string; style?: StyleProp<ViewStyle>; children: React.ReactNode; }) {
  const { theme } = useTheme(); 

  return (
    <AccordionItemContext.Provider value={{ value }}>
      <View
        style={[
          {
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          },
          style,
        ]}
      >
        {children}
      </View>
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger({ children, showChevron = true, style, textStyle, disabled }: { children: React.ReactNode; showChevron?: boolean; style?: StyleProp<ViewStyle>; textStyle?: any; disabled?: boolean; }) {
  const { theme } = useTheme(); 
  const { toggleItem, isOpen } = useAccordion();
  const { value } = useAccordionItem();
  const open = isOpen(value);

  return (
    <Pressable
      onPress={() => toggleItem(value)}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: theme.spacing.sm,
          paddingVertical: theme.spacing.md,
          borderRadius: theme.radius.md,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          {
            flex: 1,
            fontWeight: theme.typography.weightMedium,
            color: theme.colors.foreground,
          },
          textStyle,
        ]}
      >
        {children}
      </Text>

      {showChevron && (
        <Feather
          name="chevron-down"
          size={16}
          color={theme.colors.mutedForeground}
          style={{
            marginTop: 2,
            transform: [{ rotate: open ? "180deg" : "0deg" }],
          }}
        />
      )}
    </Pressable>
  );
}

export function AccordionContent({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; }) {
  const { theme } = useTheme(); 
  const { isOpen } = useAccordion();
  const { value } = useAccordionItem();
  
  if (!isOpen(value)) return null;

  return <View style={[{ paddingBottom: theme.spacing.md }, style]}>{children}</View>;
}