<script lang='ts'>
	import { w_ancestry_forDetails, w_show_details_ofType } from '../../ts/managers/Stores';
	import { k, u, T_Layer, T_Detail, layout } from '../../ts/common/Global_Imports';
	import Glows_Banner from '../mouse/Glows_Banner.svelte';
	import { s_banners } from '../../ts/state/S_Banners';
    export let extra_titles: string[] = [];
    export let t_detail: T_Detail;
	const s_banner_hideable = s_banners.s_banner_hideables_byType[t_detail];
	const si_detail = s_banner_hideable?.si_detail;
	const { w_length: length } = si_detail;
	const { w_index: index } = si_detail;
	const { w_items: items } = si_detail;
	let trigger = k.empty;
	let hideable_isVisible = true;
	let titles = [s_banners.banner_title_forDetail(t_detail), ...extra_titles];

	update_hideable_isVisible();

	function update_trigger() { trigger = `${titles.join(k.comma)}:::${hideable_isVisible}:::${$w_ancestry_forDetails?.id}`; }

	$: { 
		const _ = $w_show_details_ofType;
		update_hideable_isVisible();
	}

	$: {
		const _ = `${$index}:::${$length}:::${u.descriptionBy_sorted_IDs($items)}:::${$w_ancestry_forDetails?.id}`;
		const new_titles = [s_banners.banner_title_forDetail(t_detail), ...extra_titles];
		if (new_titles.join(k.comma) != titles.join(k.comma)) {
			console.log(`titles: "${titles}" => "${new_titles}"`);
			titles = new_titles;
			update_trigger();
		}
	}

	function update_hideable_isVisible() {
		let isVisible = true;
		if (s_banner_hideable?.hasBanner) {	// d_header has no banner
			isVisible = $w_show_details_ofType?.includes(T_Detail[t_detail]) ?? false;
		}
		if (isVisible != hideable_isVisible) {
			hideable_isVisible = isVisible;
			update_trigger();
		}
	}

	function toggle_hidden(t_detail: string) {
		let t_details = $w_show_details_ofType;
		if (t_details.includes(t_detail)) {
			t_details = u.remove_fromArray_byReference(t_detail, t_details);
		} else {
			t_details.push(t_detail);
		}
		$w_show_details_ofType = t_details;
		update_hideable_isVisible();
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
	{#key trigger}
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
						isSelected={hideable_isVisible}
						toggle_hidden={toggle_hidden}
						banner_id={T_Detail[t_detail]}
						font_size={k.font_size.banners}
						height={layout.glows_banner_height}/>
			</div>
		{/if}
		{#if hideable_isVisible}
			<div class='hideable'
				style='
					z-index:{T_Layer.detailsPlus_2};'>
				<slot />
			</div>
		{/if}
	{/key}
</div>
