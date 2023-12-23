<script lang='ts'>
    import { k, Size, ZIndex, onMount, svgPath, graphEditor, dbDispatch } from '../../../ts/common/GlobalImports';
    import { dot_size, id_showRevealCluster } from '../../../ts/managers/State';
	import CircularButton from '../../kit/CircularButton.svelte';
	import Trash from '../../kit/Trash.svelte';
	export let thing: Thing;
	let diameter = $dot_size;
    const path = svgPath.circle(diameter, diameter - 2);
    let color = 'black';
    let left = 60;
    let top = 20;

    onMount( () => {
        color = thing.color;
        const width = thing.titleWidth;
        const delta = Math.max(0, k.clusterHeight - width - 25)
		left = width + delta / 8;
	});

	async function handleClick(id: string) {
        if (!thing.isExemplar) {
            switch (id) {
                case 'add': await graphEditor.thing_edit_remoteAddChildTo(thing); break;
                case 'delete': await dbDispatch.db.hierarchy.things_redraw_remoteTraverseDelete([thing]); break;
                default: break;
            }
            $id_showRevealCluster = null;
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

<button class='add'
    on:click={() => handleClick('add')}
	style='top: {top - diameter + 1.5}px;
        left: {left}px;
		border: none;
		cursor: pointer;
		background: none;
        z-index:{ZIndex.overlay};'>
    <svg width={diameter}
		height={diameter}
		viewbox='0 0 {diameter} {diameter}'>
        <path d={path} stroke={color} fill={k.backgroundColor}/>
        <text x='1.5' y={diameter} fill={color} font-size='1.5em'>+</text>
    </svg>
</button>
<button class='dismiss'
    on:click={() => handleClick('delete')}
	style='top: {top + diameter + 14}px;
        left: {left - 1}px;
		border: none;
		cursor: pointer;
		background: none;
        z-index:{ZIndex.overlay};'>
    <Trash color={color}/>
</button>
