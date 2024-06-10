<script lang='ts'>
    import { k, Point, Direction } from '../../ts/common/GlobalImports';
    import TriangleButton from './TriangleButton.svelte'
    export let display;
    export let hit;
    const buttonSize = 20;
    const origin = new Point(26, 27);
    const offsetY = buttonSize / 2 - 1;
	let rebuilds = 0;

	function hover_closure(isFilled) {
        return [isFilled ? 'black' : k.color_background, k.empty];
    }

	function mouse_closure(mouseState) {
        const target = mouseState.element;
        if (!mouseState.isHover && !!target && (mouseState.isUp || mouseState.isLong)) {
            const pointsUp = target.id == 'up';
            hit(pointsUp, mouseState.isLong);
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
            <TriangleButton
                center={origin.offsetByY(-offsetY)}
                mouse_closure={mouse_closure}
                hover_closure={hover_closure}
                direction={Direction.up}
                strokeColor={'black'}
                size={buttonSize}
                name='up'
            />
        {/if}
        {#if display(false)}
            <TriangleButton
                center={origin.offsetByY(offsetY)}
                mouse_closure={mouse_closure}
                hover_closure={hover_closure}
                direction={Direction.down}
                strokeColor={'black'}
                size={buttonSize}
                name='down'
            />
        {/if}
    </div>
{/key}
