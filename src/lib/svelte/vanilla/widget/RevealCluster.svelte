<script lang='ts'>
    import { k, ZIndex, onMount, svgPath, graphEditor, dbDispatch } from '../../../ts/common/GlobalImports';
    import { dot_size, id_showRevealCluster } from '../../../ts/managers/State';
	export let thing: Thing;
	let diameter = $dot_size;
    const path = svgPath.circle(diameter, diameter - 2);
    let color = 'black';
    let left = 60;

    onMount( () => {
        color = thing.color;
		left = thing.titleWidth;
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

<button class='add'
	style='top: {-diameter - 1.5}px;
        left: {left}px;
		border: none;
		cursor: pointer;
		background: none;
        z-index:{ZIndex.overlay};'>
    <svg width={diameter}
		height={diameter}
		viewbox='0 0 {diameter} {diameter}'
        on:click={() => handleClick('add')}>
        <path d={path} stroke={thing.color} fill={k.backgroundColor}/>
        <text x='2.5' y={diameter - 1.5} fill={thing.color} font-size='1.5em'>+</text>
    </svg></button>
<button class='dismiss'
	style='top: {diameter + 8}px;
        left: {left}px;
		border: none;
		cursor: pointer;
		background: none;
        z-index:{ZIndex.overlay};'>
    <svg width={diameter}
		height={diameter}
		viewbox='0 0 {diameter} {diameter}'
        on:click={() => handleClick('delete')}>
        <path d={path} stroke={thing.color} fill={k.backgroundColor}/>
        <text x='3.5' y={diameter - 1.5} fill={thing.color} font-size='2em'>-</text>
    </svg></button>

<style>
    button {
        border-width: 1px;
        position: absolute;
        border-radius: 17px
    }
</style>