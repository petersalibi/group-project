import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View } from 'react-native';

interface VideoScreenProps {
  videoSource: any;
  width?: number;
}

export default function VideoScreen({ videoSource, width }: VideoScreenProps) {
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.play();
  });

  /* const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  }); */

  return (
    <View style={styles.contentContainer}>
      {/* Disable controls */}
      <VideoView
        style={[styles.video, { maxWidth: width ?? 600 }]}
        player={player}
        allowsFullscreen
        allowsPictureInPicture
      />
      {/* Play/Pause button - disabled for now
      <View style={styles.controlsContainer}>
        <Button
          title={isPlaying ? 'Pause' : 'Play'}
          onPress={() => {
            if (isPlaying) {
              player.pause();
            } else {
              player.play();
            }
          }}
        />
      </View>
      */}
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 50,
  },
  video: {
    width: '100%',
  },
  controlsContainer: {
    padding: 10,
  },
});
