<svelte:options immutable={true}/>

<script lang='ts'>
  import { signalWidgetsNeedUpdate } from "../managers/Signal";
  import { grabOnly } from '../managers/Selecting';
  import Idea from '../data/Idea';
  export let isReveal = false;
  export let idea = Idea;
 
  function handleClick(event) {
    if (!isReveal) {
      grabOnly(idea); // TODO: detect SHIFT key down
      updateButtonColors();
      signalWidgetsNeedUpdate('whoot!');
    }
  }

  function updateButtonColors() {
    var dot = document.getElementById(idea.id)?.style;
    dot?.setProperty(  '--dotColor', idea.color);
    dot?.setProperty( '--grabColor', idea.hoverColor( isReveal));
    dot?.setProperty('--hoverColor', idea.hoverColor(!isReveal));
  }
</script>

<slot>
  <button id={idea.id}
    on:click={handleClick}
    class={ isReveal ? 'reveal' : 'drag' }
    style='--dotColor:   {idea.color};
           --grabColor:  {idea.hoverColor( isReveal)};
           --hoverColor: {idea.hoverColor(!isReveal)}'>
    {isReveal ? idea.trait : "-"}
  </button>
</slot>

<style lang='scss'>
  .reveal {}
  .drag {} // these are for drawing the drag dot differently than the reveal dot

  button {
    color: var(--hoverColor);
    background-color: var(--grabColor);
    border-color: var(--dotColor);
    border: 0.1px solid;
    border-radius: 10px;
    height: 20px;
    width: 20px;

    &:hover {
      color: var(--grabColor);
      background-color: var(--hoverColor);
    }
  }
</style>
