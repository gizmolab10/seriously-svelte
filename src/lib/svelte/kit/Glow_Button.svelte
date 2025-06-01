<script lang='ts'>
    import { k, Rect, Size, Point, colors, svgPaths, T_Layer } from '../../ts/common/Global_Imports';
    import { w_background_color } from '../../ts/common/Stores';
    import SVG_Gradient from './SVG_Gradient.svelte';

    export let title: string;
    export let height: number;
    export let width: number;

    let banner_color = colors.bannerFor($w_background_color);
    const banner_rect = new Rect(Point.zero, new Size(width, height));

    $: $w_background_color, banner_color = colors.bannerFor($w_background_color);
</script>

<div class='glow'>
    <SVG_Gradient
        color={banner_color}
        size={banner_rect.size}
        zindex={T_Layer.frontmost}
        path={svgPaths.rectangle(banner_rect)}/>
    <div
        class='title'
        style='
            margin: 0;
            padding: 0;
            top:-0.5px;
            width: 100%;
            text-align: center;
            position: absolute;
            background-color: transparent;
            line-height: {height}px;
            font-size: {k.font_size.smaller}px;'>
        {title}
    </div>
</div> 