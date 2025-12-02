import Figure from '@/components/figure';
import { OrderedList, UnorderedList } from '@/components/text-list';
import { ThemedText } from '@/components/themed-text';
import { Collapsible } from '@/components/ui/collapsible';
import { View } from 'react-native';
import Math from '@/components/math';

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
      <ThemedText type='subheading'>
        The path to more complex networks: linear models
      </ThemedText>
      <ThemedText type='text'>
        Continuing from the purple dataset, we can expand this idea of a simple
        network into a linear network which, given a set of input data, takes
        its weighted sum and outputs a number &ndash; a prediction &ndash;
        &quot;given these conditions or variables, this is the forecasted
        result&quot;. The weights of this network &ndash; the relative
        &quot;contribution&quot; or &quot;impact&quot; each input variable has
        &ndash; can&apos;t just be arbitrary &ndash; we have to set them so that
        they actually give us the results we want. To do this, we have to train
        the network. We do this by providing it with pre-baked examples of right
        and wrong outputs &ndash; &quot;if we have this much red, this much
        green, and this much blue then the colour must be purple&quot;. Of
        course, we can&apos;t just have one example &ndash; we must supply the
        network with many such cases, and doing so we have to hope that when we
        feed in new examples, the network will use its training information to
        give an accurate reading of whether or not the colour is purple (or
        whatever the target prediction was &ndash; house prices, medical
        predictions, etc).
      </ThemedText>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: 20,
        }}
      >
        <Figure
          img={require('@/assets/images/curriculum/stage-2/1d-linear-models.webp')}
          width={300}
          capWidth={300}
          caption={
            <ThemedText>
              A trio of 1-dimensional linear models. Given a number of columns
              (singular input), predicts a number <Math exp='N' /> (singular
              output).
            </ThemedText>
          }
        />
        <Figure
          img={require('@/assets/images/curriculum/stage-2/2d-linear-model.webp')}
          width={300}
          caption='An example of a two-dimensional linear model.'
        />
      </View>
      <ThemedText type='text'>
        Of course, real networks will often need a vast set of input variables
        or &quot;attributes&quot; as they&apos;re called, so we have to number
        them. By tradition, attributes are labelled <Math exp='x_i' /> and
        labels &ndash; the outputs or &quot;correct answers&quot; &ndash; are
        labelled <Math exp='y_i' />, where <Math exp='i' /> is just a number
        from 1 to the number of training examples <Math exp='n' />. So for our
        purple prediction example, we can call red <Math exp='x_1' />, green{' '}
        <Math exp='x_2' /> and blue <Math exp='x_3' />, then our first example
        would look like:
        <Math block={true} exp='\textbf{x}_1 = [x_1, x_2, x_3]' />
        But of course, we can&apos;t just have one example, so we need to
        include more. We can have a second example:
        <Math block={true} exp='\textbf{x}_2 = [x_1, x_2, x_3]' />
        But now we have the same variable names for both examples, so let&apos;s
        denote <Math exp='x_{11}, x_{12}, x_{13}' /> to refer to example
        1&apos;s red green and blue values, and{' '}
        <Math exp='x_{21}, x_{22}, x_{23}' /> for example 2&apos;s values. to
        avoid confusion between them. In general with some arbitrary number of
        examples <Math exp='n' />, we&apos;d have:
        <Math
          block={true}
          exp='\textbf{X} = \begin{bmatrix}
            x_{11} & x_{12} & x_{13} \\
            x_{21} & x_{22} & x_{23} \\
            x_{31} & x_{32} & x_{33} \\
            \ldots & \ldots & \ldots \\
            x_{n1} & x_{n2} & x_{n3}
          \end{bmatrix} = \begin{bmatrix}
            \text{example} 1 \\
            \text{example} 2 \\
            \text{example} 3 \\
            \ldots \\
            \text{example} n
          \end{bmatrix}.'
        />
      </ThemedText>
      <ThemedText type='text'>
        We&apos;ve not done anything new here, we&apos;ve just allowed ourselves
        to have <Math exp='n' /> different colours each with a red value{' '}
        <Math exp='x_{i1}' />, a green value <Math exp='x_{i2}' />
        and a blue value <Math exp='x_{i3}' />. If we wanted to have more
        features &ndash; say if we had a different dataset or we also wanted to
        add luminosity (light level of the colour), we could add{' '}
        <Math exp='x_{i4}' />. And in general, <Math exp='x_{ij}' /> just means
        the value of the <Math exp='j' />
        -th attribute of the <Math exp='i' />
        -th training example &ndash; that&apos;s it. Each row in this matrix is
        one training example, and each column is an attribute over all the
        training examples &ndash; so for example the first column is the
        &quot;red&quot; attribute over all the examples, second is
        &quot;green&quot;, and third is blue.
      </ThemedText>
      <Figure
        img={require('@/assets/images/curriculum/stage-2/rgb-datapoints.webp')}
        width={500}
        caption={
          <ThemedText>
            A visual interpretation of the datapoints. We can take each colour
            and describe it as a training example &ndash; then combine all these
            points together to form the matrix <Math exp='\textbf{X}' />.
          </ThemedText>
        }
      />
      <ThemedText type='text'>
        Now for the labels; this is the actual value &ndash; in this case
        &quot;purple&quot; or &quot;not purple&quot; (or +1 and -1 as it would
        be encoded) &ndash; that each example has. We already know whether each
        example in this training set <Math exp='\textbf{X}' /> is purple or not
        &ndash; the goal is to use it to teach the network, so that if we gave
        it a new colour, it could say on its own whether or not that colour was
        purple. Or in the case of another problem to solve, for example house
        price, it could be a real number. This is simpler &ndash; for each
        training example there is only one answer, so we can just let{' '}
        <Math exp='y_1' /> be the answer to training example{' '}
        <Math exp='\textbf{x}_1' />, <Math exp='y_2' /> as the answer to{' '}
        <Math exp='\textbf{x}_2' /> and so on, let <Math exp='y_i' /> be the
        answer to <Math exp='\textbf{x}_i' />. Then we can construct our list or
        &quot;vector&quot; as they are called of labels:
        <Math
          block={true}
          exp='\textbf{y} = \begin{bmatrix} y_1 \\ y_2 \\ \ldots \\ y_n \end{bmatrix}'
        />
        This is all very formal but this is all just maths for &quot;here are
        the training examples with these values, and here are the correct
        answers for these examples&quot; &ndash; it&apos;s like giving a list of
        test questions and answers to a student which they learn to do well at
        the real exam.
      </ThemedText>
      <Figure
        img={require('@/assets/images/curriculum/stage-2/rgb-purple.webp')}
        width={500}
        caption={
          <ThemedText>
            The labels of our &quot;purple&quot; colour test. Points in purple
            have RGB values that map to &quot;Yes&quot; for a purple prediction
            tool, while those in red have values that map to &quot;No&quot;.
            Each &quot;yes&quot; or &quot;no&quot; output is precisely the
            corresponding label <Math exp='y_i' /> for each example{' '}
            <Math exp='\textbf{x}_i' />, with the whole label vector being{' '}
            <Math exp='\textbf{y}' />.
          </ThemedText>
        }
      />
      <ThemedText type='subsubheading'>
        Parameters (weights) of a network
      </ThemedText>
      <ThemedText type='text'>
        So, now we have our training data, we have to find the weights &ndash;
        this is a list of as many numbers as there are attributes, and each
        weight is paired with an attribute. For a linear network, we multiply
        each attribute of a training example by its corresponding weight, do
        this for all attributes of the example, and then sum the results
        together. The idea is that the sum of all these weighted attributes
        should provide a prediction of the label or output, and the values of
        the weights dictate the importance or &quot;impact&quot; that each
        attribute has in determining the prediction. How effective this idea is
        depends on how linearly-shaped the dataset is &ndash; for more
        plane-shaped, linear data, this idea will work well, but for nonlinear
        data, expect a lot of false predictions. However, it&apos;s still
        important to learn as this is the foundation of all the neural networks
        we will be using in Discovering Dimensions. The weights of the linear
        network are written like this, if we have <Math exp='d' /> attributes:
        <Math
          block={true}
          exp='\textbf{w} = \begin{bmatrix}
            w_1 \\ w_2 \\ w_3 \\ \ldots \\ w_d
          \end{bmatrix} = \begin{bmatrix}
            \text{weight value for attribute} \hspace{-6em} 1 \\
            \text{weight value for attribute} \hspace{-6em} 2 \\
            \text{weight value for attribute} \hspace{-6em} 3 \\
            \ldots \\
            \text{weight value for attribute} \hspace{-6em} d
          \end{bmatrix}'
        />
        where <Math exp='w_i' /> is just the weight for the <Math exp='i' />
        -th attribute. So our prediction for the <Math exp='j' />
        -th training or testing example{' '}
        <Math
          exp='\textbf{x}_i =
        \begin{bmatrix} x_{i1} & x_{i2} & \ldots & x_{id} \end{bmatrix}'
        />
        , which we call <Math exp='\hat{y}_i' /> for a training/testing example{' '}
        <Math exp='\textbf{x}_i' /> would look like:
        <Math
          block={true}
          exp='\hat{y}_{i} = w_1x_{i1} + w_2x_{i2} + \ldots + w_dx_{id} = \sum_{j=1}^d w_jx_{ij}'
        />
        or in matrix format, we can rewrite this as just the dot product of the
        weight vector <Math exp='\textbf{w}' /> and the training example{' '}
        <Math exp='\textbf{x}_i' />, giving us a much simpler notation:
        <Math
          block={true}
          exp='\hat{y}_i = \textbf{w} \cdot \textbf{x}_i = \textbf{x}_i\textbf{w}.'
        />
        Then finally if we wanted to predict all $n$ training / testing examples
        in one go, we can just use our training matrix <Math exp='\textbf{X}' />{' '}
        from before to get:
        <Math
          block={true}
          exp='\hat{\textbf{y}} = \textbf{X} \textbf{w} = \begin{bmatrix}
            \hat{y}_1 \\ \hat{y}_2 \\ \ldots \\ \hat{y}_n \end{bmatrix} =
            \begin{bmatrix}
              \text{prediction for example} \hspace{-4.5em} 1 \\
              \text{prediction for example} \hspace{-4.5em} 2 \\
              \ldots \\
              \text{prediction for example} \hspace{-4.5em} n
            \end{bmatrix}.'
        />
        This is just the same as above but if we want to represent all
        prediction results in a vector format.
        {'\n'}
        {'\n'}
        <ThemedText type='textItalic'>
          Note: sometimes, the prediction shape, <Math exp='\hat{y}_i' />, may
          not be a single value but instead a vector of values, where each
          scalar number inside the vector is a prediction for a different
          attribute. It is not strictly necessary that each prediction is a
          single number, but this is usually the case for network outputs.
        </ThemedText>
      </ThemedText>
      <ThemedText type='subsubheading'>A biased model</ThemedText>
      <ThemedText type='text'>
        There is one last minor component to add before we are done with the
        structure of linear networks: the{' '}
        <ThemedText type='textBold'>bias</ThemedText>. For a single-dimensional
        linear model, we are used to learning that the shape of a linear
        function is given by <Math exp='f(x) = wx+b' /> for constants{' '}
        <Math exp='w' /> and <Math exp='b' />.{'\n'}
        {'\n'}
        But we observe that there is no such constant addition here &ndash; we
        have so far only considered the attributes themselves. But what if there
        is a threshold value that all labels have? For example, what if our
        constant-less predictor would consistently predict non-purple colours as
        purple due to achieving a high weighted sum? Regular weight
        multiplications can&apos;t solve this. If we could add a constant value
        to each sum, we might be able to make more useful predictions. This
        constant addition is called a bias.
        {'\n'}
        {'\n'}
        Thankfully, we don&apos;t need to make any significant changes to our
        model to extract the bias. We can do a &quot;trick&quot; where we add
        one more weight than there are attributes, call it <Math exp='w_0' />,
        and create a new attribute in <Math exp='\textbf{x}' />,{' '}
        <Math exp='x_{i0}' />, for each training example and always assign it a
        value of 1. Then observe how the previous formula changes:
        <Math
          block={true}
          exp='\begin{align*}
            \hat{y}_{i} &= w_0 \times 1 + w_1x_{i1} + w_2x_{i2} + \ldots + w_dx_{id} \\
            &= \sum_{j=0}^d w_jx_{ij} = \textbf{x}_i\textbf{w} + w_0.
          \end{align*}'
        />
        This is perfect! We have now successfully added a constant bias term to
        our model without needing to change the key architecture or add any
        additional complexity. We can also view the model visually:
      </ThemedText>
      <Figure
        img={require('@/assets/images/curriculum/stage-2/linear-model-diagram.webp')}
        width={500}
        caption='A diagram of a simple linear model. We feed in the weighted inputs with the bias and out comes the prediction.'
      />
      <ThemedText type='subsubheading'>
        Weight regularisation and overfitting
      </ThemedText>
      <ThemedText type='text'>
        Sometimes if we train our network too well, we can end up getting
        excellent performance on the training data but poor performance on the
        testing data &ndash; the data we have not yet seen. This is like a
        student over-studying on past papers and memorising the answers; they
        can answer questions already seen perfectly, but new questions will
        completely throw them off. This is called{' '}
        <ThemedText type='textBold'>overfitting</ThemedText>. There is also an
        opposite term, <ThemedText type='textBold'>underfitting</ThemedText>,
        for insufficient training, but the former is generally a much greater
        issue in models.
        {'\n'}
        {'\n'}
        We can apply{' '}
        <ThemedText type='textBold'>weight regularisation</ThemedText> to help
        reduce this. The problem emerges when the magnitudes of the weights
        become extremely high, so any kind of change in our inputs causes huge
        changes in our prediction outputs. By applying regularisation we
        increase the loss as the weight numbers get larger, thus trading in a
        small amount of accuracy for much better ability to generalise to new
        testing data. This will have a profound effect on loss landscapes, as
        will be seen later.
      </ThemedText>
      <ThemedText type='subsubheading'>
        The role of loss and loss landscapes
      </ThemedText>
      <ThemedText type='text'>
        So now we&apos;ve fully generated the structure of a linear network. But
        the two important questions remain &ndash; how do we obtain the set of
        best weights for our network <Math exp='\textbf{w}' /> so that we make
        the best predictions, and how do we even judge how &quot;good&quot; a
        set of weights is for making the best predictions with the network?
        {'\n'}
        {'\n'}
        The second question is relatively straightforward; we just take the
        outputs we&apos;ve received, <Math exp='\hat{\textbf{y}}' />, then take
        the true labels <Math exp='\textbf{y}' /> and take the sum of squares of
        the differences between each prediction. We use the square function
        because:
        <OrderedList>
          <ThemedText type='text'>
            It ensures loss is always positive so we will always get a positive
            error
          </ThemedText>
          <ThemedText type='text'>
            It increases disproportionately if our predictions are too far out.
            So in a formula, the loss would just be defined as:
            <Math
              block={true}
              exp='L(\hat{\textbf{{y}}}, \textbf{y}) = \sum_{i=1}^n (y_i-\hat{y}_i)^2 = ||\textbf{y} &ndash; \hat{\textbf{y}}||_2^2'
            />
          </ThemedText>
        </OrderedList>
        {'\n'}
        {'\n'}
        This is just one example of a loss function <Math exp='L' />; there are
        many more, but most neural network predictors and linear models will use
        this one. This one is known as{' '}
        <ThemedText type='textBold'>least squares</ThemedText>, or{' '}
        <ThemedText type='textBold'>mean squared error</ThemedText> if we divide
        by the number of examples (for the purposes of training, these methods
        differ only by a constant factor).
        {'\n'}
        {'\n'}
        And as for the first question, while there is a method called{' '}
        <ThemedText type='textBold'>least-squares regression</ThemedText> that
        would allow us to calculate optimal weights for a linear network (by
        minimising the above loss function), this only works for a linear model,
        so we won&apos;t cover it here as there is a more effective way called{' '}
        <ThemedText type='textBold'>stochastic gradient descent</ThemedText>{' '}
        that works for neural networks{' '}
        <ThemedText type='textItalic'>and</ThemedText> linear models. Just know
        that we know how to calculate the optimal weights for reducing loss.
        {'\n'}
        {'\n'}
        However, the key thing to learn is that for every network, linear or
        neural, the core objective is always the same; to minimise the loss
        function. It may not always be least-squares loss, but it will always be
        an indicator of how much our network&apos;s predictions deviate from the
        training data&apos;s true labels (also called the &quot;ground
        truth&quot;). The more we minimise it , the better our network can
        predict the training data which we hope, will make it good at predicting
        new unseen data as well.
        {'\n'}
        {'\n'}
        But what if we want to see how changing the parameters of our network
        changes the loss in a visual way? So far, we have vaguely handwaved
        about mathematical optimisations to provide the lowest loss. But what if
        that could be done graphically? We could model each weight parameter as
        a dimension, then plot them on a graph against loss. Not only would this
        show us visually where the best combination of weights lies, but it
        would show us the shape of the loss that would tell us much more about
        the nature and behaviour of our network.
        {'\n'}
        {'\n'}A good way to start would be to look at the loss landscapes of our
        existing case study: a linear model to predict whether colours are
        purple. We will train the weights so that if the output is more than
        0.5, the answer is yes, otherwise the answer is no. Then we have 4
        possible parameters &ndash; the 3 weights for the 3 colours (red ={' '}
        <Math exp='w_1' />, green = <Math exp='w_2' />, blue ={' '}
        <Math exp='w_3' />
        ), plus a bias term <Math exp='w_0' />. Then letting the{' '}
        <Math exp='x' />- and <Math exp='y' />
        -axes represent our parameters, we can obtain these landscapes:
      </ThemedText>
      <View
        style={{
          // If width is constrained, use column direction
          flexDirection: 'row',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: 20,
        }}
      >
        <Figure
          img={require('@/assets/images/curriculum/stage-2/landscape-w1-w2.webp')}
          width={250}
          capWidth={250}
          caption={
            <ThemedText>
              The loss landscape over <Math exp='w_1' /> and <Math exp='w_2' />.
            </ThemedText>
          }
        />
        <Figure
          img={require('@/assets/images/curriculum/stage-2/landscape-w0-w2.webp')}
          width={250}
          capWidth={250}
          caption={
            <ThemedText>
              Ditto, for <Math exp='w_0' /> and <Math exp='w_2' />. This
              landscape is a contour map.
            </ThemedText>
          }
        />
        <Figure
          img={require('@/assets/images/curriculum/stage-2/landscape-w0-w1.webp')}
          width={250}
          capWidth={250}
          caption={
            <ThemedText>
              Ditto, for <Math exp='w_0' /> and <Math exp='w_1' />.
            </ThemedText>
          }
        />
      </View>
      <ThemedText type='text'>
        This immediately looks promising &ndash; our human geometric intuition
        paired with the axes can clearly see what choices of parameters yield
        the lowest loss and thus, the best values of the weights. The first and
        third plots rely on 3D plots, while the second substitutes space for
        colour as the third dimension. However, immediately a major problem
        appears; even in this simple model, we had 4 parameters, making it
        impossible to visualise the entire landscape as a single plot and
        forcing us to split it into 3 plots as above. What if we are dealing
        with a network of thousands of parameters? These are all problems we
        will learn to face in the upcoming stages, but it&apos;s food for
        thought for now.
      </ThemedText>
      <ThemedText type='subheading'>
        Activation functions and why linear models fall short
      </ThemedText>
      <ThemedText type='text'>
        Unfortunately, linear models have limits &ndash; by themselves, they
        only excel at modelling data that follows a linear pattern and more
        importantly, is linearly separable. What this means is that if we have a
        set of colour-points which are not purple and a set of those that are
        purple, it should be possible to draw a straight line (or plane) where
        all points on one side of the line are correctly labelled purple and all
        on the other are correctly labelled &quot;not purple&quot;. Depending on
        your definition of what it means for a colour to be &quot;purple&quot;,
        this may or may not be true. But for other types of data, this can
        present a serious problem for accurate predictions.
      </ThemedText>
      <Figure
        img={require('@/assets/images/curriculum/stage-2/linear-regression.webp')}
        width={500}
        caption={
          <ThemedText>
            A plot of a variable <Math exp='x' /> against the prediction{' '}
            <Math exp='y' />. The data is neither cleanly divisible into two
            colours, nor follows a linear growth rate, yet a linear regression
            model is used for prediction.
          </ThemedText>
        }
      />
      <ThemedText type='text'>
        Thus, when linear models fail, they do so for two main reasons:
        {'\n'}
        <UnorderedList>
          <ThemedText type='text'>
            The data is not linearly separable (appears in classification
            tasks).
          </ThemedText>
          <ThemedText type='text'>
            The data does not follow a straight line or linear plane (appears in
            regression tasks).
          </ThemedText>
        </UnorderedList>
        {'\n'}
        {'\n'}
        This is where (nonlinear) activation functions come in. An{' '}
        <ThemedText type='textBold'>activation function</ThemedText> is a
        function denoted <Math exp='\sigma : \mathbb{R} \to \mathbb{R}' /> that
        transforms the input in a nonlinear way. Common examples include:
      </ThemedText>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: 20,
        }}
      >
        <Figure
          img={require('@/assets/images/curriculum/stage-2/tanh.webp')}
          width={250}
          caption={<Math exp='\tanh(x)' />}
        />
        <Figure
          img={require('@/assets/images/curriculum/stage-2/sigmoid.jpg')}
          width={250}
          caption={
            <ThemedText>
              Sigmoid: <Math exp='\sigma(x) = \frac{1}{1 + e^{-x}}' />
            </ThemedText>
          }
        />
        <Figure
          img={require('@/assets/images/curriculum/stage-2/relu.webp')}
          width={250}
          caption={<Math exp='\text{ReLU}\hspace{-0.3em}(x) = \max(0, x)' />}
        />
      </View>
      <ThemedText type='text'>
        Something all these functions share in common is:
        {'\n'}
        <UnorderedList>
          <ThemedText type='text'>
            They are nonlinear (allowing them to separate and predict nonlinear
            data)!
          </ThemedText>
          <ThemedText type='text'>
            They have well-defined first derivatives (essential for training the
            weights).
          </ThemedText>
          <ThemedText type='text'>
            They are not decomposable into purely linear functions.
          </ThemedText>
        </UnorderedList>
        {'\n'}
        {'\n'}
        Being nonlinear negates the two problems above. Thus, applying an
        activation function will greatly improve the expressive power of a
        linear model, and also forms the basis of multilayer neural networks.
        However, this also impacts the appearance of the loss landscape, since
        as the predictions are nonlinear the loss will be as well. For ReLU
        (Rectified Linear Unit), which has a &quot;kink&quot; at{' '}
        <Math exp='x=0' />, expect to see a spikier landscape, and for{' '}
        <Math exp='\tanh' /> and <Math exp='\sigma' />, expect a smoother loss
        landscape. These are not trivial details &ndash; the properties and
        shapes of the landscapes will be vital in determining how well the
        models can be optimised to minimise loss.
      </ThemedText>
      <Figure
        img={require('@/assets/images/curriculum/stage-2/landscapes-sigmoid-relu.webp')}
        width={700}
        caption='The loss landscape appearances for the above regression/classification task, but using different activation functions (Sigmoid and ReLU respectively).'
      />
      <ThemedText type='subsubheading'>
        So how do we combine these with a linear model?
      </ThemedText>
      <ThemedText type='text'>
        Simple &ndash; just compute the linear model&apos;s output as always,
        but then apply the activation function using the result as the input.
        This gives us the flexibility of the activation function and the
        structure of the linear model without the weaknesses of either alone. So
        now we have:
        <Math
          block={true}
          exp='\hat{y}_i = \sigma \left( \textbf{x}_i\textbf{w} + w_0 \right)'
        />
        or more generally for the full set of training examples:
        <Math
          block={true}
          exp='\hat{\textbf{y}} = \sigma \left( \textbf{Xw} + w_0 \right)'
        />
        Where we apply our activation function <Math exp='\sigma' /> to each
        element <Math exp='\hat{y}_i' /> in the prediction{' '}
        <Math exp='\hat{\textbf{y}}' /> &ndash; so whenever you see this
        notation, just know that&apos;s what the intended functionality is. The
        downside of doing this is that now we lose the ability to perform
        least-squares regression to find the optimal set of weights. The upside
        is that it opens the door to a far greater realm of possibilities and
        expressive power &ndash; multilayer neural networks. This step is what
        will take us from predicting toy examples like whether a colour is
        purple to solving tasks with real-world utility like facial recognition
        and predicting market stock prices, with a vast increase to the
        network&apos;s computation power.
      </ThemedText>
      <ThemedText type='subheading'>
        Multilayer neural networks and the next steps
      </ThemedText>
      <ThemedText type='text'>
        <ThemedText type='textBold'>Multilayer neural networks</ThemedText> are
        the result when you take many linear models, and for each linear model
        apply an activation function to the output, then set that output as the
        input to the next linear model. Do this some number of times and now you
        have a multilayer neural network. Seems straightforward, but this simple
        combination of networks can result in dramatically higher expressive
        power and model far more complex relationships between data. And in
        doing so, this also leads to dramatically more complex and vivid loss
        landscapes, which means that training these networks often requires much
        more computation power and intelligent training algorithms than for a
        simple linear network.
        {'\n'}
        {'\n'}
        And yes, everything that we talked about in a linear network will also
        be applicable here, since a multilayer network is not much more
        conceptually complex. Weights, biases, regularisation, etc.
      </ThemedText>
      <Figure
        img={require('@/assets/images/curriculum/stage-2/nn-3-layer.webp')}
        width={500}
        caption='A diagram of a simple neural network with 3 layers.'
      />
      <ThemedText type='text'>
        To complicate matters more, relying on simply visualising the loss
        landscape no longer works, as the number of possible parameters is so
        vast that it&apos;s impossible to visualise them, even in a reduced
        form. And even if it were, actually visualising the loss landscape is
        not a free task; it requires sampling the loss of the network over a
        grid of potential points, and the size of that grid increases
        exponentially with the number of parameters (
        <Math exp='\mathcal{O}(k^d)' /> for <Math exp='k' /> intervals and{' '}
        <Math exp='d' /> dimensions). To try and create a picture of the loss
        for multilayer perceptrons as they&apos;re called, we&apos;ll have to
        think outside the box.{' '}
        <ThemedText type='textItalic'>Literally.</ThemedText> More on this in
        stage 3!
      </ThemedText>
      <Figure
        img={require('@/assets/images/curriculum/stage-2/landscape-skips.webp')}
        width={700}
        caption='Visualisations of the loss landscapes of a neural network. For those without modifications (left), the landscape is extremely complex and non-convex.'
      />
      <ThemedText type='text'>
        But back to neural networks. We&apos;ve already explored the fundamental
        limitations of linear models and why applying activation functions can
        remedy some of these issues. But why would we believe that connecting
        them together like this will do anything to increase their power?
        {'\n'}
        {'\n'}
        To answer this, imagine if we did{' '}
        <ThemedText type='textItalic'>not</ThemedText> include the activation
        functions. Then we would simply be applying a repeated number of linear
        transformations to the data one-after-another. But it&apos;s well known
        that applying a linear transformation to an existing linear
        transformation is just a different linear transformation! So yes, if we
        didn&apos;t include nonlinear activations, this plan would be pointless.
        <View style={{ alignItems: 'center' }}>
          <Math
            block={true}
            exp='\textbf{C}(\textbf{AX}+\textbf{B})+\textbf{D} = \textbf{(CA)X} + (\textbf{CB}+\textbf{D}) = \textbf{MX}\; + \textbf{N}'
          />
          <ThemedText
            style={{
              fontSize: 14,
              lineHeight: 18,
              fontStyle: 'italic',
              textAlign: 'center',
            }}
          >
            A mathematical justification for why applying two linear
            transformations is no more complex than applying a single different
            linear transformation. Here,{' '}
            <Math exp='\textbf{M}\; = \textbf{CA}' />
            , <Math exp='\textbf{N} = \textbf{CB} + \textbf{D}' />.
          </ThemedText>
        </View>
        {'\n'}
        {'\n'}
        However, when we apply nonlinear activations, this &quot;breaks&quot;
        the chain of linearity, which means the more layers we add, the less
        linear our network becomes. This reduced linearity means that eventually
        our network can approximate any function! As each stage adds more
        complexity to the process, which can be used to model increasingly
        complex datasets. The first linear model &ndash; or the first layer
        &ndash; is called the input layer, the last model that gives the
        prediction is called the output layer, and all layers in-between are
        called hidden layers &ndash; named so since the user doesn&apos;t
        directly interact with them except for debugging purposes.
        {'\n'}
        {'\n'}
        As for the maths, this is just reapplying the linear model with an
        activation function over and over:
        <Math
          block={true}
          exp='\hat{\textbf{y}} = \sigma_L \left( \textbf{X}\textbf{W}_{\;1} + \textbf{b}_1 \right) \textbf{W}_{\;2} + \textbf{b}_2 \ldots \textbf{W}_{\;L} + \textbf{b}_L )'
        />
        This is for a 3-layer network, and we number the activation functions{' '}
        <Math exp='\sigma_1' />, <Math exp='\sigma_2' />,{' '}
        <Math exp='\sigma_3' />, and the biases and weights accordingly to
        correspond to the layers. This may look frightening but it&apos;s
        actually just reapplying the linear model from before 3 times in a row.
        Note that the activation functions here prevent the devolution into a
        simple linear model like in the proof above. Also note that our bias is
        no longer a scalar value; its a vector now, since neural networks can be
        trained to give different biases for different inputs.
      </ThemedText>
      <ThemedText type='subheading'>Features of 3D+ loss landscapes</ThemedText>
      <ThemedText type='text'>
        These are features that can appear in all loss landscapes and ones that
        you should look out for, as they can signify different properties about
        the network itself and the training data. While we cannot visualise data
        spatially in more than 3 dimensions, they still very much exist with
        more parameters and can be experienced by the training process.
      </ThemedText>
      <ThemedText type='subsubheading'>Ridges</ThemedText>
      <ThemedText type='text'>
        These indicate a rapid descent or ascent in the loss of the network,
        implying that a parameter should not exceed or fall beneath a certain
        interval of values or else the loss will increase sharply.
      </ThemedText>
      <Figure
        img={require('@/assets/images/curriculum/stage-2/landscape-ridges.webp')}
        width={500}
        caption='A visual interpretation of ridges in the loss landscape.'
      />
      <ThemedText type='subsubheading'>Hills and sinkholes</ThemedText>
      <ThemedText type='text'>
        These indicate a specific combination of values where the loss is
        particularly high (hills) or particularly low (sinkholes), and usually
        correspond to local maxima &ndash; where the loss is highest in the
        vicinity, or to local minima &ndash; where it is lowest.
      </ThemedText>
      <Figure
        img={require('@/assets/images/curriculum/stage-2/landscape-hills.webp')}
        width={500}
        caption='Hills (high points) with a sinkhole ahead.'
      />
      <ThemedText type='subsubheading'>Saddle points</ThemedText>
      <ThemedText type='text'>
        These are areas that are relatively flat and the gradient is zero (so no
        inclines), but not at a hill or sinkhole. These are often very
        problematic for training networks because the loss minimising algorithms
        try to follow the path of steepest descent &ndash; i.e. which direction
        in parameter-land to go to that reduces the loss. But since the gradient
        here is nonexistent, this can confuse the network into halting training
        early. They are named so because they look like saddles in 3D.
      </ThemedText>
      <Figure
        img={require('@/assets/images/curriculum/stage-2/saddle.webp')}
        width={300}
      />
      <ThemedText type='subsubheading'>Plateaus</ThemedText>
      <ThemedText type='text'>
        These are large flat areas where the loss does not change much
        regardless of parameter changes. These can also be problematic for
        training, as the lack of gradient can lead to slow convergence or
        stagnation in training progress.
      </ThemedText>
      <Figure
        img={require('@/assets/images/curriculum/stage-2/plateau.webp')}
        width={500}
        caption='Plateaus at the front with hills and sinkholes behind them.'
      />
      <ThemedText type='subsubheading'>Valley</ThemedText>
      <ThemedText type='text'>
        A path-like shape of low loss that is surrounded by areas of very high
        loss. It is often very beneficial to learning for finding local minimas
        (and thus completing the training with minimal loss).
      </ThemedText>
      <Figure
        img={require('@/assets/images/curriculum/stage-2/valley.webp')}
        width={500}
        caption='A valley in the centre of this image showing where the loss is lowest.'
      />
      <ThemedText type='subheading'>
        Hyperparameters and their importance in determining the loss landscape
      </ThemedText>
      <ThemedText type='text'>
        What is a <ThemedText type='textBold'>hyperparameter</ThemedText>?
        It&apos;s something that cannot be learnt by the network during training
        &ndash; but is manually selected by the network designer. Values like
        the weights and biases of a network are regular parameters; these are
        learnt automatically in network training and don&apos;t need to be
        manually set by us. However, the choice of activation function, the
        number of attributes in the hidden layers of the network and how we
        stabilise the training? These are all hyperparameters, because it&apos;s
        impossible for the network to learn these &ndash; they have to be
        manually set.
        {'\n'}
        {'\n'}
        And of course, changing the hyperparameters will also change the shape
        of our loss landscape. We&apos;ve already seen how changing activation
        functions can change the shape, but so too can the width of the network,
        the depth, the weight regularisation, and much more. Let&apos;s have a
        look in more detail.
      </ThemedText>
      <ThemedText type='subsubheading'>
        Changing the weight regularisation scheme
      </ThemedText>
      <ThemedText type='text'>
        As increasing the magnitude of weights can dramatically raise the loss
        output, adding regularisation will create a &quot;sinkhole radius&quot;
        around the origin where, as parameters increase in value, the steepness
        of the landscape will dramatically increase in a circle. More forgiving
        weight regularisation schemes like L1 may lead to shallower inclines.
      </ThemedText>
      <Figure
        img={require('@/assets/images/curriculum/stage-2/landscape-reg.webp')}
        width={700}
        caption='Visualisation of loss landscape as the regularisation strength increases.'
      />
      <ThemedText type='subsubheading'>
        Changing the choice of activation function
      </ThemedText>
      <ThemedText type='text'>
        We&apos;ve seen this already in simple linear models, but since each
        layer can have different activation functions this time, there is a much
        wider variety of combinations and thus loss shapes. In general, the
        shape of the loss landscapes will be broadly reminiscent of the shape of
        the activation functions used.
      </ThemedText>
      <ThemedText type='subsubheading'>
        Changing the number of neurons (attributes) per layer
      </ThemedText>
      <ThemedText type='text'>
        This will increase the expressive power of the network, as the more
        neurons, the more possible combinations and features in the data that a
        layer can learn. However, it can also lead to overfitting and thus
        create a much less convex (smooth) loss landscape with more hills,
        inclines, and saddle points.
      </ThemedText>
      <Figure
        img={require('@/assets/images/curriculum/stage-2/landscape-layers.webp')}
        width={400}
        caption='Increasing the number of layers can dramatically increase the sensitivity of the network to data, creating a much more chaotic loss landscape.'
      />
      <ThemedText type='subsubheading'>
        Changing the number of layers (linear models) in the network
      </ThemedText>
      <ThemedText type='text'>
        With more layers, the network can learn a greater set of features in the
        data and generalise better. However, this will also open the door to
        overfitting and a dramatically less convex landscape, even greater
        effect than the number of neurons.
      </ThemedText>
      <ThemedText type='subheading'>
        How can we make landscapes smoother?
      </ThemedText>
      <ThemedText type='text'>
        While hills and valleys in loss landscapes often appear beautiful and
        visually stunning, they are unfortunately often detrimental to the
        training process. The less smooth and organised (convex) a loss
        landscape is, the harder time the training algorithms will have in
        trying to find the set of parameters for the network that minimises
        loss. The key steps we can take are:
        <UnorderedList>
          <ThemedText type='text'>
            <ThemedText type='textBold'>
              Introduce weight regularisation
            </ThemedText>{' '}
            to avoid overfitting and reduce the size of the viable loss space,
            providing a smaller area and easier time for the model to find a
            minimum.
          </ThemedText>
          <ThemedText type='text'>
            <ThemedText type='textBold'>
              Avoid adding more deep layers into the network
            </ThemedText>{' '}
            than necessary for accurate prediction. If more accuracy is needed,
            focus on increasing the number of neurons (attributes) per layer,
            rather than adding new layers. This prevents lots of small crevices
            and crannies from appearing.
          </ThemedText>
          <ThemedText type='text'>
            <ThemedText type='textBold'>
              Introduce smooth activation functions
            </ThemedText>
            . These will prevent spiky areas which are troublesome to compute
            the derivative of, thus making optimisation easier. It will also
            keep the landscape smooth.
          </ThemedText>
        </UnorderedList>
      </ThemedText>
    </>
  );
}
