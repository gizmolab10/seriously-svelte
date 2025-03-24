<script lang='ts'>
    import { k, Point, Direction } from '../../ts/common/Global_Imports';
	import { w_background_color } from '../../ts/common/Stores';
    import Triangle_Button from './Triangle_Button.svelte';
    export let display;
    export let hit;
    const buttonSize = 20;
    const origin = new Point(32, 37);
    const offsetY = buttonSize / 2 - 1;
	let directionals_rebuilds = 0;

	function hover_closure(isHovering) {
        return [isHovering ? k.color_default : $w_background_color, k.empty];
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
                strokeColor={k.color_default}
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
                strokeColor={k.color_default}
                size={buttonSize}
                name='down'
            />
        {/if}
    </div>
{/key}
