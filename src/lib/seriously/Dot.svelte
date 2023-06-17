<script lang='ts'>
  import Idea from './Idea';
  // import Widget from './Widget.svelte';

  // export let widget = Widget;
  export let idea = Idea;
  export let isActive = false;
  export let isReveal = false;

  console.log("idea: ", idea);
</script>

<slot>
  <button class={ isReveal ? 'reveal' : 'drag' }>
    { idea.trait }
  </button>
</slot>

<style lang='scss'>
  button {
    background-color: yellow;
    border: 0.1px solid;
    border-radius: 10px;
    height: 20px;

    &:hover {
      background-color: purple;
    }
  }

  .drag {
    background-color: green;
    color: white;
  }

  .reveal {
    background-color: red;
    color: white;
  }
</style>
