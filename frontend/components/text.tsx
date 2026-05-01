import { Text as RNText } from "react-native";
import { useTheme } from "./theme-provider";
 
export function Text(props: any) {
    const { theme } = useTheme();
  return (
    <RNText
      {...props}
      style={[
        { color: theme.colors.foreground },
        props.style,
      ]}
    />
  );
}
