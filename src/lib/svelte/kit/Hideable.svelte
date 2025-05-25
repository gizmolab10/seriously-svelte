<script lang='ts'>
    import { k, Point, T_Details } from '../../ts/common/Global_Imports';
    import { w_show_details_ofType } from '../../ts/common/Stores';
    import { createEventDispatcher, tick } from 'svelte';
    import Separator from '../kit/Separator.svelte';
    export let origin: Point | null = null;
    export let t_details: T_Details;
    export let detect_click = true;
    export let isHidden = false;
    export let title = k.empty;
    export let height = 0;
    export let width = 0;
    const banner_height = 14;
    const dispatch = createEventDispatcher();
    let element: HTMLElement;
    
    $: dispatch('heightChange', { height });
    
    $: (async () => {
        if (element) {
            await tick();
            height = isHidden ? banner_height : element.scrollHeight;
        }
    })();

    $: if (t_details === T_Details.header) {
        isHidden = $w_show_details_ofType.length === 0;
    }

    function toggle_hidden() {
        isHidden = !isHidden;
        if (isHidden) {
            $w_show_details_ofType = $w_show_details_ofType.filter(d => d !== t_details);
        } else if (!$w_show_details_ofType.includes(t_details)) {
            $w_show_details_ofType = [...$w_show_details_ofType, t_details];
        }
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
        <Separator
            top={4.5}
            title={title}
            add_wings={true}
            title_font_size={k.font_size.small}/>
    </div>
    <div class={'slot-' + title} style='display: {isHidden ? "none" : "block"}; position: relative; top: {banner_height}px;'>
        <slot/>
    </div>
</div>
