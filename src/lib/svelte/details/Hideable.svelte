<script lang='ts'>
    import { k, u, Rect, Size, Point, colors, svgPaths, T_Details, T_Layer } from '../../ts/common/Global_Imports';
    import { w_background_color, w_show_details_ofType } from '../../ts/common/Stores';
    import Glow_Button from '../buttons/Glow_Button.svelte';
    import SVG_Gradient from '../kit/SVG_Gradient.svelte';
    import { createEventDispatcher, tick } from 'svelte';
    import Separator from '../kit/Separator.svelte';
    export let origin: Point | null = null;
    export let t_details: T_Details;
    export let has_banner = true;
    export let height = 0;
    const title = T_Details[t_details];
    const dispatch = createEventDispatcher();
    const banner_height = k.height.banner.details;
    const banner_rect = new Rect(Point.zero, new Size(k.width_details, banner_height));
    let banner_color = colors.bannerFor($w_background_color);
    let isHidden = !show_slot();
    let element: HTMLElement;

    $: dispatch('heightChange', { height });
    $: $w_background_color, banner_color = colors.bannerFor($w_background_color);
    function show_slot(): boolean { return has_banner ? $w_show_details_ofType.includes(t_details) : true; }
    
    $: (async () => {
        if (element && has_banner) {
            await tick();
            height = isHidden ? banner_height : element.scrollHeight + 5;
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
        flex-shrink: 0;
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
                origin={Point.y(0)}
                thickness={k.thickness.separator.ultra_thin}
                corner_radius={k.radius.gull_wings.hideable}/>
            <Glow_Button
                title={title}
                height={banner_height}
                width={k.width_details}/>
            <Separator
                origin={Point.y(banner_height)}
                thickness={k.thickness.separator.ultra_thin}
                corner_radius={k.radius.gull_wings.hideable}/>
        </div>
    {/if}
    <div class={'slot-' + title}
        style='
            position: relative;
            display: {isHidden ? "none" : "block"};
            top: {4 + (has_banner ? banner_height : 0)}px;'>
        <slot/>
    </div>
</div>
