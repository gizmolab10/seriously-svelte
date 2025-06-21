<script lang='ts'>
	import { k, Point, layout, T_Layer, T_Details, T_Direction, u } from '../../ts/common/Global_Imports';
	import { w_graph_rect, w_count_details, w_show_graph_ofType, w_show_details_ofType } from '../../ts/common/Stores';
	import Animated_Section from './Animated_Section.svelte';
	import D_Databases from './D_Databases.svelte';
	import D_Display from './D_Display.svelte';
	import D_Actions from './D_Actions.svelte';
	import D_Header from './D_Header.svelte';
	import D_Traits from './D_Traits.svelte';
	import D_Thing from './D_Thing.svelte';
	import D_Tags from './D_Tags.svelte';
	import Glows_Banner from './Glows_Banner.svelte';
	import { s_details } from '../../ts/state/S_Details';

	const banner_height = k.height.banner.details;
	const next_previous_titles = [T_Direction.previous, T_Direction.next];
	
	$: if ($w_show_graph_ofType) {
		$w_count_details++;
	}

	const detail_sections = [
		{ component: D_Header, t_detail: T_Details.header, extra_titles: [] },
		{ component: D_Actions, t_detail: T_Details.actions, extra_titles: [] },
		{ component: D_Thing, t_detail: T_Details.properties, extra_titles: [] },
		{ component: D_Tags, t_detail: T_Details.tags, extra_titles: next_previous_titles },
		{ component: D_Traits, t_detail: T_Details.traits, extra_titles: next_previous_titles },
		{ component: D_Display, t_detail: T_Details.display, extra_titles: [] },
		{ component: D_Databases, t_detail: T_Details.database, extra_titles: [] },
	];

	function is_visible(t_detail: T_Details) {
		const s_hideable = s_details.s_hideables_byType[t_detail];
        if (s_hideable && s_hideable.hasBanner) {
            const type = T_Details[s_hideable.t_detail];
            return $w_show_details_ofType?.includes(type) ?? false;
        }
        return true;
    }

	function toggle_hidden(t_detail_as_string: string) {
		let t_details = $w_show_details_ofType;
		if (t_details.includes(t_detail_as_string)) {
			t_details = u.remove_fromArray_byReference(t_detail_as_string, t_details);
		} else {
			t_details.push(t_detail_as_string);
		}
		$w_show_details_ofType = t_details;
	}
</script>

{#key $w_count_details}
	<div class='details-stack'
		style='
			left:3px;
			display:flex;
			overflow-y: auto;
			position:absolute;
			scrollbar-width: none;
			flex-direction:column;
			-ms-overflow-style: none;  
			z-index:{T_Layer.details};
			top:{layout.graph_top - 2}px;
			width:{k.width_details - 6}px;
			height:{$w_graph_rect.size.height}px;'>
		
		{#each detail_sections as section (section.t_detail)}
			{@const title = T_Details[section.t_detail]}
			{@const s_hideable = s_details.s_hideables_byType[section.t_detail]}
			
			<div class="section-container">
				{#if s_hideable && s_hideable.hasBanner}
					<div class='banner-container' style='height: {banner_height}px;'>
						<Glows_Banner
							titles={[title, ...section.extra_titles]}
							height={banner_height}
							width={k.width_details}
							toggle_hidden={toggle_hidden}/>
					</div>
				{/if}
				<Animated_Section isVisible={is_visible(section.t_detail)}>
					<div class="content-wrapper">
						<svelte:component this={section.component} />
					</div>
				</Animated_Section>
			</div>
		{/each}
	</div>
{/key}

<style>
	.details-stack::-webkit-scrollbar { display: none; }
	.section-container {
		margin-bottom: 5px;
	}
	.banner-container {
		position: relative;
	}
	.content-wrapper {
		padding: 0 5px 5px 5px;
		border: 1px solid #ccc;
		border-top: none;
		border-radius: 0 0 5px 5px;
	}
</style> 