import * as React from "react";
import { View, ViewStyle, StyleProp } from "react-native";

export type AspectRatioProps = {
  ratio?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

function AspectRatio({ ratio = 1, style, children }: AspectRatioProps) {
  return (
    <View
      data-slot="aspect-ratio"
      style={[
        {
          width: "100%",
          aspectRatio: ratio,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export { AspectRatio };
