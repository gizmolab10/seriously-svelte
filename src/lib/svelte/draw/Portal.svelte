<script lang='ts'>
  import { tick } from 'svelte';
  
  export let target: string | HTMLElement = 'body';
  export let id: string | undefined = undefined;
  export let className: string | undefined = undefined;
  
  function portal(el: HTMLElement, target: string | HTMLElement = 'body') {
    let targetEl: HTMLElement;
    
    async function update(newTarget: string | HTMLElement) {
      target = newTarget;
      if (typeof target === 'string') {
        targetEl = document.querySelector(target);
        if (targetEl === null) {
          await tick();
          targetEl = document.querySelector(target);
        }
        if (targetEl === null) {
          throw new Error(`No element found matching css selector: "${target}"`);
        }
      } else if (target instanceof HTMLElement) {
        targetEl = target;
      } else {
        throw new TypeError(`Unknown portal target type: ${target === null ? 'null' : typeof target}. Allowed types: string (CSS selector) or HTMLElement.`);
      }
      targetEl.appendChild(el);
      el.hidden = false;
    }

    function destroy() {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }

    update(target);
    return {
      update,
      destroy,
    };
  }
</script>

<div use:portal={target} hidden {id} class={className}>
  <slot />
</div> 