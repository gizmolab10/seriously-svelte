<script lang='ts'>
    import { k, Rect, Size, Point, colors, svgPaths, T_Layer } from '../../ts/common/Global_Imports';
    import { w_background_color } from '../../ts/common/Stores';
    import SVG_Gradient from './SVG_Gradient.svelte';
    export let zindex = T_Layer.frontmost;
    export let position = 'absolute';
    export let height: number;
    export let width: number;
    export let title: string;
    export let style = '';

    let banner_color = colors.bannerFor($w_background_color);
    const banner_rect = new Rect(Point.zero, new Size(width, height));

    $: $w_background_color, banner_color = colors.bannerFor($w_background_color);
</script>

<div class='glow'
    style='position: {position}; {style}'>
    <SVG_Gradient
        zindex={zindex}
        color={banner_color}
        size={banner_rect.size}
        path={svgPaths.rectangle(banner_rect)}/>
    <div
        class='title'
        style='
            margin: 0;
            padding: 0;
            top: -0.5px;
            height: 100%;
            display: flex;
            width: {width}px;
            position: absolute;
            text-align: center;
            align-items: center;
            justify-content: center;
            line-height: {height}px;
            background-color: transparent;
            font-size: {k.font_size.smaller}px;'>
        {title}
    </div>
</div> 