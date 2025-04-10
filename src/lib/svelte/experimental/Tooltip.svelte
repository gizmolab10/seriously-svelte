<script lang='ts'>
  import { createPopperActions } from 'svelte-popperjs';
  const [popperRef, popperContent] = createPopperActions({
    placement: 'right',
    strategy: 'fixed',
  });
  const extraOpts = {
    modifiers: [
      { name: 'offset', options: { offset: [0, 8] } }
    ],
  };

  let showTooltip = $state(false);
</script>

<button
  use:popperRef
  onmouseenter={() => showTooltip = true}
  onmouseleave={() => showTooltip = false}
>
  My button
</button>
{#if showTooltip}
  <div id="tooltip" use:popperContent={extraOpts}>
    My tooltip
    <div id="arrow" data-popper-arrow></div>
  </div>
{/if}