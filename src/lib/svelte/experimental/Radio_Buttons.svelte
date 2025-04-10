<script lang='ts'>
	import { k, u } from '../../ts/common/Global_Imports';
	import { onMount } from 'svelte';
	interface Props {
		fitWithin?: any;
		idSelected?: any;
		name?: string;
		menuItems: any;
	}

	let {
		fitWithin = k.width_details,
		idSelected = $bindable(null),
		name = 'menu',
		menuItems
	}: Props = $props();
	let style = $state(k.empty);

	onMount(() => {
		determineStyle();
		if (!idSelected && menuItems.length > 0) {
			idSelected = menuItems[0].id;	// Initialize idSelected to the id of the first menuItem
		}
	});
	
	function handle_key_down(event) { event.preventDefault(); return false; }

	function handle_singleClick(id) {
		idSelected = id;
		const selectedMenuItem = menuItems.find(menuItem => menuItem.id === idSelected);
		if (!!selectedMenuItem) {
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
			style = `display:flex;
				flex-direction:row;
				align-items:center;
				justify-content:space-around;
			`.removeWhiteSpace();
		}
	}

</script>

<style>
	.radio {
		cursor: pointer;
	}
	.menu-item {
		align-items: center;
		position: relative;
		cursor: pointer;
		display: flex;
		left: -3px;
	}
	.label-text {
		position: relative;
		margin-top: 1px;
	}
</style>

<div class='radio-buttons'
	style={style}>
	{#each menuItems as menuItem}
		<label class='menu-item' id = {menuItem.label}
			style='on:keydown={handle_key_down}'>
			<input class='radio'
				name={name}
				type='radio'
				value={menuItem.id}
				style='outline: none'
				bind:group={idSelected}
				onkeydown={handle_key_down}
				onchange={() => handle_singleClick(menuItem.id)}/>
			<div class="label-text">{menuItem.label}</div>
		</label>
	{/each}
</div>
