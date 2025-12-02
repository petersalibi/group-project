import { UnorderedList } from '@/components/text-list';
import { ThemedText } from '@/components/themed-text';
import { Collapsible } from '@/components/ui/collapsible';

export default function CurriculumStage2() {
  return (
    <>
      <ThemedText type='title'>Stage 2: Features of loss landscapes</ThemedText>
      <Collapsible type='subheading' title='Learning criteria'>
        <ThemedText type='text'>
          In this stage you will learn about:
          {'\n'}
          <UnorderedList>
            <ThemedText type='text'>
              More complex neural networks, from linear models to multilayer
              neural networks
            </ThemedText>
            <ThemedText type='text'>
              Nonlinear activation functions and their necessity for learning
              more complicated datasets
            </ThemedText>
            <ThemedText type='text'>
              Network design and the importance of hyperparameters
            </ThemedText>
            <ThemedText type='text'>
              Loss landscapes, useful properties and the impact of network
              design on their shape
            </ThemedText>
            <ThemedText type='text'>
              How we can train and configure neural networks to have smoother
              (convex) loss landscapes
            </ThemedText>
          </UnorderedList>
        </ThemedText>
      </Collapsible>
      <ThemedText type='text'>
        {'\n'}
        From the previous stage we explored the fundamentals of neural networks
        through a toy example &ndash; what they are, the core of how they work
        and their input&ndash;output structure. But what we will find in this
        stage is that neural networks can be harnessed to explore a vast expanse
        of complex tasks, from facial recognition software and fraud detection
        to natural language processing, artwork generation, music and much more.
        The key to such capability is their expressive power &ndash; their
        ability to learn intricate patterns in the most complex datasets and use
        this to generate completely new information and predictions. This was a
        huge step up over prior models, where every possible output was already
        known from the design stage. But to understand this infinite expressive
        power and the capabilities that come with it, we first have to
        understand how they are truly built &ndash; through theory, through
        practice and through visualisation.
      </ThemedText>
    </>
  );
}
