import * as React from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "./theme-provider";
import { Button, ButtonProps } from "./button";

const AlertDialogContext = React.createContext<{ open: boolean; setOpen: (v: boolean) => void } | null>(null);

export function AlertDialog({ children, open: controlledOpen, onOpenChange }: any) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (val: boolean) => {
    onOpenChange?.(val);
    setInternalOpen(val);
  };
  return <AlertDialogContext.Provider value={{ open, setOpen }}>{children}</AlertDialogContext.Provider>;
}

function useAlertDialog() {
  const context = React.useContext(AlertDialogContext);
  if (!context) throw new Error("Use within AlertDialog");
  return context;
}

export function AlertDialogTrigger({ children, ...props }: ButtonProps) {
  const { setOpen } = useAlertDialog();
  return <Button {...props} onPress={() => setOpen(true)}>{children}</Button>;
}

export function AlertDialogContent({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useAlertDialog();
  const { theme } = useTheme();

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={{ 
        flex: 1, 
        backgroundColor: "rgba(0,0,0,0.5)", 
        justifyContent: "center", 
        alignItems: "center", 
        padding: 20 
      }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
        <View style={{ 
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius.lg, 
          padding: 20, 
          width: "100%", 
          maxWidth: 400, 
          gap: 12, 
          borderWidth: 1, 
          borderColor: theme.colors.border 
        }}>
          {children}
        </View>
      </View>
    </Modal>
  );
}

export function AlertDialogAction({ children, onPress, ...props }: ButtonProps) {
  const { setOpen } = useAlertDialog();
  return (
    <Button {...props} onPress={(e) => { onPress?.(e); setOpen(false); }}>
      {children}
    </Button>
  );
}

export function AlertDialogCancel({ children, onPress, ...props }: ButtonProps) {
  const { setOpen } = useAlertDialog();
  return (
    <Button variant="outline" {...props} onPress={(e) => { onPress?.(e); setOpen(false); }}>
      {children}
    </Button>
  );
}

export const AlertDialogTitle = ({ children }: any) => {
  const { theme } = useTheme();
  return <Text style={{ fontSize: 18, fontWeight: "700", color: theme.colors.foreground }}>{children}</Text>;
};

export const AlertDialogDescription = ({ children }: any) => {
  const { theme } = useTheme();
  return <Text style={{ fontSize: 14, color: theme.colors.mutedForeground }}>{children}</Text>;
};

export const AlertDialogHeader = ({ children }: any) => <View style={{ gap: 8 }}>{children}</View>;

export const AlertDialogFooter = ({ children, direction = "row" }: any) => (
  <View style={{ flexDirection: direction, justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
    {children}
  </View>
);