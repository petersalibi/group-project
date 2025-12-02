import { ThemedText } from '@/components/themed-text';
import { OrderedList, UnorderedList } from '@/components/text-list';
import Math from '@/components/math';
import { Link } from 'expo-router';
import Figure from '@/components/figure';

export default function Explanations() {
  return (
    <>
      <ThemedText type='title'>Explanations of key concepts</ThemedText>
      <ThemedText type='subheading'>
        Principal Component Analysis &ndash; visualising the ball
      </ThemedText>
      <ThemedText type='text'>
        In this simulation, we train a neural network model to learn from a
        small, simplistic training dataset with a wide variety of parameters
        over a large number of iterations. With each iteration, the network
        learns and its parameters fluctuate and adapt, creating an
        &quot;optimisation path&quot; that reduces the loss &ndash; the
        difference between the model&apos;s predictions and the true training
        outcomes. If only two parameters were used, this is visualisable as a
        landscape surface, providing a geometric interpretation of seeing a ball
        &ndash; representing the model&apos;s parameters &ndash; shifting and
        falling down a hill of loss to the bottom. This is an excellent learning
        tool as it harnesses the power of human intuition and sight to
        understand visually how the optimisation process learnings by likening
        it to the force of gravity. It also provides an exact understanding of
        where the model and landscape fit with respect to each other and how
        changing positions of the model would change its trajectory &ndash; by
        using the analogy of gravity.
        {'\n'}
        {'\n'}
        However, such a visualisation is, at least at first, impossible to
        replicate to any non-trivial network. A network with any more than two
        parameters would require more than 3 dimensions to visualise its
        trajectory, a feat well beyond human interpretability. Using contour
        maps or scatter points with colour as the fourth dimension would only
        allow a single extra parameter &ndash; a drop in the bucket given the
        size of conventional networks &ndash; while still destroying the
        geometric interpretation. This is not the only problem, as building the
        landscape itself takes substantial time &ndash; time that increases
        exponentially with respect to the dimension, as a <Math exp='d' />
        -dimensional grid must be built up and the loss evaluated, itself a
        costly endeavour. So, given all these challenges, it seems that this is
        not a practical visualisation tool for conventional networks with
        parameter spaces in the order of tens of thousands or even millions.
        {'\n'}
        {'\n'}
        This, however, is an oversimplification. The reality is that the
        conventional model of using each parameter in the network as its own
        independent dimension, while simple to conceptualise and logically
        consistent, is an extremely inefficient use of visualisation; since most
        parameter values will behave predictably as we train the network -
        increasing or decreasing gradually, or a sudden, abrupt shift, we simply
        <ThemedText type='textBold'>{' do not need'}</ThemedText> to represent
        every single parameter in a visualisation. We do not need to find the
        entire landscape, only the trajectory of our network parameters as we
        train the network.
        {'\n'}
        {'\n'}
        This is where the use of PCA comes in. This is a way to
        &quot;compress&quot; the dimensionality of a high-dimensional space into
        a lower-dimensional one while attempting to maximise the variation
        &ndash; and thus actual useful information &ndash; of the landscape. Put
        simply, if the vast majority of the landscape we want to visualise is
        useless noise (which it is), then PCA is capable of reducing a
        multi-dimensional problem back into a 3-dimensional one. The
        &quot;ball&quot; still exists, it&apos;s simply locked in a high
        dimensional space. PCA returns us to a visualisable 3D space, which in
        effect allows us to provide the &quot;ball rolling down a hill&quot;
        view for any arbitrary dimension number and unlike random directions,
        minimising loss of variability or expressiveness; as PCA returns a
        projection function, any point on our higher dimensional space can be
        expressed as a point on a 3D space. Thus, we have our visualisations.
      </ThemedText>
      <Figure
        img={require('@/assets/images/curriculum/explanations/loss-animation.webp')}
        width={500}
        aspectRatio={1.1}
        caption='A visualisation of an early iteration of this PCA ball visualisation model.'
      />
      <ThemedText type='text'>
        But how can we accomplish this? PCA ball visualisation follows these key
        steps:
        <OrderedList>
          <ThemedText type='text'>
            Train the neural network on the training data as usual.
          </ThemedText>
          <ThemedText type='text'>
            For each training iteration, we record the parameter vector of the
            neural network. Because of the specific structure of highly complex
            networks, we will need to build a function to map the structural
            state of the network with its parameters into a vector (and an
            inverse function to map vectors into structural states). This is
            easily achievable using PyTorch&apos;s built-in functionality.
          </ThemedText>
          <ThemedText type='text'>
            After repeating this for all <Math exp='t' /> training iterations
            and with <Math exp='d' /> parameters in the network, we now have a{' '}
            <Math exp='t \times d' /> matrix of values representing the
            network&apos;s parametric trajectory.
          </ThemedText>
          <ThemedText type='text'>
            Optional step (highly recommended for adequate landscape
            construction) &ndash; for each &quot;location&quot; our high
            dimensional ball exists in this high-dimensional space, we follow
            this step some arbitrarily large number of times: move the ball in
            some random direction using a permutation (movement) vector, then
            record this as part of the trajectory. This will give us many more
            datapoints with which to feed into PCA to construct a more accurate
            3-dimensional loss landscape.
          </ThemedText>
          <ThemedText type='text'>
            Take the now <Math exp='(t+p) \times d' /> trajectory matrix{' '}
            <Math exp='\mathbf{M}' /> (where <Math exp='p' /> is the number of
            random permutations performed in step 4) and compute the loss of the
            network at each point, storing it in array <Math exp='L' />. This
            will be used to build the landscape later.
          </ThemedText>
          <ThemedText type='text'>
            Perform principal component analysis on <Math exp='\mathbf{M}' />.
            In effect, this means constructing two matrices,{' '}
            <Math exp='\mathbf{Z}' /> and <Math exp='\mathbf{W}' />, which when
            matrix-multiplied together return the matrix{' '}
            <Math exp='\mathbf{M}' />, <Math exp='\mathbf{ZW} = \mathbf{M}' />.
            The exact specifics of finding these two matrices relies on
            eigenvalues and eigenvectors and a process called singular value
            decomposition, which is what will be learnt and fully covered in the{' '}
            <Link href='https://warwick.ac.uk/fac/sci/dcs/teaching/modules/cs342/'>
              <ThemedText type='link'>CS342 Machine Learning</ThemedText>
            </Link>{' '}
            module. This is effectively the same as a linear model with weights{' '}
            <Math exp='\mathbf{W}' /> and transformed parameter space{' '}
            <Math exp='\mathbf{Z}' /> &ndash; the actual coordinates of the
            transformed space. So now, we can use the two matrices to map any
            point on the high dimensional space to the low dimensional ones.
            Note that this <Math exp='\mathbf{Z}' /> matrix can be of whatever
            dimension we want, including <Math exp='d=2' /> (the third will be
            the loss itself on the z-axis). This is the key step that allows us
            to do the mapping. This will give us the two directions of maximum
            variance in the data &ndash; in other words, the best compression
            into a viewable space!
          </ThemedText>
          <ThemedText type='text'>
            Now that we have our points, take all the trajectory points in{' '}
            <Math exp='\mathbf{M}' /> and map them onto the new dimensional
            space and we can then compute the loss landscape.
          </ThemedText>
          <ThemedText type='text'>
            As an optional step, to save on computation time, we can perform
            cubic interpolation between the points to build a smoother loss
            landscape without needing to sample more points.
          </ThemedText>
          <ThemedText type='text'>
            Now that the landscape is constructed, the ball&apos;s movement can
            be visualised and animated by taking each point in turn and placing
            the ball on that space on the 3D loss surface, just like a regular
            loss landscape!
          </ThemedText>
        </OrderedList>
        {'\n'}
        {'\n'}
        The benefits of this approach are clear &ndash; it generalises the
        ability to visualise the loss in a meaningful (since variation in the
        data is optimal with PCA), useful and most importantly viewable way. It
        also drastically saves up on computation time, as we no longer need to
        sample an exponentially increasing d dimensional grid of points &ndash;
        only a 2-dimensional one, allowing for efficient computation. The only
        major downside is interpretability &ndash; what does it mean to have PCA
        directions 1 and 2? What parameters do these represent? While they are
        (provably!) meaningful, trying to explain this to a layman audience or
        one new to machine learning will prove difficult, and that&apos;s the
        key flaw of this approach.
      </ThemedText>
      <ThemedText type='subsubheading'>Advantages</ThemedText>
      <UnorderedList>
        <ThemedText type='text'>
          Generalisable to any number of dimensions and thus any size of neural
          network
        </ThemedText>
        <ThemedText type='text'>
          Much faster and more efficient than gridwise point sampling for{' '}
          <Math exp='> 2' /> dimensions
        </ThemedText>
        <ThemedText type='text'>
          Can express any point on high-dimensional space &ndash; not
          constrained to a subset
        </ThemedText>
        <ThemedText type='text'>
          Can be animated with a ball &ndash; preserving human geometric
          intuition
        </ThemedText>
      </UnorderedList>
      <ThemedText type='subsubheading'>Disadvantages</ThemedText>
      <UnorderedList>
        <ThemedText type='text'>
          Loss of interpretability &ndash; need to explain what each PCA
          dimension represents
        </ThemedText>
        <ThemedText type='text'>
          PCA itself is very complicated to compute &ndash; easy to do with
          existing modules, but is a black box &ndash; hard to explain how it
          reduces dimensionality
        </ThemedText>
        <ThemedText type='text'>
          Shape of loss landscape is dependent on trajectory taken by ball
          &ndash; not independent (however in theory this can be fixed)
        </ThemedText>
      </UnorderedList>
      <ThemedText type='subheading'>
        Instability analysis &ndash; clustering and classification
      </ThemedText>
      <ThemedText type='text'>
        This method was also directly developed by the team and is a way of
        measuring the instability of a clustering or classification algorithm.
        While initially developed for clustering (and this explanation will be
        on that topic), it is not difficult to extend and generalise the concept
        to classification tasks as there is significant overlap &ndash;
        clustering is, after all, just classification without labels.
        {'\n'}
        {'\n'}
        For the purposes of this task, we are interested in determining how well
        a training data set responds to a clustering algorithm or conversely,
        for a fixed dataset, how strong a clustering algorithm is in generating
        meaningful clusters for that dataset. While there exist plenty of
        metrics already for analysing the validity of clusters themselves, what
        is not yet captured is which areas on the dataset space are the
        &quot;hardest&quot; to cluster compared with others. For example, if our
        dataset contained two very dense regions of points separated by a large
        gap, it would be easy to point out (and for a clustering algorithm to
        point out) that these are two different clusters. But what if they are
        closer and more spaced apart? Then where would one cluster end and the
        other begin?
        {'\n'}
        {'\n'}
        These are subtle nuances that the clustering algorithm must learn,
        almost always through iterative training and re-clustering. But no
        learning is possible without change. Each time the algorithm changes its
        mind on a specific datapoint it creates an area of instability. As the
        iterations build up, then we will have some regions the clustering
        algorithm was decisive on as to which cluster it belonged to, and others
        which it was not so sure about. The more areas of uncertainty &ndash; or
        instability &ndash; the less effective the clustering algorithm is at
        assigning clusters to points in those regions, and thus the less
        effective it is on the general dataset. This is very useful because it
        allows us to determine if the dataset is actually valid for clustering,
        or if it is, which areas are the most difficult to cluster and to focus
        on those areas. It will also, as will be seen, provide a way of
        measuring for a given pair of dataset and algorithm, the overall
        instability or &quot;indecisiveness&quot; level of the algorithm on the
        dataset.
        {'\n'}
        {'\n'}
        The 3 key ingredients we will generate are:
        <OrderedList>
          <ThemedText type='text'>
            The <ThemedText type='textBold'>instability map</ThemedText> &ndash;
            this is a function that maps data points in the high dimensional
            space to a value that describes how difficult it was to learn which
            cluster a point with those coordinates would belong to. For 2
            dimensions, this can be visualised.
          </ThemedText>
          <ThemedText type='text'>
            The{' '}
            <ThemedText type='textBold'>instability distribution</ThemedText>{' '}
            &ndash; generated from the instability map, this is a kernel density
            estimate (KDE) where for each possible level of instability,
            provides a value giving what portion of the overall dataset space
            was assigned that instability score by the instability map. As this
            is a probability distribution, it must sum to 1. The values are
            generated by an instability function that takes in the history of
            cluster assignments to that point and returns a real number &ndash;
            this is usually the &quot;jump&quot; function, or how many times the
            cluster changes throughout the history, averaged out over many
            iterations.
          </ThemedText>
          <ThemedText type='text'>
            The <ThemedText type='textBold'>instability index</ThemedText>{' '}
            &ndash; generated from the instability distribution, this is the
            &quot;expected instability&quot; of the dataset and clustering
            algorithm, or in other words the expected instability value. It is
            given by:
            {'\n'}
            <Math
              block={true}
              exp='\mathbf{I}(\mathbf{D}, \mathbf{A}) = N \left( \int_{v} v \, P(v) \, dv \right)'
            />
            {'\n'}
            where <Math exp='D' /> is the dataset space (defined by the
            hypercuboid with side lengths equal to the range of each attribute),{' '}
            <Math exp='A' /> is the clustering algorithm, and <Math exp='P' />{' '}
            is the instability distribution. <Math exp='N' /> is a normalisation
            function to allow instability indices to be comparison, typically a
            max&ndash;min normalisation. The values <Math exp='v' /> are the
            values along the instability distribution.
          </ThemedText>
        </OrderedList>
        {'\n'}
        {'\n'}
        But how do we measure this over the entire dataset space, which, like
        the previous example, could be a vast number of dimensions? All regular
        solutions seem computationally intractable, very much like the past
        example.
      </ThemedText>
      <Figure
        img={require('@/assets/images/curriculum/explanations/instability-map.webp')}
        width={500}
        aspectRatio={1.25}
        caption='An example instability map for a clustering algorithm on a 2D dataset. The red areas are highly unstable, while the blue areas are very stable.'
      />
      <Figure
        img={require('@/assets/images/curriculum/explanations/instability-histogram.webp')}
        width={500}
        aspectRatio={1.5}
        caption='The corresponding instability distribution (labelled histogram, but same).'
      />
      <ThemedText type='text'>
        The process is this:
        <OrderedList>
          <ThemedText type='text'>
            Generate a set of randomly distributed points{' '}
            <Math exp='\textbf{p} = \{x_i\in \textbf{D}\}_1^n' />.
          </ThemedText>
          <ThemedText type='text'>
            Run the algorithm <Math exp='\textbf{A}' /> as many iterations as
            required or desired.
          </ThemedText>
          <ThemedText type='text'>
            For each iteration of the algorithm and for each point in{' '}
            <Math exp='\textbf{p}' />, record which cluster the point was
            assigned to.
          </ThemedText>
          <ThemedText type='text'>
            Use the instability function for each point to compute the
            corresponding instability value <Math exp='v(\textbf{x})' />.
          </ThemedText>
          <ThemedText type='text'>
            Repeat this some constant, large number of times and average the
            results &ndash; use the same points and then take the average
            instability value for each one.
          </ThemedText>
          <ThemedText type='text'>
            Use interpolation &ndash; linear is optimal &ndash; to build the
            instability map. You may optionally want to record more points in
            using this interpolation, but it would be better to simply increase
            the number of points beforehand.
          </ThemedText>
          <ThemedText type='text'>
            Build the instability distribution using the map, using a KDE
            builder like Gaussian kernels for example.
          </ThemedText>
          <ThemedText type='text'>
            Compute the instability index using the formula. The sum of all the
            points will approximate the integral so the more points used the
            more accurate the index.
          </ThemedText>
        </OrderedList>
        {'\n'}
        {'\n'}
        For classification, the guide is basically the same, but we replace
        clustering algorithm iterations with classification training iterations,
        and the set of points is exactly the set of training examples in our
        data &ndash; then we just check if the prediction matches the label and
        record the instability through that.
      </ThemedText>
      <ThemedText type='subsubheading'>Advantages</ThemedText>
      <UnorderedList>
        <ThemedText type='text'>
          Generalisable for any number of dimensions
        </ThemedText>
        <ThemedText type='text'>
          Applicable to both clustering and classification
        </ThemedText>
        <ThemedText type='text'>
          For 2 dimensions, instability map can be visualised
        </ThemedText>
        <ThemedText type='text'>
          Intuitive and useful for identifying hard points in clustering/
          classification
        </ThemedText>
        <ThemedText type='text'>
          Only small number of hyperparameters (Jump function, normalisation
          function)
        </ThemedText>
        <ThemedText type='text'>
          For same data, can compare two algorithms to check their instability
          levels (assuming normalised maps)
        </ThemedText>
      </UnorderedList>
      <ThemedText type='subsubheading'>Disadvantages</ThemedText>
      <UnorderedList>
        <ThemedText type='text'>
          Relies on point sampling &ndash; as dimensionality increases will
          require more points to perform accurately &ndash; hence Monte Carlo
          sampling used
        </ThemedText>
        <ThemedText type='text'>
          Requires averaging out over many iterations due to the uncertainty
          introduced from random start points found in many clustering and
          classification algorithms. Together with point sampling, time
          complexity can become substantial
        </ThemedText>
        <ThemedText type='text'>
          Not every clustering or classification algorithm trains over
          iterations &ndash; not applicable here
        </ThemedText>
        <ThemedText type='text'>
          Hyperparameter choice may influence results
        </ThemedText>
        <ThemedText type='text'>
          May gain additional hyperparameters from the algorithm, depending on
          choice
        </ThemedText>
      </UnorderedList>
      <ThemedText type='subheading'>
        Visualising multi-dimensional loss landscapes through higher dimensions
      </ThemedText>
      <ThemedText type='text'>
        This is the most industry-standard way to visualise the loss landscape
        of a nontrivial neural network. Like with the ball examples, attempting
        direct visualisation over the whole parameter space with each parameter
        representing a dimension is not feasible. However, if we focus on only a
        single line or plane passing through the parameter space, then this can
        be visualised, since every shape that can be imagined in 3 dimensions
        also exists in 4+ dimensions, just as every shape imaginable in 2
        dimensions exists in 3. It works by starting at a specified point,
        usually an already found minimum (or else the results would not be
        meaningful) and then selecting two random vectors. Because we are in a
        high-dimensional space, the likelihood these two random vectors are
        perpendicular is almost 100% &ndash; this property means that it&apos;s
        almost certain then we can use any pair of random vectors we find as the
        &quot;axes&quot; of our 2-dimensional plane. So if we have starting
        location <Math exp='\textbf{x} \in \mathbb{R}^d' />, which for our
        purposes would represent a vector of network weights that produces a
        local loss minimum, and we have random vectors <Math exp='\textbf{p}' />{' '}
        and <Math exp='\textbf{q}' />, then we can “move” along this plane using
        the formula:
        <Math
          block={true}
          exp='f(\alpha, \beta) = L(\textbf{x} + \alpha \textbf{p} + \beta \textbf{q})'
        />
        Where <Math exp='L' /> is the loss function (since we need to establish
        the loss to plot the landscape) and we can imagine alpha and beta as the
        x- and y-axes of a plane. Note that in order to ensure the axes are of
        the same scale, we need to normalise <Math exp='\textbf{p}' /> and{' '}
        <Math exp='\textbf{q}' /> so that their Euclidean norms are equal to 1,
        or else it would create visual distortions. Then once we&apos;ve moved
        some direction in each random vector away from the starting point{' '}
        <Math exp='\textbf{x}' />, this represents a possible space of
        parameters for the neural network &ndash; so we can load in those
        parameters and compute the loss on the training data.
        {'\n'}
        {'\n'}
        Once we have iterated over enough values for alpha and beta and recorded
        the loss for each to get triples of points, we can then plot a 3D loss
        surface, with alpha and beta as the x- and y-axes and the loss as the
        z-axis. This will generate a loss surface as required, but it is
        important to note that this{' '}
        <ThemedText type='textBold'>
          only visualises loss for the local plane we selected with{' '}
          <Math exp='\textbf{x}' />, <Math exp='\textbf{p}' /> and{' '}
          <Math exp='\textbf{q}' />
        </ThemedText>{' '}
        &ndash; although mathematical analysis shows it is generally quite
        representative of how convex the loss landscape is as a whole.
      </ThemedText>
      <Figure
        img={require('@/assets/images/curriculum/explanations/loss-contour.webp')}
        width={700}
        aspectRatio={4.4}
        caption='The loss landscape, portrayed as a contour map. Each coloured ring represents a magnitude of loss.'
      />
      <ThemedText type='subsubheading'>Summary of core steps</ThemedText>
      <ThemedText type='text'>
        <OrderedList>
          <ThemedText type='text'>
            Train a neural network and identify a local minimum to get{' '}
            <Math exp='\textbf{x}' />
          </ThemedText>
          <ThemedText type='text'>
            Generate two random vectors to get{' '}
            <Math exp='\textbf{p} = \frac{\textbf{p}^*}{||\textbf{p}^*||}' />{' '}
            and{' '}
            <Math exp='\textbf{q} = \frac{\textbf{q}^*}{||\textbf{q}^*||}' />
          </ThemedText>
          <ThemedText type='text'>
            Compute <Math exp='f(\alpha, \beta)' /> by sliding over a grid of
            possible pairs, computing the loss for each point
          </ThemedText>
          <ThemedText type='text'>
            Plot the 3-dimensional loss landscape, with{' '}
            <Math exp='\alpha, \beta' /> as the independent axes (or
            alternatively, 2-dimensional with a contour map, using colour as the
            third dimension.).
          </ThemedText>
        </OrderedList>
        {'\n'}
        {'\n'}
        <ThemedText type='text'>
          In general this is a much simpler approach than the PCA model, with
          its own advantages and tradeoffs. It has been the most standard way to
          visualise loss in high-dimensional landscapes due to its
          representative nature of the whole network, allowing for greater
          insights into how convex (or well suited to finding minima) a
          network&apos;s parameters for a dataset are.
        </ThemedText>
      </ThemedText>
      <ThemedText type='subsubheading'>Advantages</ThemedText>
      <UnorderedList>
        <ThemedText type='text'>
          Generalisable to any number of dimensions and thus any size of neural
          network
        </ThemedText>
        <ThemedText type='text'>Inexpensive to compute</ThemedText>
        <ThemedText type='text'>
          Easier to explain &ndash; no PCA-like black boxes
        </ThemedText>
        <ThemedText type='text'>
          Does not reduce dimensions &ndash; direct intuition preserved
        </ThemedText>
        <ThemedText type='text'>
          Generally representative of the network&apos;s loss landscape as a
          whole
        </ThemedText>
      </UnorderedList>
      <ThemedText type='subsubheading'>Disadvantages</ThemedText>
      <UnorderedList>
        <ThemedText type='text'>
          Only captures an infinitesimally small subset of the actual parametric
          space (although most of it could be argued as redundant)
        </ThemedText>
        <ThemedText type='text'>
          Loss of expressive power &ndash; the vast majority of points on the
          parametric space don&apos;t exist on this loss sub-landscape
        </ThemedText>
        <ThemedText type='textBold'>
          Magnitude and shape of loss dependent on network architecture &ndash;
          vulnerable to scale invariance, making comparison impossible
        </ThemedText>
      </UnorderedList>
      <ThemedText type='subheading'>Filter normalisation</ThemedText>
      <ThemedText type='text'>
        In order to solve the problem of inability to compare loss landscapes in
        this way, it is important to perform{' '}
        <ThemedText type='textBold'>filter normalisation</ThemedText>. The
        problem emerges when we want to compare the loss landscapes of two or
        more different neural networks using the random directions method, but
        because the weights and filters of the networks have completely
        different magnitudes, then the same sized perturbation of the directions
        we go in can have completely different effects on the corresponding loss
        landscapes, generating false dichotomies. The greater the difference in
        general weight magnitude of the networks, the greater this false
        dichotomy will become.
        {'\n'}
        {'\n'}
        In regular neural network output comparisons, this is not a problem due
        to{' '}
        <ThemedText type='textBold'>
          scale invariance induced by batch normalisation
        </ThemedText>{' '}
        &ndash; that is, once the output of a particular layer in a neural
        network is computed, the results are coded by a Z-transform that
        subtracts the mean and divides by the standard deviation + small offset.
        Therefore we could have an infinite number of networks which differ by
        weight values, but are guaranteed to have the same outputs due to scale
        invariance&apos;s effect and the relative magnitudes of the weight
        values being the same. Yet these networks if their loss landscapes were
        plotted with random directions would have completely different
        appearances.
        {'\n'}
        {'\n'}
        So how do we fix this? Well if we cannot change the networks and we
        still want to compare their loss landscapes, perhaps we can change the
        random directions themselves. With naive loss landscapes from random
        directions, each random direction would have a magnitude of exactly 1,
        generated from a random Gaussian vector. We can keep the principles the
        same but perform the following steps to eliminate the disparity between:
        <OrderedList>
          <ThemedText type='text'>
            Generate a Gaussian vector <Math exp='d_l' /> with the same
            dimensions as the <Math exp='k' />
            -th neural network <Math exp='\textbf{n}_k' />
            &apos;s parameters <Math exp='\theta_k' />.
          </ThemedText>
          <ThemedText type='text'>
            For every filter (or weight) in <Math exp='d_l' />, Replace the
            values of the filter with the ratio between the Frobenius norm of
            the corresponding filter in <Math exp='\theta_k' /> and the
            filter&apos;s Frob. norm, or in other words:{' '}
            <Math exp='F_k(d_{l,i,j}) = d_{l,i,j} \times \frac{||\theta_{k,i,j}||_F}{||d_{l,i,j}||_F}' />
            .
          </ThemedText>
          <ThemedText type='text'>
            Do this as many times as we have random directions to visualise
            (presumably <Math exp='l = 2' />
            ).
          </ThemedText>
          <ThemedText type='text'>
            For all the random directions, if we want to use the same ones, then
            we will rescale the directions for each network by the same ratio.
          </ThemedText>
        </OrderedList>
        {'\n'}
        {'\n'}
        Now our direction <Math exp='d' /> is still Gaussian-randomly
        distributed but has exactly the same magnitude as the neural network.
        Therefore even if we take the same step size for these neural networks
        of different filter magnitudes, if we use the same random direction set
        then we should get truly comparable figures without any false artefacts
        from scale invariance. This allows for full comparison between neural
        networks of different magnitudes without the need to directly modify the
        networks themselves.
      </ThemedText>
    </>
  );
}
