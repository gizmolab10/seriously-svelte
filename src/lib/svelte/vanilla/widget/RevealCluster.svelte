<script lang='ts'>
    import { k, Size, Point, ZIndex, onMount, svgPath, Direction, dbDispatch, graphEditor } from '../../../ts/common/GlobalImports';
    import { dot_size, row_height, id_showingTools } from '../../../ts/managers/State';
	import TriangleExtraButton from '../../svg/TriangleExtraButton.svelte';
	import CircularButton from '../../kit/CircularButton.svelte';
	import Trash from '../../svg/Trash.svelte';
	export let thing: Thing;
	let diameter = $dot_size;
    const path = svgPath.circle(diameter, diameter - 2);
    let parentCenter = new Point();
    let childCenter = new Point();
	let radius = $dot_size / 2;
    let color = 'black';
    let left = 60;
    let top = 24;

    onMount( () => {
        color = thing.color;
        const width = thing.titleWidth;
        const offsetX = Math.max(0, (k.clusterHeight - width - 21) / 8)
        const offsetY = Math.max(0, (k.clusterHeight - $row_height - 21) / 8)
		left = width + offsetX - 1;
        top = 24 - offsetY;
        childCenter = new Point(left, top - diameter);
        parentCenter = new Point(7 - offsetX, top - diameter);
	});

	async function handleClick(id: string) {
        if (!thing.isExemplar) {
            switch (id) {
                case 'child': await graphEditor.thing_edit_remoteAddChildTo(thing); break;
                case 'parent': await graphEditor.thing_edit_remoteInsertParent(thing); break;
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

<TriangleExtraButton
	fillColor_closure={() => { return k.backgroundColor; }}
	onClick={() => handleClick('parent')}
    extra={svgPath.cross(diameter, 2)}
	direction={Direction.left}
	center={parentCenter}
	strokeColor={color}
    size={diameter}
	display='block'
	id={'parent'}/>
<TriangleExtraButton
	fillColor_closure={() => { return k.backgroundColor; }}
	onClick={() => handleClick('child')}
    extra={svgPath.cross(diameter, 2)}
	direction={Direction.right}
	center={childCenter}
	strokeColor={color}
    size={diameter}
	display='block'
	id={'child'}/>
<button class='dismiss'
    on:click={() => handleClick('delete')}
	style='top: {top + diameter + 13}px;
        left: {left - 1}px;
		border: none;
		cursor: pointer;
		background: none;
        z-index:{ZIndex.overlay};'>
    <Trash color={color}/>
</button>
