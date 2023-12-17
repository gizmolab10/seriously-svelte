<script>
    import { k, Point, Direction } from '../../ts/common/GlobalImports';
    import TriangleDot from './TriangleDot.svelte'
    const origin = new Point(12, 10);
    const size = 24;
    let toggle = false;
    export let display;
    export let hit;

	function newFillColor(isFilled) { return isFilled ? 'black' : k.backgroundColor; }

	function onClick(event) {
        const pointsLeft = event.currentTarget.id == 'left';
        hit(pointsLeft);
        toggle = !toggle;
	}

</script>

<style>
    .directionals {
		top: 12px;
		left: 12px;
		position: absolute;     
    }
</style>

{#key toggle}
    <div class='directionals'>
        {#if display(true)}
            <TriangleDot
                newFillColor={newFillColor}
                direction={Direction.left}
                strokeColor={'black'}
                onClick={onClick}
                center={origin}
                size={size}
                id='left'
            />
        {/if}
        {#if display(false)}
            <TriangleDot
                center={origin.offsetByX(size)}
                newFillColor={newFillColor}
                direction={Direction.right}
                strokeColor={'black'}
                onClick={onClick}
                size={size}
                id='right'
            />
        {/if}
    </div>
{/key}
