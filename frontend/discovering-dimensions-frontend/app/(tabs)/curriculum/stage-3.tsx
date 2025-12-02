import { OrderedList, UnorderedList } from '@/components/text-list';
import { ThemedText } from '@/components/themed-text';
import { Collapsible } from '@/components/ui/collapsible';
import Math from '@/components/math';
import Figure from '@/components/figure';

export default function CurriculumStage3() {
  return (
    <>
      <ThemedText type='title'>
        Stage 3: Advanced loss landscape techniques
      </ThemedText>
      <Collapsible type='subheading' title='Learning criteria'>
        <ThemedText type='text'>
          In this stage you will learn about:
          {'\n'}
          <UnorderedList>
            <ThemedText type='text'>
              Gradient descent and the general methods that neural networks
              learn
            </ThemedText>
            <ThemedText type='text'>
              More advanced neural network loss landscape visualisation
              techniques for higher-dimensional spaces
            </ThemedText>
            <ThemedText type='text'>
              Extending the concept of visualising training to classification
              and clustering tasks
            </ThemedText>
            <ThemedText type='text'>
              How different neural network training methods influence their path
              through the loss landscape
            </ThemedText>
          </UnorderedList>
        </ThemedText>
      </Collapsible>
      <ThemedText type='subheading'>
        But how do neural networks learn?
      </ThemedText>
      <ThemedText type='text'>
        Learning in a neural network is just equivalent to learning the optimal
        weight values so that the loss for the network is minimised on the
        training dataset. This is exactly the same goal as linear models, except
        that now we have to also deal with multiple layers and nonlinear
        activations. And like linear models, we have a loss function, also often
        sum of squares / MSE loss, that for a given set of predictions and
        labels determines the loss of our network.
        {'\n'}
        The idea is relatively straightforward, but often hard to implement in
        real software:
        <OrderedList>
          <ThemedText type='text'>
            Perform the forward pass &ndash; that is, run the network through
            the training data to get the predictions{' '}
            <Math exp='\hat{\textbf{y}}' />.
          </ThemedText>
          <ThemedText type='text'>
            Compute the loss{' '}
            <Math exp='L = ||\textbf{y} - \hat{\textbf{y}}||' /> from our
            predictions and the true values / labels from the training dataset.
          </ThemedText>
          <ThemedText type='text'>
            Compute the gradient vector of all weights with respect to the loss{' '}
            <Math exp='L' />. So for each weight <Math exp='w' />, compute{' '}
            <Math exp='\frac{dL}{dw}' /> &ndash; how does the loss change with
            respect to the value of the weight? This is just saying, &quot;In
            what direction should we move this weight so that the loss
            increases?&quot; Since we want the loss to decrease, if we take the
            negative of this, we can hopefully make a change in the direction of{' '}
            <Math exp='\frac{dL}{dw}' /> that reduces the loss further.
          </ThemedText>
          <ThemedText type='text'>
            Now run an optimisation algorithm that seeks to reduce the loss.
            Almost every core algorithm relies on this &quot;base&quot;
            algorithm:
            <Math
              block={true}
              exp='\textbf{W}^{\;(t+1)} = \textbf{W}^{\;(t)} - \alpha \nabla(\textbf{W}^{\;(t)})'
            />
            where <Math exp='\textbf{W} \;' /> is the set of weights in the
            network, <Math exp='t' /> is the time iteration (so how many times
            we&apos;ve run this before, so the current iteration is{' '}
            <Math exp='t' /> and the next is <Math exp='t+1' />
            ), <Math exp='\nabla' /> is the gradient vector applied to these
            weights and <Math exp='\alpha' /> is a constant called the learning
            rate. We make this a small number, e.g. <Math exp='0.05' />, so that
            we don&apos;t go <ThemedText type='textItalic'>too</ThemedText> far
            in the direction of loss reduction or we might actually miss a
            minimum (imagine jumping across the valley in the loss landscape
            rather than falling to the middle &ndash; too far a gap).
          </ThemedText>
        </OrderedList>
        {'\n'}
        {'\n'}
        So all this algorithm does is this:
        <OrderedList>
          <ThemedText type='text'>
            Take the existing weights, <Math exp='\textbf{W}^{\;t}' />.
          </ThemedText>
          <ThemedText type='text'>
            Find the set of directions &ndash; one for each weight &ndash; that
            when we move in that direction we increase the loss and negate them
            (so then we move in the opposite direction, to diminish the loss).
            This gives us
            <Math exp='-\nabla(\textbf{W}^{\;t})' />.
          </ThemedText>
          <ThemedText type='text'>
            Then reduce the size of this directions so we don&apos;t overshoot.
            This is the scaling factor, giving us{' '}
            <Math exp='-\alpha \nabla(\textbf{W}^{\;t})' />
          </ThemedText>
          <ThemedText type='text'>
            Then move our weights in the direction to hopefully reduce the loss
            for next time. We do this by adding the modified vector (or
            subtracting the positive version) to get the original recurrence:
            <Math exp='\textbf{W}^{\;t} - \alpha \nabla(\textbf{W}^{\;t})' />
          </ThemedText>
          <ThemedText type='text'>
            Then we can call this newly updated set of weights{' '}
            <Math exp='\textbf{W}^{\;t + 1}' /> and go back to step 1, and keep
            repeating until we&apos;ve reached a loss that is low enough for our
            network.
          </ThemedText>
        </OrderedList>
        {'\n'}
        {'\n'}
        And that&apos;s (theoretically) it! Just repeat that set of steps over
        and over again as many times as you want, and each time you do this the
        weights will adapt to become more attuned to the dataset, so that if you
        pass in new data the network can predict outputs.
      </ThemedText>
      <Figure
        img={require('@/assets/images/curriculum/stage-3/ball-loss.png')}
        width={500}
        aspectRatio={1.35}
        caption='Imagine the ball as the set of parameters. The algorithm will, at each step, move this ball closer to the pit/valley below &ndash; like gravity, the gradient vector will show us the direction that takes us to the pit.'
      />
      <ThemedText type='text'>
        Of course while following this algorithm would give you a relatively
        decent model, it&apos;s far from the best course. For a start, this
        algorithm only works for{' '}
        <ThemedText type='textBold'>a single training example</ThemedText>. So
        it will be great at predicting instances of that training example but
        not for the whole training dataset. If we want a well trained dataset,
        we&apos;ll have to use{' '}
        <ThemedText type='textBold'>all the training examples</ThemedText>. This
        is not much more complicated, we just compute the overall gradient
        vector as the <ThemedText type='textBold'>average</ThemedText> gradient
        vector of all the training examples, or, given like this:
        <Math
          block={true}
          exp='\textbf{W}^{\;(t+1)} = \textbf{W}^{\;(t)} - \alpha \times \frac{1}{n} \sum_{i = 1}^n \nabla(\textbf{W}_{\;i}^{\;(t)})'
        />
        over all training examples from <Math exp='\textbf{x}_1' /> to{' '}
        <Math exp='\textbf{x}_n' />. Of course computing the gradients all the
        time using calculus is extremely time-expensive, so we often reduce{' '}
        <Math exp='n' /> to a random subset of the training examples each time.
        This is called{' '}
        <ThemedText type='textBold'>stochastic gradient descent:</ThemedText>
        <Math
          block={true}
          exp='\textbf{W}^{\;(t+1)} = \textbf{W}^{\;(t)} - \alpha \times \frac{1}{n} \sum_{i \in R(t)} \nabla(\textbf{W}_{\;i}^{\;(t)})'
        />
        Where <Math exp='R(t)' /> is a randomly selected set of training
        examples at time <Math exp='t' />. Of course this won&apos;t be quite as
        accurate as full gradient descent, but it&apos;ll be close and it&apos;s
        orders of magnitude faster to perform as we&apos;d usually pick
        relatively small minibatches. On the loss landscape, full gradient
        descent would look like a ball (representing the parameter space) moving
        straight down the hill onto the valley, while stochastic would look
        similar but it may sway along the hillside back and forth until slowly,
        eventually reaching the bottom.
      </ThemedText>
      <Figure
        img={require('@/assets/images/curriculum/stage-3/gradient-descent-contour.webp')}
        width={500}
        aspectRatio={2}
        caption='The appearance of stochastic gradient descent vs. regular gradient descent, using a basic contour map.'
      />
      <ThemedText type='text'>
        While in theory SGD, being a field-based training method, makes no
        guarantee of finding the minimum (indeed such a task is known to be
        NP-complete), it will, in practice, give a very close approximation,
        usually settling on a local loss minimum. We can also make some
        adjustments to the algorithm to make it more stable or faster. Each
        recurrence algorithm type is known as an{' '}
        <ThemedText type='textBold'>optimiser</ThemedText>.
      </ThemedText>
    </>
  );
}
