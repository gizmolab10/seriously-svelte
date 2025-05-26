<script lang='ts'>
    import { k, u, Point, colors, T_Details } from '../../ts/common/Global_Imports';
    import { w_show_details_ofType } from '../../ts/common/Stores';
    import { createEventDispatcher, tick } from 'svelte';
    import Separator from '../kit/Separator.svelte';
    export let height = 0;
    export let has_banner = true;
    export let t_details: T_Details;
    export let origin: Point | null = null;
    const dispatch = createEventDispatcher();
    const title = T_Details[t_details];
    const banner_height = 14;
    let element: HTMLElement;
    let isHidden = !show_slot();

    $: dispatch('heightChange', { height });
    function show_slot(): boolean { return has_banner ? $w_show_details_ofType.includes(t_details) : true; }
    
    $: (async () => {
        if (element && has_banner) {
            await tick();
            height = isHidden ? banner_height : element.scrollHeight;
        }
    })();

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
		width: 100%;
        display: flex;
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
                padding-left: 0;
                position: absolute;
                align-items: stretch;
                height: {banner_height}px;'>
            <Separator
                top={0}
                thickness={1}
                add_wings={true}/>
            <div
                class='title'
                style='
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    text-align: center;
                    background-color: {colors.banner};
                    font-size: {k.font_size.smaller}px;
                    line-height: {banner_height}px;'>
                {title}
            </div>
            <Separator
                thickness={1}
                add_wings={true}
                top={banner_height}/>
        </div>
    {/if}
    <div class={'slot-' + title}
        style='
            position: relative;
            display: {isHidden ? "none" : "block"};
            top: {1 + (has_banner ? banner_height : 0)}px;'>
        <slot/>
    </div>
</div>
