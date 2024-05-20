<script>
    import { k, Point, Direction } from '../../ts/common/GlobalImports';
    import TriangleButton from './TriangleButton.svelte'
    export let display;
    export let hit;
    const buttonSize = 20;
    const offsetY = buttonSize / 2 - 1;
    const origin = new Point(26, 27);
	let rebuilds = 0;

	function hover_closure(isFilled) {
        return [isFilled ? 'black' : k.color_background, k.empty];
    }

	function mouse_click_closure(event, isLong) {
        const pointsUp = event.currentTarget.id == 'up';
        hit(pointsUp);
        rebuilds += 1;
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
                mouse_click_closure={mouse_click_closure}
                center={origin.offsetByY(-offsetY)}
                hover_closure={hover_closure}
                direction={Direction.up}
                strokeColor={'black'}
                size={buttonSize}
                id='up'
            />
        {/if}
        {#if display(false)}
            <TriangleButton
                mouse_click_closure={mouse_click_closure}
                center={origin.offsetByY(offsetY)}
                hover_closure={hover_closure}
                direction={Direction.down}
                strokeColor={'black'}
                size={buttonSize}
                id='down'
            />
        {/if}
    </div>
{/key}
