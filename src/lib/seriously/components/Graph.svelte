<svelte:options immutable = {true} />

<script lang="ts">
  import { fetchCompleted } from '../managers/Signal';
  import { ideas } from '../managers/Ideas';
  import Widget from './Widget.svelte';
  import { onMount } from 'svelte';
  import Idea from '../data/Idea';
  let isLoading = true;

  fetchCompleted.connect((text, Object) => {
		isLoading = false;
  });

  onMount(async () => {
    try {
      ideas.fetchAll()
    } catch (error) {
      console.error('Error reading Airtable database:', error);
    }
  });

</script>

{#if isLoading}
  <p>Loading...</p>
{:else if ideas.all.length == 0}
  <p>No ideas available.</p>
{:else}
<div>
  <ul>
    {#each ideas.all as idea}
      <li>
        <Widget idea={idea}/>
      </li>
    {/each}
  </ul>
  <p/>
</div>
{/if}

<style>
  li {
    line-height: 2.3;
  }
  ul {
    list-style: none;
  }
</style>
