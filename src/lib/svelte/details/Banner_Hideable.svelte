<script lang='ts'>
	import { k, u, show, T_Layer, T_Detail, layout, details } from '../../ts/common/Global_Imports';
	import { w_ancestry_forDetails } from '../../ts/managers/Stores';
	import Glows_Banner from '../mouse/Glows_Banner.svelte';
    export let t_detail: T_Detail;
	const { w_details_ofType } = show;
	const s_banner_hideable = details.s_banner_hideables_byType[t_detail];
	const { w_description: w_description, w_extra_titles: w_extra_titles } = s_banner_hideable?.si_items;
	let title = details.banner_title_forDetail(t_detail);
	let titles = [title, ...$w_extra_titles];
	let hideable_isVisible = true;
	let trigger = k.empty;

	update_hideable_isVisible();

	$: {
		const _ = `${$w_description}:::${$w_ancestry_forDetails?.id}`;
		update_banner_titles();
	}

	$: { 
		const _ = $w_details_ofType;
		update_hideable_isVisible();
	}

	function update_trigger() { trigger = `${titles.join(k.comma)}:::${hideable_isVisible}:::${$w_description}:::${$w_ancestry_forDetails?.id}`; }

	function update_banner_titles() {
		const new_title = details.banner_title_forDetail(t_detail);
		const new_titles = [new_title, ...$w_extra_titles];
		if (new_titles.join(k.comma) == titles.join(k.comma)) {
			// console.log(`no trigger: "${new_title}"`);
		} else {
			const prior_titles = titles;
			titles = new_titles;
			title = new_title;
			update_trigger();
			// console.log(`now: "${new_title}" description: "${$w_description}"`);
		}
	}

	function update_hideable_isVisible() {
		let isVisible = true;
		if (s_banner_hideable?.hasBanner) {	// d_header has no banner
			isVisible = $w_details_ofType?.includes(T_Detail[t_detail]) ?? false;
		}
		if (isVisible != hideable_isVisible) {
			hideable_isVisible = isVisible;
			update_trigger();
		}
	}

	function toggle_hidden(t_detail: string) {
		let t_details = $w_details_ofType;
		if (t_details.includes(t_detail)) {
			t_details = u.remove_fromArray_byReference(t_detail, t_details);
		} else {
			t_details.push(t_detail);
		}
		$w_details_ofType = t_details;
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
						toggle_hidden={toggle_hidden}
						banner_id={T_Detail[t_detail]}
						font_size={k.font_size.banners}
						isSelected={hideable_isVisible}
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
