<svelte:options immutable = {true} />

<script lang="ts">
  import Idea from '/src/lib/seriously/data/Idea';
  import Widget from './Widget.svelte';
  import { onMount } from 'svelte';
  import Airtable from 'airtable';
  let isLoading = false;
  let ideas = [];

  const base = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');

  onMount(async () => {
    isLoading = true;
    try {
      const records = await base('Ideas').select().all()
      for (let record of records) {
        let idea = new Idea(record.id, record.fields.title, record.fields.color, record.fields.trait);
        ideas.push(idea);
      }
      isLoading = false;
    } catch (error) {
      console.error('Error reading Airtable database:', error);
    }
  });

  $: {
    if (ideas.length > 0) {
      let _ = 0;
    }
  }

</script>

{#if isLoading}
  <p>Loading...</p>
{:else if ideas.length == 0}
  <p>No ideas available.</p>
{:else}
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
{/if}

<style>
  li {
    line-height: 2.3;
  }
  ul {
    list-style: none;
  }
</style>
