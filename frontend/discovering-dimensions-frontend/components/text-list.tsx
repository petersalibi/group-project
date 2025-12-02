import React from 'react';
import { View } from 'react-native';
import { ThemedText } from './themed-text';

export function OrderedList({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 10, marginLeft: 5 }}>
      {React.Children.map(children, (child, index) => (
        <View
          style={{
            flexDirection: 'row',
            marginBottom: index === React.Children.count(children) - 1 ? 0 : 10,
          }}
          key={index}
        >
          {/* If child view has a Math item, increase line height */}
          <ThemedText type='text' style={{ marginRight: 8 }}>
            {index + 1}.
          </ThemedText>
          {/* Ensure child wraps around div */}
          <View style={{ flex: 1 }}>{child}</View>
        </View>
      ))}
    </View>
  );
}

export function UnorderedList({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 10, marginLeft: 5 }}>
      {React.Children.map(children, (child, index) => (
        <View
          style={{
            flexDirection: 'row',
            marginBottom: index === React.Children.count(children) - 1 ? 0 : 8,
          }}
          key={index}
        >
          <ThemedText style={{ fontSize: 28, marginRight: 8, lineHeight: 21 }}>
            •
          </ThemedText>
          {child}
        </View>
      ))}
    </View>
  );
}
