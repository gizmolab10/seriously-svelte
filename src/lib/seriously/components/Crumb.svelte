<script lang='ts'>
  import { Thing, grabbedIDs, signal, SignalKinds, seriouslyGlobals } from '../common/GlobalImports';
  export let thing = Thing;

  function handleClick(event) {
    if (thing.id == seriouslyGlobals.rootID) {
      thing.focus();
      goodGrabInThing(thing);
    } else {
      thing.grabOnly();
      thing.firstParent.focus();
    }
    signal([SignalKinds.relayout], null);
  }

  function goodGrabInThing(parent) {
    const ids = $grabbedIDs;
    if (ids != null && ids.length > 0) {
      const id = ids[0];
      const grab = things.thingForID(id);
      if (grab.firstParent == parent) {
        return;
      }
    }
    parent.firstChild.grabOnly();
  }

</script>

<button on:click={handleClick}>{thing.title}</button>

<style>
  button {
    border-color: 'blue';
  }
</style>