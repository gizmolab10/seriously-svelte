<script lang="ts">
  export let titles: string[] = [];
  export let selected: string[] = [];
  function isSelected(title: string) { return selected.includes(title); }
  function select(title: string) {
    if (selected.includes(title)) {
      selected = selected.filter(i => i !== title);
    } else {
      selected = [...selected, title];
    }
  }
</script>

{#each titles as title}
  <button
    class:selected={isSelected(title)}
    on:click={() => select(title)}
  >{title}</button>
{/each}