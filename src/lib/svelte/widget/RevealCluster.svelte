<script lang='ts'>
    import { idShowRevealCluster } from '../../ts/managers/State';
    import { onMount, ZIndex } from '../../ts/common/GlobalImports';
	export let thing: Thing;
    let color = 'black';
    let left = 60;

	onMount( () => {
        color = thing.color;
		left = thing.titleWidth + 15;
	});

	function handleClick(id: string) {
        switch (id) {
            case 'dismiss': $idShowRevealCluster = 0; break;
            case 'add': alert('ADD'); break;
        }
    }

</script>

<button class='dismiss'
	style='z-index:{ZIndex.overlay}; left: {left}px; border-color: {color}; color: {color};'
    on:click={() => handleClick('dismiss')}
>X</button>
<button class='add'
	style='z-index:{ZIndex.overlay}; left: {left}px; border-color: {color}; color: {color};'
    on:click={() => handleClick('add')}
>+</button>

<style>
    button {
        position: absolute;
        border-radius: 17px
    }
	.dismiss {
        top: -20px;
	}
	.add {
        top: 24px;
	}
</style>