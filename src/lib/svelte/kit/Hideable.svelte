<script lang='ts'>
    import { k, Point } from '../../ts/common/Global_Imports';
    import { createEventDispatcher, tick } from 'svelte';
    export let origin: Point | null = null;
    export let isHidden = false;
    export let title = k.empty;
    export let height = 0;
    export let width = 0;
    const banner_height = 20;
    const dispatch = createEventDispatcher();
    let element: HTMLElement;
    
    $: dispatch('heightChange', { height });
    
    $: (async () => {
        if (element) {
            await tick();
            height = banner_height + (isHidden ? 0 : element.scrollHeight - banner_height);
        }
    })();

    function toggleExpanded() {
        isHidden = !isHidden;
    }
</script>

<div
    bind:this={element}
    style='
        display: flex;
		width: {width}px;
        height: {height}px;
        position: relative;
        flex-direction: column;
        {origin ? `left: ${origin.x}px; top: ${origin.y}px;` : k.empty}'>
    <div 
        on:click={toggleExpanded}
        style='
            top: 0px;
            left: 0px;
            width: 100%;
            display: flex;
            cursor: pointer;
            padding-left: 8px;
            position: absolute;
            align-items: center;
            height: {banner_height}px;'>
        {title}
    </div>
    <div style='display: {isHidden ? "none" : "block"};'>
        <slot/>
    </div>
</div>
