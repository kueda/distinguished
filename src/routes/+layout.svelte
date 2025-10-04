<script lang="ts">
  import favicon from '$lib/assets/favicon.svg';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}

<footer>
  <hr />
  <p>
    <small>
      <a href="https://github.com/kueda/distinguished">Source</a>
      | Last updated {import.meta.env.VITE_BUILD_DATE || (new Date()).toUTCString()}
    </small>
  </p>
</footer>
