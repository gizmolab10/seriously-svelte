<script lang='ts'>
	import { w_hierarchy, w_show_traits_ofType, w_thing_traits } from '../../ts/common/Stores';
	import { S_Mouse, T_Trait, T_Element, T_Request } from '../../ts/common/Global_Imports';
	import { k, ux, colors, Size, Point } from '../../ts/common/Global_Imports';
	import Identifiable from '../../ts/runtime/Identifiable';
    import Next_Previous from '../kit/Next_Previous.svelte';
	import { s_details } from '../../ts/state/S_Details';
	import Text_Editor from '../kit/Text_Editor.svelte';
	import Segmented from '../mouse/Segmented.svelte';
	export let top = 0;
	const es_button = ux.s_element_for(new Identifiable('trait'), T_Element.button, 'trait');
	let text_box_size = new Size(k.width_details - 34, 68);

	s_details.update_traits();
	es_button.set_forHovering(colors.default, 'pointer');
	
	function handleClick_onTraitTypes(types: Array<T_Trait>) {
		$w_show_traits_ofType = types;
		s_details.update_traits();
	}

	function handleClick_onNextPrevious(t_request: T_Request, s_mouse: S_Mouse, column: number): any {
		const ids = ['previous', 'next'];
		switch (t_request) {
			case T_Request.is_visible:   return true;
			case T_Request.name:		   return ids[column];
			case T_Request.handle_click: if (s_mouse.isDown) { s_details.select_nextTrait(column == 1); }
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
		name='trait-types'
		allow_multiple={true}
		origin={new Point(10, 3)}
		titles={['text', 'link']}
		font_size={k.font_size.smaller}
		selected={$w_show_traits_ofType}
		selection_closure={handleClick_onTraitTypes}/>
	<Next_Previous
		width={144}
		name='traits'
		origin={new Point(110, 4)}
		closure={handleClick_onNextPrevious}/>
	{#key $w_thing_traits}
		{#if !!$w_thing_traits && $w_thing_traits.length > 0}
			{#each $w_thing_traits as trait}
				<Text_Editor
					top={30}
					left={10}
					label={trait.t_trait}
					color={colors.default}
					original_text={trait.text}
					width={text_box_size.width}
					height={text_box_size.height}
					label_underline={trait.t_trait == 'link'}
					onLabelClick={() => window.open(trait.text, '_blank')}
					label_color={trait.t_trait == 'link' ? 'blue' : 'gray'}
					handle_textChange={async (label, text) => await $w_hierarchy.trait_setText_forTrait(text, trait)}/>
			{/each}
		{/if}
	{/key}
</div>
