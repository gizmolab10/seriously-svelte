<script lang='ts'>
  import { Thing, things, grabbedIDs, signal, Signals, seriouslyGlobals } from '../common/GlobalImports';
  export let thing = Thing;

  function handleClick(event) {
    if (thing.id == seriouslyGlobals.rootID) {
      grabChild();
      thing.becomeHere();
    } else {
      thing.grabOnly();
      thing.firstParent.becomeHere();
    }
    signal(Signals.widgets);
  }

  function grabChild() {
    const ids = $grabbedIDs;
    for ( const grab of things.thingsForIDs(ids)) {
      if (grab.firstParent.firstParent == thing) {
        grab.firstParent.grabOnly();
        return;
      }
    }
    thing.firstChild.grabOnly();
  }

</script>

<button
  style='border: 1px solid; border-color: {thing.color}; color: {thing.color}; border-radius: 0.5em'
  on:click={handleClick}>
  {thing.ellipsisTitle}
</button>

<style>
</style>