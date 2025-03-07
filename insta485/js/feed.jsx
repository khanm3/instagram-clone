import React from 'react';
import PropTypes from 'prop-types';
import InfiniteScroll from 'react-infinite-scroll-component';
import Post from './post';

class Feed extends React.Component {
  /* Display number of image and post owner of a single post
  */
  constructor(props) {
    // Initialize mutable state
    super(props);
    this.state = {
      allPosts: [],
      next: '',
    };
    this.fetchMoreData = this.fetchMoreData.bind(this);
    this.getPosts = this.getPosts.bind(this);
  }

  componentDidMount() {
    if (window.performance.getEntriesByType('navigation')[0].type === 'back_forward') {
      // re-render posts
      const data = JSON.parse(window.history.state);
      data.allPosts = Feed.renderNewPosts(data.allPosts);
      this.setState(data);
    } else {
      // This line automatically assigns this.props.url to the const variable url
      const { url } = this.props;
      this.getPosts(url);
    }
  }

  getPosts(url) {
    // Call REST API to get the feed information
    fetch(url, { credentials: 'same-origin' })
      .then((response) => {
        if (!response.ok) throw Error(response.statusText);
        return response.json();
      })
      .then((data) => {
        this.setState((prevState) => ({
          next: data.next,
          allPosts: prevState.allPosts.concat(Feed.renderNewPosts(data.results)),
        }));

        // add state to browser history
        const { next, allPosts } = this.state;
        const tempAllPosts = allPosts.map((post) => (
          { postid: post.key, url: '/api/v1/posts/'.concat(post.key, '/') }
        ));
        const hist = { next, allPosts: tempAllPosts };
        window.history.replaceState(JSON.stringify(hist), 'Index', '/');
      })
      .catch((error) => console.log(error));
  }

  fetchMoreData() {
    const { next } = this.state;
    this.getPosts(next);
  }

  static renderNewPosts(results) {
    return results.map((post) => (
      <Post url={post.url} key={post.postid} />
    ));
  }

  render() {
    // This line automatically assigns this.state.imgUrl to the const variable imgUrl
    // and this.state.owner to the const variable owner
    const { next, allPosts } = this.state;

    // Render number of post image and post owner
    return (
      <div className="feed">
        <InfiniteScroll
          dataLength={allPosts.length}
          next={this.fetchMoreData}
          hasMore={() => next !== ''}
        >
          {allPosts}
        </InfiniteScroll>
      </div>
    );
  }
}

Feed.propTypes = {
  url: PropTypes.string.isRequired,
};

export default Feed;
