<script>
	import { onMount } from '../../ts/common/GlobalImports';
	export let idSelected = null;
	export let menuItems;


	onMount( () => {
		if (!idSelected && menuItems.length > 0) {
			idSelected = menuItems[0].id;	// Initialize idSelected to the id of the first menuItem
		}
	});

	function handleSelect(id) {
		idSelected = id;
		const selectedMenuItem = menuItems.find(menuItem => menuItem.id === idSelected);
		if (selectedMenuItem) {
			selectedMenuItem.action();
		}
	}
	
	function handleKeyDown(event) { event.preventDefault(); return false; }
</script>

<div class='popup'>
	{#each menuItems as menuItem}
		<label class="menu-item"
			style='on:keydown={handleKeyDown}'>
			<input class='radio'
				name='menu'
				type='radio'
				style='outline: none'
				on:keydown={handleKeyDown}
				value={menuItem.id}
				on:change={() => handleSelect(menuItem.id) }
				bind:group={idSelected}/>
			<div class="label-text">{menuItem.label}</div>
		</label>
	{/each}
</div>

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
