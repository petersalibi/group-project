import * as React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "./theme-provider";
import { Input } from "./input";

interface NumberInputProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onChange?: (value: number) => void;
}

export function NumberInput({ 
  value: controlledValue,
  defaultValue = 0, 
  min = -Infinity, 
  max = Infinity, 
  step = 1,
  disabled = false,
  onChange 
}: NumberInputProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const { theme } = useTheme();

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const updateValue = (newValue: number) => {
    const clamped = Math.round(Math.min(Math.max(newValue, min), max) * 1000) / 1000;
    setInternalValue(clamped);
    onChange?.(clamped);
  };

  return (
    <View style={[styles.outerContainer, { borderColor: theme.colors.border }]}>
      <Input
        keyboardType="numeric"
        value={String(value)}
        disabled={disabled}
        onChangeText={(text) => {
          const parsed = parseFloat(text);
          if (!isNaN(parsed)) updateValue(parsed);
        }}
        style={[styles.input, { color: theme.colors.foreground }]}
      />

      <View style={[styles.buttonStack, { borderLeftColor: theme.colors.border }]}>
        <Pressable
          onPress={() => updateValue(value + step)}
          disabled={disabled || value >= max}
          style={({ pressed }) => [
            styles.stepperBtn,
            { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
            pressed && { backgroundColor: theme.colors.muted }
          ]}
        >
          <Feather name="chevron-up" size={12} color={theme.colors.foreground} />
        </Pressable>
        
        <Pressable
          onPress={() => updateValue(value - step)}
          disabled={disabled || value <= min}
          style={({ pressed }) => [
            styles.stepperBtn,
            pressed && { backgroundColor: theme.colors.muted }
          ]}
        >
          <Feather name="chevron-down" size={12} color={theme.colors.foreground} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    borderWidth: 1, 
    borderRadius: 8, 
    height: 36,
    width: 90,
    overflow: "hidden" 
  },
  input: { 
    flex: 1, 
    height: "100%",
    paddingHorizontal: 8,
    fontSize: 12,
    borderWidth: 0,
    textAlign: "left"
  },
  buttonStack: { 
    width: 24, 
    height: "100%", 
    borderLeftWidth: 1,
    flexDirection: "column"
  },
  stepperBtn: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
  },
});