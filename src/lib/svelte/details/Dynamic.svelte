<script lang='ts'>
	import { k, u, T_Details } from '../../ts/common/Global_Imports';
	import { w_show_details_ofType } from '../../ts/common/Stores';
	import { s_details } from '../../ts/state/S_Details';
	import Glows_Banner from './Glows_Banner.svelte';
	import { Motion } from 'svelte-motion';
    export let extra_titles: string[] = [];
    export let t_detail: T_Details;
	const banner_height = k.height.banner.details;
	const titles = [T_Details[t_detail], ...extra_titles];
	const s_hideable = s_details.s_hideables_byType[t_detail];
	$: slot_isVisible = compute_slot_isVisible();

	function compute_slot_isVisible() {
		if (s_hideable?.hasBanner) {
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
		console.log('toggle_hidden', t_detail, slot_isVisible);
	}

</script>

<div
	class='{titles[0]}-dynamic-container'
	style='
		width: 100%;
		height: auto;
		display: flex;
		overflow: hidden;
		position: relative;
		flex-direction: column;
		background-color: transparent;'>
	{#if s_hideable.hasBanner}
		<div
			class='banner'
			style='
				top: 0px;
				width: 100%;
				display: flex;
				cursor: pointer;
				align-items: stretch;
				height: {banner_height}px;'>
			<Glows_Banner
				titles={titles}
				height={banner_height}
					width={k.width_details}
					toggle_hidden={toggle_hidden}/>
		</div>
	{/if}
	{#if slot_isVisible}
		<Motion
			initial={{ opacity: 0, height: 0 }}
			animate={{ opacity: 1, height: 'auto' }}
			exit={{ opacity: 0, height: 0 }}
			transition={{ duration: 0.01, ease: 'easeInOut' }}
			let:motion>
			<div use:motion style='overflow: hidden;'>
				<slot />
			</div>
		</Motion>
	{/if}
</div>
