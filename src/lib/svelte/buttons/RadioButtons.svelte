<script>
	import { k, u, onMount } from '../../ts/common/GlobalImports';
	export let idSelected = null;
	export let fitWithin = 100;
	export let menuItems;
	let style = k.empty;

	onMount( () => {
		determineStyle();
		if (!idSelected && menuItems.length > 0) {
			idSelected = menuItems[0].id;	// Initialize idSelected to the id of the first menuItem
		}
	});
	
	function handle_key_down(event) { event.preventDefault(); return false; }

	function handle_singleClick(id) {
		idSelected = id;
		const selectedMenuItem = menuItems.find(menuItem => menuItem.id === idSelected);
		if (selectedMenuItem) {
			selectedMenuItem.action();
		}
	}

	function determineStyle() {
		let totalWidth = 0;
		for (const item of menuItems) {
			const width = u.getWidthOf(item.label);
			totalWidth += width + 25;
		}
		if (totalWidth <= fitWithin) {
			style = `
				display: flex; /* Use Flexbox to align children horizontally */
				flex-direction: row; /* Align children in a row */
				align-items: center; /* Align items vertically in the center */
				justify-content: space-around; /* Distribute space around items */
			`;
		}
	}

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
		cursor: pointer;
	}
	.label-text {
		position: relative;
		margin-top: 1px;
	}
</style>

<div class='radio-buttons'
	style={style}>
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
