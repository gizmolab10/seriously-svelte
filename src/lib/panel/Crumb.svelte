<script lang='ts'>
  import { Thing, hierarchy } from '../common/GlobalImports';
  export let thing = Thing;

  function handleClick(event) {
    if (thing == hierarchy.root) {
      thing.grabOnly();
      thing.becomeHere();
    } else {
      thing.grabOnly();
      thing.firstParent.becomeHere();
    }
  }

</script>

<button
  on:click={handleClick}
  style='
    border: 1px solid {thing.color};
    color: {thing.color};
    border-radius: 0.5em;
    cursor: pointer;'>
  {thing.title.injectElipsisAt()}
</button>

<style>
</style>