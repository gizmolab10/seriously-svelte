<svelte:options immutable={true}/>

<script lang='ts'>
  import Idea from './Idea';
  export let isReveal = false;
  export let idea = Idea;
  function handleClick(event) {
    if (!isReveal) {
      idea.grabbed = !idea.grabbed;
      updateButton();
      console.log(idea.title, document.getElementById(idea.id)?.style.getPropertyValue('--grabColor'))
    }
  }
  function updateButton() {
    var dot = document.getElementById(idea.id);
    dot?.style.setProperty('--grabColor', idea.hoverColor(isReveal));
    dot?.style.setProperty('--hoverColor', idea.hoverColor(!isReveal));
  }
</script>

<slot>
  <button id={idea.id}
    class={ isReveal ? 'reveal' : 'drag' }
    style='--grabColor: {idea.hoverColor(isReveal)}; --hoverColor: {idea.hoverColor(!isReveal)}'
    on:click={handleClick}>
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
