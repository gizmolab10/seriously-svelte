<script lang='ts'>
	import { k, u, T_Layer, T_Detail, layout } from '../../ts/common/Global_Imports';
	import { w_show_details_ofType } from '../../ts/managers/Stores';
	import Glows_Banner from '../mouse/Glows_Banner.svelte';
	import { s_banners } from '../../ts/state/S_Banners';
    export let extra_titles: string[] = [];
    export let t_detail: T_Detail;
	const s_banner_hideable = s_banners.s_banner_hideables_byType[t_detail];
	const titles = [s_banners.banner_title_forDetail(t_detail), ...extra_titles];
	$: slot_isVisible = compute_slot_isVisible();

	function compute_slot_isVisible() {
		if (s_banner_hideable?.hasBanner) {
			return $w_show_details_ofType?.includes(T_Detail[t_detail]) ?? false;
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

<div class='{titles[0]}-dynamic-container'
	style='
		width: 100%;
		height: auto;
		display: flex;
		position: relative;
		flex-direction: column;
		background-color: transparent;
		z-index:{T_Layer.detailsPlus_1};'>
	{#if s_banner_hideable?.hasBanner}
		<div class='banner'
			style='
				top: 0px;
				width: 100%;
				display: flex;
				cursor: pointer;
				align-items: stretch;
				height: {layout.glows_banner_height}px;'>
			<Glows_Banner
				titles={titles}
				width={k.width.details}
				isSelected={slot_isVisible}
				toggle_hidden={toggle_hidden}
				banner_id={T_Detail[t_detail]}
				font_size={k.font_size.banners}
				height={layout.glows_banner_height}/>
		</div>
	{/if}
	{#if slot_isVisible}
		<div class='hideable'
			style='
				z-index:{T_Layer.detailsPlus_2};'>
			<slot />
		</div>
	{/if}
</div>
