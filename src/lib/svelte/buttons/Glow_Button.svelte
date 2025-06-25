<script lang='ts'>
    import { k, u, show, Rect, Size, Point, colors, svgPaths, T_Layer } from '../../ts/common/Global_Imports';
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
    let isHovering = false;
    let banner_color = colors.ofBannerFor($w_background_color);

    $: $w_background_color, banner_color = colors.ofBannerFor($w_background_color);
    
    function intercept_click() {
        isHovering = false;        // suppress distracting inversion from hover
        handle_click(title);
    }

    function handle_mouse_enter(is_in: boolean) {
        isHovering = is_in;
        if (isSelected) {
            u.onNextTick(() => isHovering = false);
        }
    }

</script>

<div
	class='glow'
	style='
        width: {width}px;
        height: {height}px;
        position: relative;'>
    <SVG_Gradient
        name={gradient_name}
        color={banner_color}
        size={glow_rect.size}
        zindex={T_Layer.frontmost}
        path={svgPaths.rectangle(glow_rect)}
        isInverted={!isHovering || svgPaths.hasPath_for(title)}/>
    <div class='title'
        on:click={intercept_click}
        on:mouseenter={() => handle_mouse_enter(true)}
        on:mouseleave={() => handle_mouse_enter(false)}
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
        {#if svgPaths.hasPath_for(title)}
            <svg
                viewBox='-2 -3 20 20'
                class='svg-glow-button-path'>
                <path d={svgPaths.path_for(title)} stroke={colors.border} fill={isHovering ? 'black' : 'white'} stroke-width='0.75'/>
            </svg>
        {:else}
            {title}
        {/if}
    </div>
</div> 