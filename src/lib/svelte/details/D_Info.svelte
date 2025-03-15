<script lang='ts'>
	import { c, k, p, ux, show, Rect, Size, Point, Thing, debug, signals, Ancestry } from '../../ts/common/Global_Imports';
	import { w_ancestry_focus, w_ancestries_grabbed, w_thing_fontFamily } from '../../ts/common/Stores';
	import { T_Info, T_Trait, T_Layer, T_Element, T_Preference } from '../../ts/common/Global_Imports';
	import { w_hierarchy, w_color_trigger, w_info_title } from '../../ts/common/Stores';
	import type { Integer, Dictionary } from '../../ts/common/Types';
	import Identifiable from '../../ts/data/runtime/Identifiable';
	import Text_Editor from '../kit/Text_Editor.svelte';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../kit/Separator.svelte';
	import Color from '../kit/Color.svelte';
	import Table from '../kit/Table.svelte';
	import { onMount } from 'svelte';
	export let top = 0;
	const id = 'info';
	const margin = 10;
	const font_ratio = 0.8;
	const text_top = top + 52;
	const font_size = `${font_ratio}em`;
	const info_width = k.width_details - 30;
	const separator_font_size = `${k.tiny_font_size}px`;
	const traits_center = new Point(122, text_top - 20);
	const traits_width = k.width_details - (margin * 2);
	const traits_size = new Size(info_width - 58, k.default_buttonSize + 4);
	const traits_rect = Rect.createCenterRect(traits_center, traits_size);
	const es_info = ux.s_element_for(new Identifiable(id), T_Element.info, id);
	let ancestry: Ancestry | null = $w_ancestry_focus;
	let thing: Thing | null = ancestry?.thing ?? null;
	let text_box_size = new Size(info_width - 4, 68);
	let thingHID: Integer | null = thing?.hid;
	let information: Array<Dictionary> = [];
	let grabs = $w_ancestries_grabbed;
	let color = k.thing_color_default;
	let thing_title = thing?.title;
	let color_origin = Point.zero;
	let tops: Array<number> = [];
	let rebuilds = 0;
	let info;

	enum TI {
		segments,
		before_title,
		title,
		after_title,
		table,
		color,
		traits,
		consequence,
		quest
	};

	function heightAt(index: number) {
		switch (index) {
			case TI.segments:	  return  23;
			case TI.before_title: return   3;
			case TI.title:		  return  17;
			case TI.after_title:  return   3;
			case TI.table:		  return 125;
			case TI.color:		  return   2;
			case TI.traits:		  return   2;
			case TI.consequence:  return  50;
			case TI.quest:		  return  50;
		}
	}

	setup_tops();
	es_info.set_forHovering(k.color_default, 'pointer');
	
	onMount(() => {
		const handler = signals.handle_rebuildGraph(1, (ancestry) => {
			rebuilds += 1;
		});
		return () => { handler.disconnect() };
	});
	
	$: {
		const _ = `${$w_ancestries_grabbed} ${$w_ancestry_focus} ${$w_info_title}`;
		update_forKind();
	}
	
	$: {
		if (thing != ancestry?.thing) {
			update_forAncestry();
		}
	}
	
	$: {
		const id = $w_color_trigger;
		if (!!thing && thing.id == id) {
			color = thing.color;
			rebuilds += 1;
		}
	}

	function hasGrabs(): boolean {
		grabs = $w_ancestries_grabbed;
		return !!grabs && (grabs.length > 1 || !$w_ancestry_focus.isGrabbed);
	}

	function selection_closure(t_infos: Array<string>) {
		const t_info = t_infos[0];
		p.write_key(T_Preference.info, t_info);
		show.t_info = t_info;
		update_forKind();
	}
	
	function setup_tops() {
		let top = 0;
		tops = [];
		for (let i = 0; i <= TI.quest; i++) {
			tops.push(top);
			top += heightAt(i);
		}
		color_origin = new Point(76, tops[TI.color]);
	}

	function update_forKind() {
		if (show.t_info == T_Info.focus || !hasGrabs()) {
			ancestry = $w_ancestry_focus;
		} else {
			grabs = $w_ancestries_grabbed;
			if (!!grabs && grabs.length > 0) {
				ancestry = grabs[0];
			}
		}
		update_forAncestry();
	}

	function update_forAncestry() {
		thing = ancestry?.thing;
		if (!!thing) {
			console.log('INFO')
			thing_title = thing.title;
			thingHID = thing.hid;
			const dict = {
				'relationship' : ancestry.predicate.kind,
				'depth'		   : ancestry.depth.expressZero_asHyphen(),
				'order'		   : (ancestry.relationship?.order ?? 0).expressZero_asHyphen(),
				'children'	   : ancestry.children.length.expressZero_asHyphen(),
				'progeny'	   : ancestry.progeny_count().expressZero_asHyphen(),
				'parents'	   : thing.parents.length.expressZero_asHyphen(),
				'related'	   : thing.relatedRelationships.length.expressZero_asHyphen(),
				'id'		   : thing.id.clipWithEllipsisAt(12),
				'color'		   : k.empty,
			};
			information = Object.entries(dict);
			debug.log_info(information)
			rebuilds += 1;
		}
	}

	function handle_textChange(label: string, text: string | null) {
		if (!!thing && (!!text || text == k.empty)) {
			switch (label) {
				case 'quest':		thing.setTraitText_forType(text, T_Trait.quest);		 break;
				case 'consequence':	thing.setTraitText_forType(text, T_Trait.consequence); break;
			}
		} else if (!text) {		// do after test for k.empty, which also is interpreted as falsey
			(async () => {
				await $w_hierarchy.db.persist_all();
			})();
		}
	}

</script>

{#key rebuilds}
	{#if !!thing}
		<div class='info'
			style='
				color:black;
				top:{top}px;
				left:{margin}px;
				font-size:0.8em;
				position:absolute;
				width:{traits_width}px;'>
			{#if information.length != 0}
				<Segmented
					name='info-type'
					font_size={font_size}
					selected={[show.t_info]}
					height={k.row_height * font_ratio}
					selection_closure={selection_closure}
					origin={new Point(45, tops[TI.segments])}
					titles={[T_Info.focus, T_Info.selection]}/>
				{#key thing_title}
					<Separator title_font_size={separator_font_size} top={tops[TI.before_title]} left=5 title='title' width={info_width}/>
					<div style='
						position:absolute;
						text-align:center;
						top:{tops[TI.title]}px;
						width:{traits_width}px;'>
						{thing_title.clipWithEllipsisAt(30)}
					</div>
					<Separator top={tops[TI.after_title]} left=5 width={info_width}/>
				{/key}
				<Table top={tops[TI.table]} array={information}/>
			{/if}
			<Color thing={thing} origin={color_origin}/>
			{#if show.traits}
				<div class='horizontal-line'
					style='
						left:{-margin}px;
						position:absolute;
						width:{k.width_details}px;
						z-index:{T_Layer.frontmost};'>
				</div>
				<Text_Editor
					label='consequence'
					color=k.color_default
					top={tops[TI.consequence]}
					width={text_box_size.width}
					height={text_box_size.height}
					original_text={thing.consequence}
					handle_textChange={handle_textChange}/>
				<Text_Editor
					label='quest'
					top={tops[TI.quest]}
					color=k.color_default
					original_text={thing.quest}
					width={text_box_size.width}
					height={text_box_size.height}
					handle_textChange={handle_textChange}/>
			{/if}
		</div>
	{/if}
{/key}
