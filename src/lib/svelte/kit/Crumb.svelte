<script lang='ts'>
  import { Thing, dbDispatch, desaturateBy } from '../../ts/common/GlobalImports';
  export let thing = Thing;

  function handleClick(event) {
    if (dbDispatch.db.hasData) {
      thing.grabOnly();
      if (thing == dbDispatch.db.hierarchy.root) {
        thing.becomeHere();
      } else {
        thing.firstParent.becomeHere();
      }
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