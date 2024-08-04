<script lang='ts'>
    import { k, Point, Direction } from '../../ts/common/Global_Imports';
    import Triangle_Button from './Triangle_Button.svelte'
    export let display;
    export let hit;
    const buttonSize = 20;
    const origin = new Point(26, 27);
    const offsetY = buttonSize / 2 - 1;
	let rebuilds = 0;

	function hover_closure(isHovering) {
        return [isHovering ? 'black' : k.color_background, k.empty];
    }

	function handle_mouse_state(mouse_state: Mouse_State): boolean {
        const target = mouse_state.element;
        if (!mouse_state.isHover && !!target && (mouse_state.isUp || mouse_state.isLong)) {
            const pointsUp = target.id == 'up';
            hit(pointsUp, mouse_state.isLong);
            rebuilds += 1;
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

{#key rebuilds}
    <div class='directionals'>
        {#if display(true)}
            <Triangle_Button
                handle_mouse_state={handle_mouse_state}
                center={origin.offsetByY(-offsetY)}
                hover_closure={hover_closure}
                strokeColor={'black'}
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
                strokeColor={'black'}
                size={buttonSize}
                name='down'
            />
        {/if}
    </div>
{/key}
