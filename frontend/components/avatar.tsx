import * as React from "react";
import {
  View,
  Image,
  ImageProps,
  ViewStyle,
  StyleProp,
  TextStyle,
} from "react-native";

import { Text } from "./text";
import { useTheme } from "./theme-provider";
type AvatarContextValue = {
  size: number;
  imageStatus: "idle" | "loaded" | "error";
  setImageStatus: (s: "idle" | "loaded" | "error") => void;
};

const AvatarContext = React.createContext<AvatarContextValue | null>(null);
 
function useAvatar() {
  const ctx = React.useContext(AvatarContext);
  if (!ctx) throw new Error("Avatar components must be used within <Avatar />");
  return ctx;
}

export type AvatarProps = {
  /**
   * Default matches your `size-10` (~40)
   */
  size?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

function Avatar({ size = 40, style, children }: AvatarProps) {
  const [imageStatus, setImageStatus] = React.useState<"idle" | "loaded" | "error">(
    "idle"
  );

  return (
    <AvatarContext.Provider value={{ size, imageStatus, setImageStatus }}>
      <View
        data-slot="avatar"
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: "hidden",
            flexShrink: 0,
          },
          style,
        ]}
      >
        {children}
      </View>
    </AvatarContext.Provider>
  );
}

export type AvatarImageProps = Omit<ImageProps, "style"> & {
  style?: StyleProp<ViewStyle>;
};

function AvatarImage({ style, ...props }: AvatarImageProps) {
  const { imageStatus, setImageStatus } = useAvatar();
 
  // If we already errored, don't keep rendering the broken image.
  if (imageStatus === "error") return null;

  return (
    <Image
      data-slot="avatar-image"
      {...props}
      onLoad={(e) => {
        setImageStatus("loaded");
        props.onLoad?.(e);
      }}
      onError={(e) => {
        setImageStatus("error");
        props.onError?.(e);
      }}
      style={[
        {
          width: "100%",
          height: "100%",
        },
        style,
      ]}
      resizeMode={props.resizeMode ?? "cover"}
    />
  );
}

export type AvatarFallbackProps = {
  children?: React.ReactNode;
  /**
   * Show fallback even before image loads? (Radix usually shows fallback until loaded)
   * default: true
   */
  showUntilLoaded?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};
// ... (Keep Context and Avatar/AvatarImage as they are)

function AvatarFallback({
  children,
  showUntilLoaded = true,
  style,
  textStyle,
}: AvatarFallbackProps) {
  const { size, imageStatus } = useAvatar();
  const { theme } = useTheme(); //  Hook added inside the function

  const shouldShow =
    imageStatus === "error" || (showUntilLoaded && imageStatus !== "loaded");

  if (!shouldShow) return null;

  return (
    <View
      data-slot="avatar-fallback"
      style={[
        {
          width: "100%",
          height: "100%",
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.muted, //  Now theme is defined!
        },
        style,
      ]}
    >
      {typeof children === "string" ? (
        <Text
          style={[
            {
              color: theme.colors.foreground, //  Now theme is defined!
              fontWeight: "600",
            },
            textStyle,
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

export { Avatar, AvatarImage, AvatarFallback };