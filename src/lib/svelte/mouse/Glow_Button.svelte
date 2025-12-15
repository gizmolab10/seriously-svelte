<script lang='ts'>
    import { c, e, k, u, hits, show, colors, svgPaths, elements } from '../../ts/common/Global_Imports';
    import { Rect, Size, Point, T_Layer, S_Mouse, T_Hit_Target } from '../../ts/common/Global_Imports';
    import Identifiable from '../../ts/runtime/Identifiable';
    import SVG_Gradient from '../draw/SVG_Gradient.svelte';
    import { onMount, onDestroy } from 'svelte';
    export let handle_click: (title: string) => boolean;
    export let font_size: number = k.font_size.banners;
    export let detect_autorepeat: boolean = false;
    export let banner_id: string = k.empty;
    export let title = k.empty;
    export let name = k.empty;
    export let height: number;
    export let width: number;
    const { w_s_hover } = hits;
	const { w_background_color } = colors;
    const gradient_name = 'glow-' + banner_id;
    const icon_path = svgPaths.path_for(title);
    const glow_rect = Rect.createWHRect(width, height);
    const click_title = !!icon_path ? title : banner_id;
    const mouseTimer = e.mouse_timer_forName(`glow-button-${banner_id}-${click_title}`);
    const s_element = elements.s_element_for(new Identifiable(`glow-${banner_id}-${title}`), T_Hit_Target.button, click_title);
    let glow_button: HTMLElement | null = null;
    let banner_color = colors.banner;

    onMount(() => {
        if (glow_button) {
            s_element.set_html_element(glow_button);
        }
        s_element.handle_s_mouse = handle_s_mouse;
    });

    onDestroy(() => {
        hits.delete_hit_target(s_element);
    });

    $: isHovering = s_element.isEqualTo($w_s_hover);

    // stop autorepeat when hover leaves
    $: if (!isHovering && detect_autorepeat) {
        mouseTimer.autorepeat_stop();
	}

	$: {
		const _ = $w_background_color;
		banner_color = colors.banner;
	}

	function handle_s_mouse(s_mouse: S_Mouse): boolean {
		if (s_mouse.isDown) {
			if (detect_autorepeat) {
				mouseTimer.autorepeat_start(0, () => handle_click(click_title));
			} else {
				handle_click(click_title);
			}
		}
		if (s_mouse.isUp) {
			if (detect_autorepeat) {
				mouseTimer.autorepeat_stop();
			}
		}
		return true;
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
    <div class='glow-button-title'
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
</div>

<style>
    .glow-button.autorepeating {
        transform: scale(0.95);
        transition: transform 0.1s ease;
    }
</style> 