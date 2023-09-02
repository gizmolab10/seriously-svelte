<script lang='ts'>
  import { Thing, Hierarchy, desaturateBy } from '../common/GlobalImports';
  export let thing = Thing;

  function handleClick(event) {
    if (thing == dbDispatch.db.hierarchy.root) {
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
    shadow: 2.0px;
    cursor: pointer;'>
  {thing.title.injectElipsisAt()}
</button>

<style>
</style>