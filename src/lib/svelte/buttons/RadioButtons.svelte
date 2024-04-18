<script>
	import { onMount } from '../../ts/common/GlobalImports';
	export let idSelected = null;
	export let menuItems;


	onMount( () => {
		if (!idSelected && menuItems.length > 0) {
			idSelected = menuItems[0].id;	// Initialize idSelected to the id of the first menuItem
		}
	});

	function handle_singleClick(id) {
		idSelected = id;
		const selectedMenuItem = menuItems.find(menuItem => menuItem.id === idSelected);
		if (selectedMenuItem) {
			selectedMenuItem.action();
		}
	}
	
	function handle_key_down(event) { event.preventDefault(); return false; }
</script>

<style>
	.radio {
		cursor: pointer;
	}
	.menu-item {
		position: relative;
		left: -3px;
		display: flex;
		align-items: center;
		padding: 1px;
		cursor: pointer;
	}
	.label-text {
		position: relative;
		margin-top: 1px;
	}
</style>

<div class='radio-buttons'>
	{#each menuItems as menuItem}
		<label class="menu-item"
			style='on:keydown={handle_key_down}'>
			<input class='radio'
				name='menu'
				type='radio'
				value={menuItem.id}
				style='outline: none'
				bind:group={idSelected}
				on:keydown={handle_key_down}
				on:change={() => handle_singleClick(menuItem.id) }/>
			<div class="label-text">{menuItem.label}</div>
		</label>
	{/each}
</div>
