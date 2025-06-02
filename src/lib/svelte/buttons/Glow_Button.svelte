<script lang='ts'>
    import { k, show, Rect, Size, Point, colors, svgPaths, T_Layer } from '../../ts/common/Global_Imports';
	import { w_background_color } from '../../ts/common/Stores';
    import SVG_Gradient from '../kit/SVG_Gradient.svelte';
    export let handle_click: (title: string) => boolean;
    export let height: number;
    export let title: string;
    export let width: number;
    export let isSelected: boolean = false;
    const glow_rect = Rect.createWHRect(width, height);
    let banner_color = colors.bannerFor($w_background_color);

    $: $w_background_color, banner_color = colors.bannerFor($w_background_color);

    $: {
        console.log(`Glow button "${title}" selection state changed to:`, isSelected);
    }

    function intercept_click(title: string) {
        // console.log(`Glow button "${title}" clicked`);
        handle_click(title);
    }
</script>

<div
	class='glow'
	style='position: relative;'>
    <SVG_Gradient
        color={banner_color}
        size={glow_rect.size}
        zindex={T_Layer.frontmost}
        path={svgPaths.rectangle(glow_rect)}/>
    <div class='title'
        on:click={() => intercept_click(title)}
        style='
            top: 50%;
            left: 50%;
            margin: 0;
            padding: 0;
            width: 100%;
            text-align: center;
            position: absolute;
            background-color: transparent;
            transform: translate(-50%, -50%);
            font-size: {k.font_size.smaller}px;
            color: {isSelected ? 'white' : 'black'};'>
        {title}
    </div>
</div> 