import { Platform, View, Pressable } from 'react-native';
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
  withSpring,
} from 'react-native-reanimated';
import { Link } from 'expo-router';
import Svg, { Line } from 'react-native-svg';

const NODE_SIZE = 110;
const NODE_RADIUS = NODE_SIZE / 2;
const ROW_GAP = 60;

const Y_TOP = NODE_RADIUS;
const Y_BOTTOM = NODE_RADIUS + NODE_SIZE + ROW_GAP;
const Y_MIDDLE = (Y_TOP + Y_BOTTOM) / 2;
const CONTAINER_HEIGHT = Y_BOTTOM + NODE_RADIUS + 20;

function Neuron({
  id,
  label,
  href,
  size = NODE_SIZE,
}: {
  id: string;
  label: string;
  href: string;
  size?: number;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Link href={href} asChild>
      <Pressable
        onHoverIn={() => (scale.value = withSpring(1.12))}
        onHoverOut={() => (scale.value = withSpring(1))}
        onPressIn={() => (scale.value = withSpring(1.08))}
        onPressOut={() => (scale.value = withSpring(1))}
        style={{
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View
          style={[
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#00c2cc',
              ...(Platform.OS === 'web'
                ? {
                    backgroundImage:
                      'linear-gradient(180deg, #22f3ff 0%, #00c2cc 100%)',
                    boxShadow:
                      id === 'landscape'
                        ? '0 0 60px rgba(34, 243, 255, 0.6)'
                        : '0 0 30px rgba(34, 243, 255, 0.35)',
                  }
                : {
                    shadowColor: '#22f3ff',
                    shadowOpacity: id === 'landscape' ? 0.6 : 0.35,
                    shadowRadius: id === 'landscape' ? 24 : 16,
                    elevation: id === 'landscape' ? 12 : 8,
                  }),
              zIndex: 10,
            },
            animatedStyle,
          ]}
        >
          <ThemedText
            style={{
              fontSize: size > 120 ? 16 : 14,
              fontWeight: '600',
              textAlign: 'center',
            }}
            darkColor='#000'
          >
            {label}
          </ThemedText>
        </Animated.View>
      </Pressable>
    </Link>
  );
}

function CurriculumNetwork() {
  return (
    <View
      style={{
        marginTop: 80,
        width: '100%',
        alignItems: 'center',
        height: CONTAINER_HEIGHT,
      }}
    >
      <Svg
        width='100%'
        height='100%'
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* Input (16.6%) -> Hidden (50%) */}
        <Line
          x1='16.66%'
          y1={Y_TOP}
          x2='50%'
          y2={Y_TOP}
          stroke='#fff'
          strokeWidth={2}
          opacity={0.5}
        />
        <Line
          x1='16.66%'
          y1={Y_TOP}
          x2='50%'
          y2={Y_BOTTOM}
          stroke='#fff'
          strokeWidth={2}
          opacity={0.5}
        />
        <Line
          x1='16.66%'
          y1={Y_BOTTOM}
          x2='50%'
          y2={Y_TOP}
          stroke='#fff'
          strokeWidth={2}
          opacity={0.5}
        />
        <Line
          x1='16.66%'
          y1={Y_BOTTOM}
          x2='50%'
          y2={Y_BOTTOM}
          stroke='#fff'
          strokeWidth={2}
          opacity={0.5}
        />

        {/* Hidden (50%) -> Output (83.3%) */}
        <Line
          x1='50%'
          y1={Y_TOP}
          x2='83.33%'
          y2={Y_MIDDLE}
          stroke='#fff'
          strokeWidth={2}
          opacity={0.5}
        />
        <Line
          x1='50%'
          y1={Y_BOTTOM}
          x2='83.33%'
          y2={Y_MIDDLE}
          stroke='#fff'
          strokeWidth={2}
          opacity={0.5}
        />
      </Svg>

      <View style={{ flexDirection: 'row', width: '100%', height: '100%' }}>
        <View style={{ width: '33.33%', height: '100%', alignItems: 'center' }}>
          <View style={{ position: 'absolute', top: 0 }}>
            <Neuron id='loss1' label='What is Loss?' href='/curriculum/loss' />
          </View>
          <View style={{ position: 'absolute', top: Y_BOTTOM - NODE_RADIUS }}>
            <Neuron
              id='loss2'
              label='Neurons & Layers'
              href='/curriculum/networks'
            />
          </View>
        </View>

        <View style={{ width: '33.33%', height: '100%', alignItems: 'center' }}>
          <View style={{ position: 'absolute', top: 0 }}>
            <Neuron
              id='opt1'
              label='Optimisation'
              href='/curriculum/optimisation'
            />
          </View>
          <View style={{ position: 'absolute', top: Y_BOTTOM - NODE_RADIUS }}>
            <Neuron
              id='opt2'
              label='Activation'
              href='/curriculum/activation'
            />
          </View>
        </View>

        <View style={{ width: '33.33%', height: '100%', alignItems: 'center' }}>
          <View style={{ position: 'absolute', top: Y_MIDDLE - 150 / 2 }}>
            <Neuron
              id='landscape'
              label='Loss Landscapes'
              href='/landscape'
              size={150}
            />
          </View>
        </View>
      </View>

      <ThemedText
        style={{
          marginTop: 20,
          fontSize: 16,
          opacity: 0.7,
          textAlign: 'center',
          maxWidth: 600,
        }}
      >
        Start from the fundamentals and progress through the network, as each
        concept feeds into the final loss landscape visualisation.
      </ThemedText>
    </View>
  );
}

export default function Home() {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const titleAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 150], [1, 0], 'clamp');
    const scale = interpolate(scrollY.value, [0, 150], [1, 0.9], 'clamp');

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <Animated.ScrollView
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      style={{ flex: 1 }}
      contentContainerStyle={{ alignItems: 'center' }}
    >
      <ThemedBackground
        style={{
          padding: 20,
          alignItems: 'center',
          width: '100%',
          minHeight: '100%',
        }}
      >
        <Animated.View
          entering={FadeIn.duration(1000)}
          exiting={ZoomOut.duration(500)}
        >
          <Animated.View style={titleAnimatedStyle}>
            <ThemedText
              style={{
                fontSize: Platform.OS === 'web' ? 96 : 56,
                fontWeight: '300',
                marginTop: Platform.OS === 'web' ? 110 : 50,
                textAlign: 'center',
              }}
            >
              Discovering Dimensions
            </ThemedText>
          </Animated.View>
        </Animated.View>

        <ThemedText
          style={{
            fontSize: 18,
            textAlign: 'center',
            marginTop: 100,
            opacity: 0.8,
            maxWidth: 700,
          }}
        >
          Learn how neural networks learn — from loss and optimisation to the
          geometry of loss landscapes.
        </ThemedText>

        {/* Curriculum Network */}
        <CurriculumNetwork />
      </ThemedBackground>

      {Platform.OS === 'web' && (
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
            © 2026 Discovering Dimensions
          </ThemedText>
        </ThemedView>
      )}
    </Animated.ScrollView>
  );
}
