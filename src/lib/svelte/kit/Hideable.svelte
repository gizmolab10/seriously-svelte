<script lang='ts'>
    import { k, Point } from '../../ts/common/Global_Imports';
    import { createEventDispatcher, tick } from 'svelte';
    export let origin: Point | null = null;
    export let isHidden = false;
    export let title = k.empty;
    export let height = 0;
    export let width = 0;
    export let detect_click = true;
    const banner_height = 20;
    const dispatch = createEventDispatcher();
    let element: HTMLElement;
    
    $: dispatch('heightChange', { height });
    
    $: (async () => {
        if (element) {
            await tick();
            height = isHidden ? banner_height : element.scrollHeight;
        }
    })();

    function toggle_hidden() {
        isHidden = !isHidden;
    }
</script>

<div
    class='hideable'
    bind:this={element}
    style='
        display: flex;
		width: {width}px;
        height: {height}px;
        position: relative;
        flex-direction: column;
        {origin ? `left: ${origin.x}px; top: ${origin.y}px;` : k.empty}'>
    <div
        class='banner'
        on:click={detect_click ? toggle_hidden : undefined}
        style='
            width: 100%;
            display: flex;
            cursor: pointer;
            padding-left: 8px;
            position: absolute;
            align-items: center;
            height: {banner_height}px;'>
        {title}
    </div>
    <div class={'slot-' + title} style='display: {isHidden ? "none" : "block"}; position: relative; top: {banner_height}px;'>
        <slot/>
    </div>
</div>
