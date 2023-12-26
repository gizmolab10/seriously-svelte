<script lang='ts'>
    import { k, Size, Point, ZIndex, onMount, svgPath, Direction, dbDispatch, graphEditor } from '../../../ts/common/GlobalImports';
    import { dot_size, id_showingTools } from '../../../ts/managers/State';
	import CircularButton from '../../kit/CircularButton.svelte';
	import TriangleButton from '../../svg/TriangleButton.svelte';
	import Trash from '../../svg/Trash.svelte';
	export let thing: Thing;
	let diameter = $dot_size;
    const path = svgPath.circle(diameter, diameter - 2);
	let radius = $dot_size / 2;
    let center = new Point();
    let color = 'black';
    let left = 60;
    let top = 21;

    onMount( () => {
        color = thing.color;
        const width = thing.titleWidth;
        const offsetX = Math.max(0, (k.clusterHeight - width - 25) / 8)
		left = width + offsetX;
        center = new Point(left, top - diameter);
	});

	async function handleClick(id: string) {
        if (!thing.isExemplar) {
            switch (id) {
                case 'add': await graphEditor.thing_edit_remoteAddChildTo(thing); break;
                case 'delete': await dbDispatch.db.hierarchy.things_redraw_remoteTraverseDelete([thing]); break;
                default: break;
            }
            $id_showingTools = null;
        }
    }

</script>

<style>
    button {
        border-width: 1px;
        position: absolute;
        border-radius: 17px
    }
</style>

<TriangleButton
	fillColor_closure={() => { return k.backgroundColor; }}
	onClick={() => handleClick('add')}
	direction={Direction.right}
	strokeColor={color}
	center={center}
    size={diameter}
	display='block'
	id={'add'}/>
<button class='dismiss'
    on:click={() => handleClick('delete')}
	style='top: {top + diameter + 12}px;
        left: {left - 1}px;
		border: none;
		cursor: pointer;
		background: none;
        z-index:{ZIndex.overlay};'>
    <Trash color={color}/>
</button>
