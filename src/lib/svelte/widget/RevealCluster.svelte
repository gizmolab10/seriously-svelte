<script lang='ts'>
    import { k, onMount, ZIndex } from '../../ts/common/GlobalImports';
    import { idShowRevealCluster } from '../../ts/managers/State';
	export let thing: Thing;
    let color = 'black';
    let left = 60;

	onMount( () => {
        color = thing.color;
		left = thing.titleWidth + (thing.hasChildren ? 25 : 7);
	});

	function handleClick(id: string) {
        switch (id) {
            case 'dismiss': $idShowRevealCluster = ''; break;
            case 'add': alert('ADD'); break;
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
    on:click={() => handleClick('dismiss')}
>X</button>
<button class='add'
	style='top: 24px;
        left: {left}px;
        z-index:{ZIndex.overlay};
        background-color:{k.backgroundColor};
        border-color: {color};
        color: {color};'
    on:click={() => handleClick('add')}
>+</button>

<style>
    button {
        border-width: 1px;
        position: absolute;
        border-radius: 17px
    }
</style>