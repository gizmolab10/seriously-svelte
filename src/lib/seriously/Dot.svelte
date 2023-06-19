<svelte:options immutable={true}/>

<script lang='ts'>
  import Idea from './Idea';
  export let isReveal = false;
  export let idea = Idea;
</script>

<slot>
  <button
    class={ isReveal ? 'reveal' : 'drag' }
    style='--grabColor: {idea.hoverColor(isReveal)}; --hoverColor: {idea.hoverColor(!isReveal)}'>
    {isReveal ? idea.trait : "-"}
  </button>
</slot>

<style lang='scss'>
  .reveal {}
  .drag {} // these are for drawing the drag dot differently than the reveal dot

  button {
    background-color: var(--grabColor);
    border: 0.1px solid;
    border-radius: 10px;
    height: 20px;
    width: 20px;

    &:hover {
      background-color: var(--hoverColor);
    }
  }
</style>
