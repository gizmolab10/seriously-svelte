<script lang='ts'>
    import { c, e, k, u, show, Rect, Size, Point, colors, svgPaths, T_Layer } from '../../ts/common/Global_Imports';
	import { w_background_color } from '../../ts/managers/Stores';
    import SVG_Gradient from '../draw/SVG_Gradient.svelte';
    import Button from './Button.svelte';
    export let width: number;
    export let height: number;
    export let owner = k.empty;
    export let title = k.empty;
    export let isSelected: boolean = false;
    export let detect_autorepeat: boolean = false;
    export let font_size: number = k.font_size.banners;
    export let handle_click: (title: string) => boolean;
    const mouseTimer = e.mouse_timer_forName(`glow-button-${owner}-${title}`);
    const glow_rect = Rect.createWHRect(width, height);
    const gradient_name = 'glow-' + title;
    let banner_color = colors.ofBannerFor($w_background_color);
    let glow_button: HTMLElement | null = null;
    let isHovering = false;

	$: {
		const _ = $w_background_color;
		banner_color = colors.ofBannerFor($w_background_color);
	}
    
    function intercept_click() {
        handle_click(title);
        isHovering = false;
    }

    function handle_mouse_down() {
        if (detect_autorepeat) {
            mouseTimer.autorepeat_start(0, () => handle_click(title));
        }
    }

    function handle_mouse_up() {
        if (detect_autorepeat) {
            mouseTimer.autorepeat_stop();
        }
    }

    function handle_mouse_enter(is_in: boolean) {
        const was_in = isHovering;
        isHovering = is_in;
        if (is_in && was_in && detect_autorepeat) {        // we get an extra mouse enter event when we click
            mouseTimer.autorepeat_stop();
        }
    }
    
</script>

<div
	class='glow'
    bind:this={glow_button}
	class:autorepeating={detect_autorepeat && mouseTimer.isAutorepeating_forID(0)}
	style='
        width: {width}px;
        height: {height}px;
        position: relative;'>
    {#if isHovering != c.has_matte_UI}
        <SVG_Gradient
            isInverted={true}
            name={gradient_name}
            color={banner_color}
            size={glow_rect.size}
            zindex={T_Layer.frontmost}
            path={svgPaths.rectangle(glow_rect)}/>
    {/if}
    <div class='title'
        on:click={intercept_click}
        on:mouseup={handle_mouse_up}
        on:mousedown={handle_mouse_down}
        on:mouseenter={() => handle_mouse_enter(true)}
        on:mouseleave={() => handle_mouse_enter(false)}
        style='
            top: 50%;
            left: 50%;
            margin: 0;
            padding: 0;
            width: 100%;
            user-select: none;
            text-align: center;
            position: absolute;
            -ms-user-select: none;
            -moz-user-select: none;
            font-size: {font_size}px;
            -webkit-user-select: none;
            background-color: transparent;
            transform: translate(-50%, -50%);'>
        {#if svgPaths.hasPath_for(title)}
            <svg
                viewBox='-2.2 -3.2 20 20'
                class='svg-glow-button-path'>
                <path d={svgPaths.path_for(title)} stroke={colors.border} fill={isHovering ? 'black' : 'white'} stroke-width='0.75'/>
            </svg>
        {:else}
            {title}
        {/if}
    </div>
</div>

<style>
    .glow.autorepeating {
        transform: scale(0.95);
        transition: transform 0.1s ease;
    }
</style> 