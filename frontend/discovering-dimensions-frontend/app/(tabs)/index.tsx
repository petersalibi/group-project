import { StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedBackground } from '@/components/themed-background';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  FadeIn,
  ZoomOut,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/components/theme-provider';
import { Link } from 'expo-router';

export default function Home() {
  const { theme } = useTheme();
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const titleAnimatedStyle = useAnimatedStyle(() => {
    // Fade and shrink between scroll 0 -> 200
    const opacity = interpolate(scrollY.value, [0, 150], [1, 0], 'clamp');

    const scale = interpolate(scrollY.value, [0, 150], [1, 0.9], 'clamp');

    return {
      opacity,
      transform: [{ scale }],
    };
  });
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors[theme].background }}
    >
      <StatusBar barStyle='dark-content' />
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={{
          flexGrow: 1,
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          overscrollBehavior: 'none',
        }}
      >
        <ThemedBackground
          style={{
            padding: 20,
            alignItems: 'center',
            width: '100%',
            height: '100%',
          }}
        >
          <Animated.View
            key='title'
            entering={FadeIn.duration(1000)}
            exiting={ZoomOut.duration(500)}
            style={titleAnimatedStyle}
          >
            <ThemedText
              style={{
                fontSize: 100,
                fontWeight: '300',
                marginBottom: 20,
                marginTop: 200,
                textAlign: 'center',
                lineHeight: 110,
              }}
            >
              Discovering Dimensions
            </ThemedText>
          </Animated.View>
          <ThemedView
            style={{
              marginTop: 500,
              display: 'flex',
              maxWidth: 1800,
              maxHeight: 600,
              padding: 20,
              marginBottom: 20,
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 20,
              position: 'relative',
            }}
          >
            <ThemedView
              style={{
                flex: 1,
                maxWidth: 900,
                maxHeight: 600,
                alignItems: 'center',
              }}
            >
              <ThemedText
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginBottom: 20,
                }}
              >
                See the whole landscape.
              </ThemedText>
              <ThemedText
                style={{ fontSize: 16, textAlign: 'center', marginBottom: 20 }}
              >
                Explore the hidden geometry of neural networks with stunning 3D
                loss landscape visualisations. Watch how different models learn,
                converge, and navigate their optimisation paths.
              </ThemedText>
              {/* Link to /landscape page */}
              <Link href='/landscape'>
                <ThemedView
                  style={{
                    marginTop: 10,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 10,
                    backgroundColor: Colors[theme].button,
                  }}
                >
                  <ThemedText
                    style={{
                      color: Colors[theme].text,
                      fontSize: 16,
                      fontWeight: '600',
                    }}
                  >
                    View landscape
                  </ThemedText>
                </ThemedView>
              </Link>
            </ThemedView>
            <ThemedView style={{ flex: 1, maxWidth: 900, maxHeight: 600 }}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={{ maxWidth: '100%', height: 600 }}
                resizeMode='contain'
              />
            </ThemedView>
          </ThemedView>
          <ThemedView
            style={{
              display: 'flex',
              maxWidth: 1800,
              maxHeight: 600,
              padding: 20,
              marginBottom: 20,
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 20,
              position: 'relative',
            }}
          >
            <ThemedView style={{ flex: 1, maxWidth: 900, maxHeight: 600 }}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={{ maxWidth: '100%', height: 600 }}
                resizeMode='contain'
              />
            </ThemedView>
            <ThemedView style={{ flex: 1, maxWidth: 900, maxHeight: 600 }}>
              <ThemedText
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                Watch the network flow.
              </ThemedText>
              <ThemedText
                style={{ fontSize: 16, textAlign: 'center', marginTop: 20 }}
              >
                Dive into the inner workings of a neural network as data flows
                through its layers. Experience dynamic, real-time animations
                that reveal how inputs transform into intelligent predictions.
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedBackground>
        <ThemedView
          style={{
            width: '100%',
            padding: 20,
            alignItems: 'center',
            borderTopWidth: 1,
            maxHeight: 100,
          }}
        >
          <ThemedText style={{ fontSize: 14 }}>
            © 2024 Discovering Dimensions. All rights reserved.
          </ThemedText>
        </ThemedView>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
