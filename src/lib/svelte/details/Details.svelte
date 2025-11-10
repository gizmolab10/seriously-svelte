<script lang='ts'>
	import { w_ancestry_forDetails } from '../../ts/state/State';
	import { c, k, s, x, Point, search, layout } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Detail } from '../../ts/common/Global_Imports';
	import Banner_Hideable from './Banner_Hideable.svelte';
	import D_Preferences from './D_Preferences.svelte';
	import Separator from '../draw/Separator.svelte';
	import D_Selection from './D_Selection.svelte';
	import D_Actions from './D_Actions.svelte';
	import D_Header from './D_Header.svelte';
	import D_Traits from './D_Traits.svelte';
	import D_Data from './D_Data.svelte';
	import D_Tags from './D_Tags.svelte';
	const { w_count_details } = s;
	const width = k.width.details;
	const { w_search_state } = search;
	const { w_index: w_found } = x.si_found;
	const { w_description: w_grabs_description } = x.si_grabs;
	const { w_description: w_tags_description } = x.si_thing_tags;
	const { w_description: w_traits_description } = x.si_thing_traits;

	$: {
		const _ = `${$w_found}
		:::${$w_search_state}
		:::${$w_tags_description}
		:::${$w_grabs_description}
		:::${$w_traits_description}
		:::${$w_ancestry_forDetails}`;
		$w_count_details++;
	}

</script>

{#key $w_count_details}
	<div class='details-stack'
		style='
			left:3px;
			display:flex;
			overflow-y: auto;
			position:absolute;
			scrollbar-width: none;          /* Firefox */
			flex-direction:column;
			-ms-overflow-style: none;  
			z-index:{T_Layer.details};
			top:{layout.controls_boxHeight}px;
			width:{k.width.details - 6}px;
			height:{layout.windowSize.height - layout.controls_boxHeight}px;'>
		<Banner_Hideable t_detail={T_Detail.header}>
			<D_Header/>
		</Banner_Hideable>
		{#if c.has_standalone_UI}
			<Banner_Hideable t_detail={T_Detail.preferences}>
				<D_Preferences/>
			</Banner_Hideable>
		{/if}
		<Banner_Hideable t_detail={T_Detail.actions}>
			<D_Actions/>
		</Banner_Hideable>
		<Banner_Hideable t_detail={T_Detail.selection}>
			<D_Selection/>
		</Banner_Hideable>
		{#if c.has_standalone_UI}
			<Banner_Hideable t_detail={T_Detail.tags}>
				<D_Tags/>
			</Banner_Hideable>
			<Banner_Hideable t_detail={T_Detail.traits}>
				<D_Traits/>
			</Banner_Hideable>
		{/if}
		<Banner_Hideable t_detail={T_Detail.data}>
			<D_Data/>
		</Banner_Hideable>
	</div>
{/key}
<Separator name='right-of-details'
	isHorizontal={false}
	has_both_wings={true}
	margin={k.details_margin}
	thickness={k.thickness.separator.main}
	corner_radius={k.radius.gull_wings.thick}
	length={layout.windowSize.height - layout.controls_boxHeight + 6.5}
	origin={new Point(k.width.details - 2, layout.controls_boxHeight - 2.5)}
/>

<style>
	.details-stack::-webkit-scrollbar {
		display: none;                /* Chrome, Safari, Opera */
	}

	.details-stack > :global(*) {
		flex-shrink: 0;
	}
</style>
