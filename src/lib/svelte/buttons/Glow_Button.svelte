<script lang='ts'>
    import { k, Rect, Size, Point, colors, svgPaths, T_Layer } from '../../ts/common/Global_Imports';
    import { w_background_color } from '../../ts/common/Stores';
    import SVG_Gradient from '../kit/SVG_Gradient.svelte';
    export let title: string;
    export let height: number;
    export let width: number;
    const glow_rect = new Rect(Point.zero, new Size(width, height));
    let banner_color = colors.bannerFor($w_background_color);

    $: $w_background_color, banner_color = colors.bannerFor($w_background_color);
</script>

<div
	class='glow'
	style='position: relative;'>
    <SVG_Gradient
        color={banner_color}
        size={glow_rect.size}
        zindex={T_Layer.frontmost}
        path={svgPaths.rectangle(glow_rect)}/>
    <div
        class='title'
        style='
            margin: 0;
            padding: 0;
            top: 50%;
            left: 50%;
            width: 100%;
            text-align: center;
            position: absolute;
            background-color: transparent;
            transform: translate(-50%, -50%);
            font-size: {k.font_size.smaller}px;'>
        {title}
    </div>
</div> 