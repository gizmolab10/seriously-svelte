<script lang='ts'>
	import { k, u, T_Layer, T_Details, layout } from '../../ts/common/Global_Imports';
	import { w_show_details_ofType } from '../../ts/common/Stores';
	import { s_details } from '../../ts/state/S_Details';
	import Glows_Banner from './Glows_Banner.svelte';
	import { Motion } from 'svelte-motion';
    export let extra_titles: string[] = [];
    export let t_detail: T_Details;
	const titles = [T_Details[t_detail], ...extra_titles];
	const s_banner_hideable = s_details.s_banner_hideables_byType[t_detail];
	$: slot_isVisible = compute_slot_isVisible();

	function compute_slot_isVisible() {
		if (s_banner_hideable?.hasBanner) {
			return $w_show_details_ofType?.includes(T_Details[t_detail]) ?? false;
		}
		return true;
	}

	function toggle_hidden(t_detail: string) {
		let t_details = $w_show_details_ofType;
		if (t_details.includes(t_detail)) {
			t_details = u.remove_fromArray_byReference(t_detail, t_details);
		} else {
			t_details.push(t_detail);
		}
		$w_show_details_ofType = t_details;
		slot_isVisible = compute_slot_isVisible();
	}

</script>

<div
	class='{titles[0]}-dynamic-container'
	style='
		width: 100%;
		height: auto;
		display: flex;
		position: relative;
		flex-direction: column;
		background-color: transparent;
		z-index:{T_Layer.detailsPlus_1};'>
	{#if s_banner_hideable?.hasBanner}
		<div
			class='banner'
			style='
				top: 0px;
				width: 100%;
				display: flex;
				cursor: pointer;
				align-items: stretch;
				height: {layout.glows_banner_height}px;'>
			<Glows_Banner
				titles={titles}
				width={k.width_details}
				isSelected={slot_isVisible}
				toggle_hidden={toggle_hidden}
				font_size={k.font_size.banners}
				height={layout.glows_banner_height}/>
		</div>
	{/if}
	{#if slot_isVisible}
		<div
			style='
				z-index:{T_Layer.detailsPlus_2};'>
			<slot />
		</div>
	{/if}
</div>
