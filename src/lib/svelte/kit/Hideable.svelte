<script lang='ts'>
    import { k, u, Point, T_Details } from '../../ts/common/Global_Imports';
    import { w_show_details_ofType } from '../../ts/common/Stores';
    import { createEventDispatcher, tick } from 'svelte';
    import Separator from '../kit/Separator.svelte';
    export let height = 0;
    export let title = k.empty;
    export let has_banner = true;
    export let t_details: T_Details;
    export let origin: Point | null = null;
    const dispatch = createEventDispatcher();
    const banner_height = 14;
    let element: HTMLElement;
    let isHidden = !show_slot();
    $: dispatch('heightChange', { height });
    
    $: (async () => {
        if (element) {
            await tick();
            height = isHidden ? banner_height : element.scrollHeight;
        }
    })();

    function show_slot(): boolean {
        return has_banner ? $w_show_details_ofType.includes(t_details) : $w_show_details_ofType.length !== 0;
    }

    function toggle_hidden() {
        if (has_banner) {
            let t_details_array = $w_show_details_ofType.filter(item => !!item);
            if (t_details_array.includes(t_details)) {
                t_details_array = u.remove_fromArray_byReference(t_details, t_details_array);
            } else {
                t_details_array.push(t_details);
            }
            $w_show_details_ofType = t_details_array;
            isHidden = !show_slot();
        }
    }

</script>

<div
    class='hideable'
    bind:this={element}
    style='
        display: flex;
		width: 100%;
        height: {height}px;
        position: relative;
        flex-direction: column;
        {origin ? `left: ${origin.x}px; top: ${origin.y}px;` : k.empty}'>
    {#if has_banner}
        <div
            class='banner'
            on:click={toggle_hidden}
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
    {/if}
    <div class={'slot-' + title} style='display: {isHidden ? "none" : "block"}; position: relative; top: {has_banner ? banner_height : 0}px;'>
        <slot/>
    </div>
</div>
