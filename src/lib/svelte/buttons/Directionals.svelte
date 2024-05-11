<script>
    import { k, Point, Direction } from '../../ts/common/GlobalImports';
    import TriangleButton from './TriangleButton.svelte'
    export let display;
    export let hit;
    const origin = new Point(26, 27);
    const offsetY = size / 2 - 1;
	let rebuilds = 0;
    const size = 20;

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
                center={origin.offsetByY(-offsetY)}
                hover_closure={hover_closure}
                mouse_click_closure={mouse_click_closure}
                direction={Direction.up}
                strokeColor={'black'}
                size={size}
                id='up'
            />
        {/if}
        {#if display(false)}
            <TriangleButton
                center={origin.offsetByY(offsetY)}
                hover_closure={hover_closure}
                mouse_click_closure={mouse_click_closure}
                direction={Direction.down}
                strokeColor={'black'}
                size={size}
                id='down'
            />
        {/if}
    </div>
{/key}
