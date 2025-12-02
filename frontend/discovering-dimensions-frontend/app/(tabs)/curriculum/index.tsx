import { UnorderedList } from '@/components/text-list';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';

export default function CurriculumIndex() {
  const router = useRouter();

  return (
    <>
      <ThemedText type='title'>Introduction</ThemedText>
      <ThemedText type='text'>
        {'\n'}
        The Discovering Dimensions Loss Landscape tool is designed to help you
        understand more about the topic surrounding loss landscapes, how
        changing variables impacts the loss landscapes and visualise how
        different common minimiser methods look on a loss landscape.
        {'\n'}
        {'\n'}
        To aid in using this tool, we have created a curriculum to help you
        develop a deeper understanding of neural networks so that you are able
        to gather insightful information from this tool, whether its for your
        studies or to help with a personal project or research.
        {'\n'}
        {'\n'}
        This tool is aimed at people with basic knowledge of machine learning
        and neural networks, with this course introducing loss and how it
        relates to a neural network&apos;s performance, all the way to
        understanding how to fine tune parameters, interpret different methods
        and discover interesting comparisons between loss landscapes.
        {'\n'}
        {'\n'}
        This course is split into 3 stages, so depending on your current
        knowledge, you are able to start from wherever you like, using these
        lessons as a guide to get the most out of using and interpreting this
        tool.
        {'\n'}
        <UnorderedList>
          <ThemedText type='text'>
            <ThemedText type='textBold'>Stage 1:</ThemedText>{' '}
            <ThemedText
              type='link'
              onPress={() => router.push('/curriculum/stage-1')}
            >
              Introducing loss
            </ThemedText>
            . Introducing a basic toy neural network, understanding the impact
            of weight changes, introducing loss and how it impacts the
            prediction of a network.
          </ThemedText>
          <ThemedText type='text'>
            <ThemedText type='textBold'>Stage 2:</ThemedText>{' '}
            <ThemedText
              type='link'
              onPress={() => router.push('/curriculum/stage-2')}
            >
              Features of loss landscapes
            </ThemedText>
            . Introducing loss landscapes, expanding our toy network to generate
            a more interesting landscape and how different network architectures
            impact the look of the loss landscape.
          </ThemedText>
          <ThemedText type='text'>
            <ThemedText type='textBold'>Stage 3:</ThemedText>{' '}
            <ThemedText
              type='link'
              onPress={() => router.navigate('/curriculum/stage-3')}
            >
              Advanced loss landscape techniques
            </ThemedText>
            . Demonstrating a broader range of toy networks, the impact of
            hyperparameters and loss functions and how to compare networks to
            each other.
          </ThemedText>
        </UnorderedList>
        {'\n'}
        {'\n'}
        If you need any further help navigating the tool, please refer to our
        detailed help guide.
      </ThemedText>
    </>
  );
}
