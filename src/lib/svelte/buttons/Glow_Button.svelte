<script lang='ts'>
    import { k, show, Rect, Size, Point, colors, svgPaths, T_Layer } from '../../ts/common/Global_Imports';
	import { w_background_color } from '../../ts/common/Stores';
    import SVG_Gradient from '../kit/SVG_Gradient.svelte';
    import Button from './Button.svelte';
    export let title: string;
    export let width: number;
    export let height: number;
    export let isSelected: boolean = false;
    export let font_size: number = k.font_size.smaller;
    export let handle_click: (title: string) => boolean;
    const glow_rect = Rect.createWHRect(width, height);
    const gradient_name = 'glow-' + title;
    let banner_color = colors.ofBannerFor($w_background_color);
    let isHovering = false;

    $: $w_background_color, banner_color = colors.ofBannerFor($w_background_color);

</script>

<div
	class='glow'
	style='position: relative;'>
    <SVG_Gradient
        name={gradient_name}
        color={banner_color}
        size={glow_rect.size}
        isInverted={!isSelected}
        zindex={T_Layer.frontmost}
        path={svgPaths.rectangle(glow_rect)}/>
    <div class='title'
        on:click={() => handle_click(title)}
        style='
            top: 50%;
            left: 50%;
            margin: 0;
            padding: 0;
            width: 100%;
            text-align: center;
            position: absolute;
            font-size: {font_size}px;
            background-color: transparent;
            transform: translate(-50%, -50%);'>
        {#if !!svgPaths.hasPath_for(title)}
            <svg
                viewBox='-2 -3 20 20'
                class='svg-glow-button-path'
                on:mouseenter={() => isHovering = true}
                on:mouseleave={() => isHovering = false}>
                <path d={svgPaths.path_for(title)} stroke={colors.border} fill={isHovering ? 'black' : 'white'} stroke-width='0.75'/>
            </svg>
        {:else}
            {title}
        {/if}
    </div>
</div> 