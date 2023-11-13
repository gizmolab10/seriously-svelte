<script lang='ts'>
    import { k, ZIndex, onMount, graphEditor, dbDispatch } from '../../ts/common/GlobalImports';
    import { idShowRevealCluster } from '../../ts/managers/State';
	export let thing: Thing;
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
        z-index:{ZIndex.overlay};
        background-color:{k.backgroundColor};
        border-color: {color};
        color: {color};'
    on:click={() => handleClick('add')}
>+</button>
<button class='add'
	style='top: 24px;
        left: {left}px;
        z-index:{ZIndex.overlay};
        background-color:{k.backgroundColor};
        border-color: {color};
        color: {color};'
    on:click={() => handleClick('delete')}
>-</button>

<style>
    button {
        border-width: 1px;
        position: absolute;
        border-radius: 17px
    }
</style>