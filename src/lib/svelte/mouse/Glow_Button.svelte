<script lang='ts'>
    import { c, e, k, u, show, colors, svgPaths } from '../../ts/common/Global_Imports';
    import { Rect, Size, Point, T_Layer, S_Mouse } from '../../ts/common/Global_Imports';
    import Mouse_Responder from './Mouse_Responder.svelte';
    import SVG_Gradient from '../draw/SVG_Gradient.svelte';
    export let handle_click: (title: string) => boolean;
    export let font_size: number = k.font_size.banners;
    export let detect_autorepeat: boolean = false;
    export let banner_id: string = k.empty;
    export let title = k.empty;
    export let name = k.empty;
    export let height: number;
    export let width: number;
	const { w_background_color } = colors;
    const gradient_name = 'glow-' + banner_id;
    const icon_path = svgPaths.path_for(title);
    const glow_rect = Rect.createWHRect(width, height);
    const click_title = !!icon_path ? title : banner_id;
    const mouseTimer = e.mouse_timer_forName(`glow-button-${banner_id}-${click_title}`);
    let glow_button: HTMLElement | null = null;
    let banner_color = colors.banner;
    let isHovering = false;

	$: {
		const _ = $w_background_color;
		banner_color = colors.banner;
	}

    function intercept_click() {
        handle_click(click_title);
        isHovering = false;
    }

    function handle_s_mouse(s_mouse: S_Mouse) {
        if (s_mouse.hover_didChange) {
            const was_in = isHovering;
            isHovering = s_mouse.isHovering;
            if (s_mouse.isHovering && was_in && detect_autorepeat) {
                // Extra mouse enter event when we click - stop autorepeat
                mouseTimer.autorepeat_stop();
            }
        } else if (s_mouse.isDown) {
            if (detect_autorepeat) {
                mouseTimer.autorepeat_start(0, () => handle_click(click_title));
            } else {
                intercept_click();
            }
        } else if (s_mouse.isUp) {
            if (detect_autorepeat) {
                mouseTimer.autorepeat_stop();
            }
        }
    }

</script>

<div class='glow-button'
    bind:this={glow_button}
	class:autorepeating={detect_autorepeat && mouseTimer.isAutorepeating_forID(0)}
	style='
        width: {width}px;
        height: {height}px;
        position: relative;'>
    {#if !isHovering}
        <SVG_Gradient
            isInverted={true}
            name={gradient_name}
            color={banner_color}
            size={glow_rect.size}
            path={svgPaths.rectangle(glow_rect)}/>
    {/if}
    <Mouse_Responder
        width={width}
        height={height}
        name={name || `glow-${banner_id}`}
        handle_s_mouse={handle_s_mouse}
        detect_mouseUp={true}
        detect_mouseDown={true}
        origin={Point.zero}>
        <div class='glow-button-title'
            style='
                left: 50%;
                margin: 0;
                padding: 0;
                width: 100%;
                user-select: none;
                text-align: center;
                position: absolute;
                top: calc(50% + 1px);
                -ms-user-select: none;
                -moz-user-select: none;
                font-size: {font_size}px;
                -webkit-user-select: none;
                background-color: transparent;
                transform: translate(-50%, -50%);'>
            {#if !!icon_path}
                <svg
                    viewBox='-2.2 -3.2 20 20'
                    class='svg-glow-button-path'>
                    <path d={icon_path} stroke={colors.border} fill={isHovering ? 'black' : 'white'} stroke-width='0.75'/>
                </svg>
            {:else}
                {title}
            {/if}
        </div>
    </Mouse_Responder>
</div>

<style>
    .glow-button.autorepeating {
        transform: scale(0.95);
        transition: transform 0.1s ease;
    }
</style> 