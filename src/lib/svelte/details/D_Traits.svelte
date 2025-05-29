<script lang='ts'>
	import { w_show_traits_ofType, w_thing_traits } from '../../ts/common/Stores';
	import { S_Mouse, T_Trait, T_Element, T_Request } from '../../ts/common/Global_Imports';
	import { k, ux, colors, Size, Point } from '../../ts/common/Global_Imports';
	import Identifiable from '../../ts/runtime/Identifiable';
    import Next_Previous from '../kit/Next_Previous.svelte';
	import { s_details } from '../../ts/state/S_Details';
	import Text_Editor from '../kit/Text_Editor.svelte';
	import Segmented from '../mouse/Segmented.svelte';
	import Hideable from './Hideable.svelte';
	const es_button = ux.s_element_for(new Identifiable('trait'), T_Element.button, 'trait');
	let text_box_size = new Size(k.width_details - 34, 68);

	s_details.update();
	es_button.set_forHovering(colors.default, 'pointer');
	
	function handleClick_onTraitTypes(types: Array<T_Trait>) {
		$w_show_traits_ofType = types;
		s_details.update();
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
		top:2px;
		width: 100%;
		display:flex;
		position:absolute;
		scrollbar-width: none;          /* Firefox */
		flex-direction:column;
		-ms-overflow-style: none;'>
	{#key $w_thing_traits}
		{#if !$w_thing_traits || $w_thing_traits.length == 0}
			<div
				class='no-traits'
				style='
					display: flex;
					text-align: center;
					width: 100%;
					justify-content: center;'>
				no traits
			</div>
		{:else}
			<Segmented
				name='trait-types'
				allow_multiple={true}
				origin={new Point(6, 0)}
				titles={['text', 'link']}
				height={k.height.controls}
				font_size={k.font_size.smaller}
				selected={$w_show_traits_ofType}
				selection_closure={handleClick_onTraitTypes}/>
			<Next_Previous
				width={140}
				name='traits'
				origin={new Point(k.width_details - 141, 0)}
				closure={handleClick_onNextPrevious}/>
			{#each $w_thing_traits as trait}
				<Text_Editor
					top={24}
					left={10}
					height={78}
					label={trait.t_trait}
					color={colors.default}
					original_text={trait.text}
					width={k.width_details - 34}
					label_underline={trait.t_trait == 'link'}
					onLabelClick={() => window.open(trait.text, '_blank')}
					label_color={trait.t_trait == 'link' ? 'blue' : 'gray'}
					handle_textChange={async (label, text) => await h.trait_setText_forTrait(text, trait)}/>
			{/each}
		{/if}
	{/key}
</div>
