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
  showUntilLoaded?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

function AvatarFallback({
  children,
  showUntilLoaded = true,
  style,
  textStyle,
}: AvatarFallbackProps) {
  const { size, imageStatus } = useAvatar();
  const { theme } = useTheme();

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
          backgroundColor: theme.colors.muted,
        },
        style,
      ]}
    >
      {typeof children === "string" ? (
        <Text
          style={[
            {
              color: theme.colors.foreground,
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