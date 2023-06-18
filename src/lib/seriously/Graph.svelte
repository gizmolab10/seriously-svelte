<svelte:options immutable = {true} />

<script lang="ts" >
  import Widget from './Widget.svelte';
  import Idea, { ideas } from './Idea.ts';
</script>

<div>
  <ul>
      {#each ideas as idea}
        <li>
	        <Widget idea={idea}/>
        </li>
      {/each}
    </ul>
  <p/>
</div>

<style>
  li {
    line-height: 2.0;
  }
  ul {
    list-style: none;
  }
</style>