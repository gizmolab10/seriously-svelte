<script lang='ts'>
    import { k, Point, colors, Direction } from '../ts/common/Global_Imports';
	import { w_background_color } from '../ts/common/Stores';
    import Triangle_Button from './Triangle_Button.svelte';
    let { display, hit } = $props();
    const buttonSize = 20;
    const origin = new Point(32, 37);
    const offsetY = buttonSize / 2 - 1;
	let directionals_rebuilds = $state(0);

	function hover_closure(isHovering) {
        return [isHovering ? colors.default : $w_background_color, k.empty];
    }

	function handle_mouse_state(s_mouse: S_Mouse): boolean {
        const target = s_mouse.element;
        if (!s_mouse.isHover && !!target && (s_mouse.isUp || s_mouse.isLong)) {
            const pointsUp = target.id == 'up';
            hit(pointsUp, s_mouse.isLong);
            directionals_rebuilds += 1;
        }
	}

</script>

<style>
    .directionals {
		top: 0px;
		left: 0px;
		position: absolute;     
    }
</style>

{#key directionals_rebuilds}
    <div class='directionals'>
        {#if display(true)}
            <Triangle_Button
                handle_mouse_state={handle_mouse_state}
                center={origin.offsetByY(-offsetY)}
                hover_closure={hover_closure}
                strokeColor={colors.default}
                angle={Direction.up}
                size={buttonSize}
                name='up'
            />
        {/if}
        {#if display(false)}
            <Triangle_Button
                handle_mouse_state={handle_mouse_state}
                center={origin.offsetByY(offsetY)}
                hover_closure={hover_closure}
                angle={Direction.down}
                strokeColor={colors.default}
                size={buttonSize}
                name='down'
            />
        {/if}
    </div>
{/key}
