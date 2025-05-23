<script lang='ts'>
	import { S_Mouse, T_Trait, T_Tool, T_Element, T_ButtonRequest } from '../../ts/common/Global_Imports';
	import { k, ux, show, colors, Size, Thing, Trait, Point } from '../../ts/common/Global_Imports';
	import { w_hierarchy, w_show_traits_ofType, w_ancestries_grabbed, w_thing_traits } from '../../ts/common/Stores';
	import Identifiable from '../../ts/runtime/Identifiable';
    import Buttons_Row from '../buttons/Buttons_Row.svelte';
	import { s_details } from '../../ts/state/S_Details';
	import Text_Editor from '../kit/Text_Editor.svelte';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../kit/Separator.svelte';
	import Button from '../buttons/Button.svelte';
	export let top = 0;
	const es_button = ux.s_element_for(new Identifiable('trait'), T_Element.button, 'trait');
	let text_box_size = new Size(k.width_details - 34, 68);

	s_details.update_traits();
	es_button.set_forHovering(colors.default, 'pointer');
	function box_label_for(trait: Trait) { return `activate ${trait.t_trait}`; }
	function handle_label_click(trait: Trait) { window.open(trait.text, '_blank'); }
	function handle_textChange(text: string, trait: Trait) { $w_hierarchy.trait_setText_forType_ownerHID(text, trait, s_details.ancestry?.thing?.hid ?? null); }
	
	function selection_closure(titles: Array<T_Trait>) {
		$w_show_traits_ofType = titles;
		s_details.update_hierarchy_traits();
	}
	
	function handle_click_forColumn(s_mouse: S_Mouse, column: number): boolean {
		if (s_mouse.isDown) {
			s_details.update_trait_forColumn(column);
		}
		return false;
	}

	function handle_buttonRequest(t_buttonRequest: T_ButtonRequest, s_mouse: S_Mouse, column: number): any {
		const ids = ['previous', 'next'];
		switch (t_buttonRequest) {
			case T_ButtonRequest.is_visible:   return true;
			case T_ButtonRequest.name:		   return ids[column];
			case T_ButtonRequest.handle_click: return handle_click_forColumn(s_mouse, column);
			default:						   return false;
		}
		return null;
	}

	function handle_textChange_wasInD_Info(label: string, text: string | null) {
		if (!!thing && (!!text || text == k.empty)) {
			switch (label) {
				case 'link':		thing.setTraitText_forType(text, T_Trait.link);		   break;
				case 'quest':		thing.setTraitText_forType(text, T_Trait.quest);	   break;
				case 'consequence':	thing.setTraitText_forType(text, T_Trait.consequence); break;
			}
		} else if (!text) {		// do after test for k.empty, which also is interpreted as falsey
			(async () => {
				await $w_hierarchy.db.persist_all();
			})();
		}
	}

</script>

<div class='hierarchy_traits'
	style='
		top:{top}px;
		position:absolute;
		font-size:{k.font_size.smaller}px;'>
	<Segmented
		height={20}
		allow_multiple={true}
		name='hierarchy_traits'
		origin={new Point(10, 3)}
		selected={$w_show_traits_ofType}
		titles={['text', 'link']}
		font_size={k.font_size.smaller}
		selection_closure={selection_closure}/>
	<Buttons_Row
		margin=0
		width=149
		show_box={false}
		has_title={false}
		button_height={18}
		horizontal_gap={6}
		name='hierarchy_traits'
		origin={new Point(70, 4)}
		closure={handle_buttonRequest}
		row_titles={['previous', 'next']}
		font_sizes={[k.font_size.smallest, k.font_size.smaller]}/>
	{#key $w_thing_traits}
		<div style='
			top:26px;
			position:absolute;
			text-align:center;
			width:{k.width_details}px;
			font-size:{k.font_size.smaller}px;'>
			{#if s_details.total_traits > 0}
				trait {s_details.index_ofTrait + 1} of {s_details.total_traits}
			{:else}
				no traits
			{/if}
		</div>
		{#if !!$w_thing_traits && $w_thing_traits.length > 0}
			{#each $w_thing_traits as trait}
				{#if trait.text.length > 0}
					<Text_Editor
						top={47}
						left={10}
						label={trait.t_trait}
						color={colors.default}
						original_text={trait.text}
						width={text_box_size.width}
						height={text_box_size.height}
						label_underline={trait.t_trait == 'link'}
						onLabelClick={() => handle_label_click(trait)}
						label_color={trait.t_trait == 'link' ? 'blue' : 'gray'}
						handle_textChange={(label, text) => handle_textChange(label, text, trait)}/>
				{:else}
					<div style='
						top:40px;
						position:absolute;
						text-align:center;
						width:{k.width_details}px;
						font-size:{k.font_size.smaller}px;'>
						is empty
					</div>
				{/if}
			{/each}
		{/if}
	{/key}
</div>
