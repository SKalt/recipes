<script lang="ts">
  export let currentPage: string;
</script>

<nav>
  <ul>
    <li>
      <a aria-current={currentPage === undefined ? "page" : undefined} href="/"
        >index</a
      >
    </li>
    <li>
      <a href="https://github.com/SKalt/recipes">GitHub</a>
    </li>
    <!-- <li>
      <a
        aria-current={currentPage === 'about' ? 'page' : undefined}
        href="about">about</a>
    </li> -->

    <!-- for the blog link, we're using rel=prefetch so that Sapper prefetches
		     the blog data when we hover over the link or tap it on a touchscreen -->
    <!-- <li>
      <a
        rel="prefetch"
        aria-current={currentPage === 'blog' ? 'page' : undefined}
        href="blog">blog</a>
    </li> -->
  </ul>
</nav>

<style>
  nav {
    border-bottom: 1px solid rgba(255, 62, 0, 0.1);
    font-weight: 300;
    padding: 0 1em;
  }
  @media (prefers-color-scheme: dark) {
    nav {
      border-bottom: 1px solid #eee;
    }
  }

  ul {
    margin: 0;
    padding: 0;
  }

  /* clearfix */
  ul::after {
    content: "";
    display: block;
    clear: both;
  }

  li {
    display: block;
    float: left;
  }

  [aria-current] {
    position: relative;
    display: inline-block;
  }

  [aria-current]::after {
    position: absolute;
    content: "";
    width: calc(100% - 1em);
    height: 2px;
    background-color: rgb(255, 62, 0);
    display: block;
    bottom: -1px;
  }

  a {
    text-decoration: none;
    padding: 1em 0.5em;
    display: block;
  }
</style>
