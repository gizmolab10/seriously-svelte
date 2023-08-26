<script lang='ts'>
  export let title;
  export let onClick = null;

</script>

<button
  on:click={onClick}
  style='
    border: 1px solid;
    border-radius: 0.5em;
    cursor: pointer;'>
  {title}
</button>

<style>
</style>