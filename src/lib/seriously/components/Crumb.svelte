<script lang='ts'>
  import { Thing, things, grabbedIDs, signal, Signals, constants } from '../common/GlobalImports';
  export let thing = Thing;

  function handleClick(event) {
    if (thing == things.root) {
      thing.grabOnly();
      thing.becomeHere();
    } else {
      thing.grabOnly();
      thing.firstParent.becomeHere();
    }
    signal(Signals.widgets);
  }

</script>

<button
  style='border: 1px solid; border-color: {thing.color}; color: {thing.color}; border-radius: 0.5em'
  on:click={handleClick}>
  {thing.title.injectElipsisAt()}
</button>

<style>
</style>