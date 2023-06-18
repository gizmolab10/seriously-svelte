<svelte:options immutable = {true} />

<script lang='ts'>
  import variables from '../../styles/variables.scss';
  import Idea from './Idea';
  export let isReveal = false;
  export let idea = Idea;
</script>

<slot>
  <button class={ isReveal ? 'reveal' : 'drag' }>
    {isReveal ? idea.trait : "-"}
  </button>
</slot>

<style lang='scss'>
  .drag {} // these are for drawing the drag dot differently than the reveal dot
  .reveal {}

  button {
    // background-color: idea.color;
    border: 0.1px solid;
    border-radius: 10px;
    height: 20px;
    width: 20px;

    &:hover {
      background-color: variables.$globalHighlightColor;
    }
  }
</style>
