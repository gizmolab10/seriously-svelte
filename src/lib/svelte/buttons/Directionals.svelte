<script>
    import { k, Point, Direction } from '../../ts/common/GlobalImports';
    import TriangleButton from './TriangleButton.svelte'
    const origin = new Point(26, 27);
    const size = 20;
    const offsetY = size / 2 - 1;
    let toggle = false;
    export let display;
    export let hit;

	function hover_closure(isFilled) { return [isFilled ? 'black' : k.color_background, k.empty]; }

	function click_closure(event, isLong) {
        const pointsUp = event.currentTarget.id == 'up';
        hit(pointsUp);
        toggle = !toggle;
	}

</script>

<style>
    .directionals {
		top: 0px;
		left: 0px;
		position: absolute;     
    }
</style>

{#key toggle}
    <div class='directionals'>
        {#if display(true)}
            <TriangleButton
                center={origin.offsetByY(-offsetY)}
                hover_closure={hover_closure}
                click_closure={click_closure}
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
                click_closure={click_closure}
                direction={Direction.down}
                strokeColor={'black'}
                size={size}
                id='down'
            />
        {/if}
    </div>
{/key}
