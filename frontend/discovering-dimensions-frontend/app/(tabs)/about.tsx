import { StyleSheet, View } from 'react-native';
import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';

export default function About() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color='#808080'
          name='mountain.2.fill'
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.contentContainer}>
        <View style={styles.titleContainer}>
          <ThemedText
            type='title'
            style={{
              fontFamily: Fonts.rounded,
            }}
          >
            About Us
          </ThemedText>
        </View>
        <ThemedText style={styles.paragraph}>
          Discovering Dimensions is an open-source project aimed at providing
          users with an intuitive way to explore loss landscapes of neural
          networks through interactive visualizations. Our mission is to make
          complex concepts in machine learning more accessible and
          understandable for everyone.
        </ThemedText>
        <ThemedText style={styles.paragraph}>
          The app is built using React Native and Expo, ensuring a seamless
          experience across both iOS and Android platforms. We leverage modern
          design principles to create a user-friendly interface that is both
          functional and visually appealing.
        </ThemedText>
        <ThemedText style={styles.paragraph}>
          We welcome contributions from the community! If you&apos;re interested
          in contributing to the project, please visit our
          <ExternalLink
            href='https://github.com/petersalibi/group-project'
            style={{ marginLeft: 4, textDecorationLine: 'underline' }}
          >
            GitHub repository
          </ExternalLink>
          .
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: 20,
    gap: 12,
    flex: 1,
    alignItems: 'center',
  },
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
