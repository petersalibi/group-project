import { ScrollView, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedBackground } from '@/components/themed-background';

export default function Home() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle='dark-content' />
      <ScrollView
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
          <ThemedText
            style={{
              fontSize: 100,
              fontWeight: '300',
              marginBottom: 20,
              marginTop: 200,
              textAlign: 'center',
              lineHeight: 110,
              position: 'sticky',
              top: 200,
            }}
          >
            Discovering Dimensions
          </ThemedText>
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
            <ThemedView style={{ flex: 1, maxWidth: 900, maxHeight: 600 }}>
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
              <ThemedText style={{ fontSize: 16, textAlign: 'center' }}>
                Explore the hidden geometry of neural networks with stunning 3D
                loss landscape visualisations. Watch how different models learn,
                converge, and navigate their optimisation paths.
              </ThemedText>
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
      </ScrollView>
    </SafeAreaView>
  );
}
