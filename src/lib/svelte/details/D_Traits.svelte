<script lang='ts'>
	import { k, ux, show, colors, Size, Thing, Trait, Point, Ancestry } from '../../ts/common/Global_Imports';
	import { S_Mouse, T_Trait, T_Tool, T_Element, T_ButtonRequest } from '../../ts/common/Global_Imports';
	import { w_hierarchy, w_ancestries_grabbed } from '../../ts/common/Stores';
	import Identifiable from '../../ts/runtime/Identifiable';
    import Buttons_Row from '../buttons/Buttons_Row.svelte';
	import Text_Editor from '../kit/Text_Editor.svelte';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../kit/Separator.svelte';
	import Button from '../buttons/Button.svelte';
	export let top = 0;
	const s_traits = ux.s_traits;
	const es_button = ux.s_element_for(new Identifiable('trait'), T_Element.button, 'trait');
	let ancestry: Ancestry | null = $w_hierarchy.grabs_latest_ancestry;
	let text_box_size = new Size(k.width_details - 34, 68);
	let thing: Thing | null = ancestry?.thing ?? null;
	let hierarchy_traits = $w_hierarchy.traits ?? [];
	let thing_traits = thing?.traits ?? [];
	let index = 0;

	update_traits();
	es_button.set_forHovering(colors.default, 'pointer');
	$: $w_ancestries_grabbed, update_traits();
	
	function selection_closure(titles: Array<string>) {
		console.log('selection_closure', titles);
	}

	function box_label_for(trait: Trait) {
		return `activate ${trait.t_trait}`;
	}

	function handle_label_click(trait: Trait) {
		window.open(trait.text, '_blank');
	}

	function handle_textChange(text: string, trait: Trait) {
		$w_hierarchy.trait_setText_forType_ownerHID(text, trait, thing.hid);
	}

	function update_traits() {
		ancestry = $w_hierarchy.grabs_latest_ancestry;
		thing = ancestry?.thing ?? null;
		thing_traits = thing?.traits ?? [];
		hierarchy_traits = $w_hierarchy.traits ?? [];
		const thing_trait = thing_traits[0];
		const foundIndex = hierarchy_traits.findIndex(t => t.ownerID == thing.id);
		s_traits.total = hierarchy_traits.length;
		s_traits.index = foundIndex;
		index = foundIndex;
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
	
	function handle_click_forColumn(s_mouse: S_Mouse, column: number): boolean {
		if (s_mouse.isDown) {
			if (column == 0) {
				s_traits.grab_previous();
			} else {
				s_traits.grab_next();
			}
			const h = $w_hierarchy;
			hierarchy_traits[s_traits.index]?.owner?.ancestry?.grabOnly();
			console.log('grabbed', s_traits.index, h.grabs_latest_ancestry?.title);
			h.grabs_latest_assureIsVisible();
			w_hierarchy.set(h);
		}
		return false;
	}

</script>

<div class='hierarchy_traits'
	style='
		top:{top}px;
		position:absolute;
		font-size:{k.font_size.smaller}px;'>
	<Segmented
		height={20}
		selected={[0]}
		name='hierarchy_traits'
		origin={new Point(3, 3)}
		font_size={k.font_size.smaller}
		titles={['all', 'csv', 'hyperlink']}
		selection_closure={selection_closure}/>
	<Buttons_Row
		margin=0
		width=130
		show_box={false}
		has_title={false}
		button_height={18}
		horizontal_gap={2}
		name='hierarchy_traits'
		origin={new Point(90, 4)}
		closure={handle_buttonRequest}
		row_titles={['previous', 'next']}
		font_sizes={[k.font_size.smallest, k.font_size.smaller]}/>
	<div style='
		top:26px;
		position:absolute;
		text-align:center;
		width:{k.width_details}px;
		font-size:{k.font_size.smaller}px;'>
		trait {s_traits.index + 1} of {s_traits.total}
	</div>
	{#key thing_traits}
		{#if !!thing_traits && thing_traits.length > 0}
			{#each thing_traits as trait}
				{#if trait.text.length > 0}
					<Text_Editor
						top={47}
						left={10}
						label={trait.t_trait}
						color={colors.default}
						original_text={trait.text}
						width={text_box_size.width}
						height={text_box_size.height}
						onLabelClick={() => handle_label_click(trait)}
						label_underline={trait.t_trait == 'hyperlink'}
						label_color={trait.t_trait == 'hyperlink' ? 'blue' : 'gray'}
						handle_textChange={(label, text) => handle_textChange(label, text, trait)}/>
				{/if}
			{/each}
		{/if}
	{/key}
</div>
