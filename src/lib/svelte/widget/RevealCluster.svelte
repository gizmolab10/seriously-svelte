<script lang='ts'>
    import { k, ZIndex, onMount, svgFactory, graphEditor, dbDispatch } from '../../ts/common/GlobalImports';
    import { idShowRevealCluster } from '../../ts/managers/State';
	export let thing: Thing;
    const path = svgFactory.circle(16, 14);
    let color = 'black';
    let left = 60;

    onMount( () => {
        color = thing.color;
		left = thing.titleWidth + 5;
	});

	async function handleClick(id: string) {
        if (!thing.isExemplar) {
            switch (id) {
                case 'add': await graphEditor.thing_edit_remoteAddChildTo(thing); break;
                case 'delete': await dbDispatch.db.hierarchy.things_redraw_remoteTraverseDelete([thing]); break;
                default: break;
            }
            $idShowRevealCluster = null;
        }
    }

</script>

<button class='dismiss'
	style='top: -17px;
        left: {left}px;
		border: none;
		cursor: pointer;
		background: none;
        z-index:{ZIndex.overlay};'>
    <svg width='16'
		height='16'
		viewbox='0 0 16 16'
        on:click={() => handleClick('add')}>
        <path d={path} stroke={thing.color} fill={k.backgroundColor}/>
        <text x='2.5' y='14.5' fill={thing.color} font-size='1.5em'>+</text>
    </svg></button>
<button class='add'
	style='top: 24px;
        left: {left}px;
		border: none;
		cursor: pointer;
		background: none;
        z-index:{ZIndex.overlay};'>
    <svg width='16'
		height='16'
		viewbox='0 0 16 16'
        on:click={() => handleClick('delete')}>
        <path d={path} stroke={thing.color} fill={k.backgroundColor}/>
        <text x='3.5' y='14.5' fill={thing.color} font-size='2em'>-</text>
    </svg></button>

<style>
    button {
        border-width: 1px;
        position: absolute;
        border-radius: 17px
    }
</style>