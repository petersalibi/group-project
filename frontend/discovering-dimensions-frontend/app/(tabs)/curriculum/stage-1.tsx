import Figure from '@/components/figure';
import { UnorderedList } from '@/components/text-list';
import { ThemedText } from '@/components/themed-text';
import { Collapsible } from '@/components/ui/collapsible';
import VideoScreen from '@/components/video-screen';

export default function CurriculumStage1() {
  return (
    <>
      <ThemedText type='title'>Stage 1: Introducing loss</ThemedText>
      <Collapsible type='subheading' title='Learning criteria'>
        <ThemedText type='text'>
          In this stage you will learn about:
          {'\n'}
          <UnorderedList>
            <ThemedText type='text'>
              What a neural network is and is able to identify the inputs,
              outputs and weights on a neural network
            </ThemedText>
            <ThemedText type='text'>
              Why weights of a neural network change and how that impacts the
              prediction of the neural network
            </ThemedText>
            <ThemedText type='text'>
              How loss relates to the quality of the prediction of the neural
              network
            </ThemedText>
          </UnorderedList>
        </ThemedText>
      </Collapsible>
      <ThemedText type='text'>
        {'\n'}
        This section is an introduction to loss, giving a toy network as an
        example. A <ThemedText type='textBold'>neural network</ThemedText> is a
        machine learning model that takes a set of inputs and recognises
        patterns in the data. Neural networks then use these patterns to produce
        a predicted output. We can then check how accurate these predictions are
        and change how the patterns in the data are used to make the prediction.
        {'\n'}
        {'\n'}
        Lets take a simple &quot;toy&quot; network. When we say &quot;toy&quot;
        we just mean a very simple network that we can easily understand and
        interpret. We want to create a network that takes in the RGB values of a
        colour (RGB is a way to represent any colour by changing the amount of
        red, green and blue that you &quot;mix&quot; together). For each colour,
        RGB values go from 0 to 255, where 0 is no colour and 255 is full
        colour.
        {'\n'}
        <UnorderedList>
          <ThemedText type='text'>
            To make green, we want no red, pure green and no blue
          </ThemedText>
          <ThemedText type='text'>
            To make white, we need all of the pure colours.
          </ThemedText>
        </UnorderedList>
        {'\n'}
        {'\n'}
        We can also make lots of different shades of purple. These images show
        different RGB values for different shades of purple:
      </ThemedText>
      <Figure
        img=''
        width={500}
        aspectRatio={1.5}
        caption='Different shades of purple with their RGB values'
      />
      <ThemedText type='text'>
        {'\n'}
        So to make this purple network, we have three inputs (red, green, blue),
        a function that decides if the colours match some rules and one output
        (&quot;yes&quot; if its purple, &quot;no&quot; if it isn&apos;t).
        {'\n'}
        {'\n'}
        To decide how this function decides whether the colour is purple, we
        need to decide the <ThemedText type='textBold'>weights</ThemedText> for
        each of the inputs. This will then help us decide if one input is too
        much or too little. We know that mixing blue and red together gives us
        purple so lets start with that and look at the purple diagrams again.
        {'\n'}
        {'\n'}
        If we look at the diagram we can see that we need &gt; 50% red, &gt; 50%
        blue and &lt; 50% green, which makes our network look like this:
      </ThemedText>
      <VideoScreen
        videoSource={require('@/assets/videos/curriculum/stage-1/purple-network.mp4')}
        width={800}
      />
      <ThemedText type='text'>
        If you tried out a few different colours, you will see two things:
        {'\n'}
        <UnorderedList>
          <ThemedText type='text'>
            Only some of the purple colours are predicted (labelled) as purple.
          </ThemedText>
          <ThemedText type='text'>
            Some colours (ie pink and dark blue) are labelled as purple but not.
          </ThemedText>
        </UnorderedList>
        {'\n'}
        {'\n'}
        This is called a <ThemedText type='textBold'>loss</ThemedText> because
        there is an error in the predicted values. So, the loss is the number of
        correctly labelled colours compared to all of the colours we tested out
        on the network.
        {'\n'}
        {'\n'}
        Another way we can look at this is on a graph, we can compare the
        different inputs, draw the thresholds that the weights are using for the
        prediction and see if it tells us anything about why we have a big loss.
        {'\n'}
        {'\n'}
        Since we have three inputs, we can also nicely visualise the network in
        3D, having an axis for the red, green and blue components of the
        colours.
      </ThemedText>
      <Figure
        img={require('@/assets/images/curriculum/stage-1/rgb-network-80.webp')}
        width={500}
        aspectRatio={1}
        caption='80% correct &ndash; the green crosses show a correct prediction, the red crosses show an incorrect prediction and the purple line shows the region where the colours are going to be predicted as purple.'
      />
      <ThemedText type='text'>
        We want to make our network more accurate, so that all the purple
        colours are labelled purple, and all other colours are labelled not
        purple. To do this we can look at the graphs, how well they labelled the
        test data and change the weights. From the graphs we can look at where
        the different threshold lines cross over and draw some conclusions:
        {'\n'}
        <UnorderedList>
          <ThemedText type='text'>
            Most of the pink colours will be predicted as purple.
          </ThemedText>
          <ThemedText type='text'>
            Some of the purple region won’t be predicted as purple.
          </ThemedText>
          <ThemedText type='text'>
            We need to decrease the blue threshold.
          </ThemedText>
          <ThemedText type='text'>
            We need to decrease the green threshold.
          </ThemedText>
        </UnorderedList>
        {'\n'}
        {'\n'}
        So now lets try (128, 85, 0). This now gives us a different prediction:
      </ThemedText>
      <Figure
        img={require('@/assets/images/curriculum/stage-1/rgb-network-100.png')}
        width={500}
        aspectRatio={1.05}
      />
      <ThemedText type='text'>
        We can now see we have a new accuracy of 100%, meaning we have reduced
        the loss of the network. This process is called{' '}
        <ThemedText type='textBold'>minimising the loss function</ThemedText>{' '}
        &ndash; changing the weights so that we now have a more accurate
        prediction.
      </ThemedText>
    </>
  );
}
