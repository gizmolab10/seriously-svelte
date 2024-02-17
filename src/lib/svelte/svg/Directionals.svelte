<script>
    import { k, Point, Direction } from '../../ts/common/GlobalImports';
    import TriangleButton from './TriangleButton.svelte'
    const origin = new Point(16, 17);
    const size = 20;
    const offsetY = size / 2 - 1;
    let toggle = false;
    export let display;
    export let hit;

	function fillColor_closure(isFilled) { return isFilled ? 'black' : k.backgroundColor; }

	function onClick(event) {
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
                fillColor_closure={fillColor_closure}
                center={origin.offsetByY(-offsetY)}
                direction={Direction.up}
                strokeColor={'black'}
                onClick={onClick}
                size={size}
                id='up'
            />
        {/if}
        {#if display(false)}
            <TriangleButton
                fillColor_closure={fillColor_closure}
                center={origin.offsetByY(offsetY)}
                direction={Direction.down}
                strokeColor={'black'}
                onClick={onClick}
                size={size}
                id='down'
            />
        {/if}
    </div>
{/key}
