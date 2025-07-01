<script lang='ts'>
    import { e, k, u, show, Rect, Size, Point, colors, svgPaths, T_Layer } from '../../ts/common/Global_Imports';
	import { w_background_color } from '../../ts/common/Stores';
    import SVG_Gradient from '../kit/SVG_Gradient.svelte';
    import Button from './Button.svelte';
    import Mouse_Timer from '../../ts/signals/Mouse_Timer';
    export let width: number;
    export let height: number;
    export let title = k.empty;
    export let isSelected: boolean = false;
    export let performs_autorepeat: boolean = false;
    export let font_size: number = k.font_size.banners;
    export let handle_click: (title: string) => boolean;
    const mouseTimer = e.mouse_timer_forName(`glow-button-singleton`);
    const glow_rect = Rect.createWHRect(width, height);
    const gradient_name = 'glow-' + title;
    let isHovering = false;
    let timeout: number | null = null;
    let banner_color = colors.ofBannerFor($w_background_color);
    $: isInverted = !isHovering || svgPaths.hasPath_for(title);

	$: {
		const _ = $w_background_color;
		banner_color = colors.ofBannerFor($w_background_color);
	}

    function intercept_click() {
        isHovering = false;                // suppress distraction from hover
        handle_click(title);
    }

    function handle_mouse_down() {
        if (performs_autorepeat) {
            mouseTimer.autorepeat_start(0, () => handle_click(title));
        }
    }

    function handle_mouse_up() {
        if (performs_autorepeat) {
            mouseTimer.autorepeat_stop();
        }
    }

    function handle_mouse_leave() {
        isHovering = false;
        if (performs_autorepeat) {
            mouseTimer.autorepeat_stop();
        }
    }

    function handle_mouse_enter(is_in: boolean) {
        const was_in = isHovering;
        isHovering = is_in;
        if (!!timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        if (is_in) {
            if (isSelected) {
                timeout = setTimeout(() => {
                    isHovering = false;        // suppress distraction from hover
                }, 1000);
            }
            if (was_in) {
                mouseTimer.autorepeat_stop();
            }
        }
    }
    
</script>

<div
	class='glow'
	class:autorepeating={performs_autorepeat && mouseTimer.isAutorepeating_forID(0)}
	style='
        width: {width}px;
        height: {height}px;
        position: relative;'>
    {#if isInverted}
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
        on:mouseleave={handle_mouse_leave}
        on:mouseenter={() => handle_mouse_enter(true)}
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

<style>
    .glow.autorepeating {
        transform: scale(0.95);
        transition: transform 0.1s ease;
    }
</style> 