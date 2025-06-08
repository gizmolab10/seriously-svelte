<script lang='ts'>
    import { k, u, Rect, Size, Point, colors, svgPaths, T_Details, T_Layer } from '../../ts/common/Global_Imports';
    import { w_background_color, w_show_details_ofType } from '../../ts/common/Stores';
    import { createEventDispatcher, tick, setContext } from 'svelte';
    import Glows_Banner from './Glows_Banner.svelte';
    export let extra_titles: string[] = [];
    export let origin: Point | null = null;
    export let t_details: T_Details;
    export let hasBanner = true;
    export let isBottom = false;
    export let height = 0;
    const title = T_Details[t_details];
    const titles = [title, ...extra_titles];
    const dispatch = createEventDispatcher();
    const banner_height = k.height.banner.details;
    const banner_rect = new Rect(Point.zero, new Size(k.width_details, banner_height));
    let banner_color = colors.ofBannerFor($w_background_color);
    let isHidden = !show_slot();
    let element: HTMLElement;

    //////////////////////////////////////////////////////
    //													//
    //	hasBanner:		some hideables have no banner	//
    //	t_details:		title in banner     			//
    //	extra_titles:	extra titles added into banner	//
    //	isHidden:		whether slot is hidden			//
    //													//
    //////////////////////////////////////////////////////

    $: dispatch('heightChange', { height });
    setContext('handle_banner_click', toggle_hidden);
    $: $w_background_color, banner_color = colors.ofBannerFor($w_background_color);
    function show_slot(): boolean { return hasBanner ? $w_show_details_ofType.includes(t_details) : true; }
    function callSlottedMethod(methodName: string, ...args: any[]) { dispatch('callMethod', { methodName, args }); }
    
    $: (async () => {
        if (element && hasBanner) {
            await tick();
            height = isHidden ? banner_height : element.scrollHeight + 5;
        }
    })();

    function toggle_hidden(button_title: string) {
        if (hasBanner && button_title === title) {
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
    {#if hasBanner}
        <div
            class='banner'
            style='
                width: 100%;
                display: flex;
                cursor: pointer;
                padding-left: 0;
                position: absolute;
                align-items: stretch;
                height: {banner_height}px;'>
            <Glows_Banner
                titles={titles}
                height={banner_height}
                width={k.width_details}
                toggle_hidden={toggle_hidden}/>
        </div>
    {/if}
    <div class={'hideable-content-' + title}
        style='
            position: relative;
            display: {isHidden ? "none" : "block"};
            top: {4 + (hasBanner ? banner_height : 0)}px;'>
        <slot/>
    </div>
</div>
