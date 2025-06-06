<script lang='ts'>
	import { w_show_traits_ofType, w_thing_traits } from '../../ts/common/Stores';
	import { S_Mouse, T_Trait, T_Element, T_Request, T_Direction } from '../../ts/common/Global_Imports';
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
		switch (t_request) {
			case T_Request.is_visible:    return true;
			case T_Request.name:		  return T_Direction[column];
			case T_Request.handle_click:  if (s_mouse.isDown) { s_details.select_nextTrait(column == 1); }
		}
		return false;
	}

</script>

<div class='hierarchy_traits'
	style='
		top:3px;
		left:10px;
		width: 100%;
		display:flex;
		position:absolute;
		scrollbar-width: none;          /* Firefox */
		flex-direction:column;
		-ms-overflow-style: none;
		font-size:{k.font_size.smaller}px;'>
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
			show these trait types:
			<Segmented
				name='trait-types'
				allow_multiple={true}
				titles={['text', 'link']}
				height={k.height.controls}
				font_size={k.font_size.smaller}
				selected={$w_show_traits_ofType}
				origin={new Point(k.width_details - 64, 0)}
				handle_selection={handleClick_onTraitTypes}/>
			{#each $w_thing_traits as trait}
				<Text_Editor
					top={26}
					height={78}
					label={trait.t_trait}
					color={colors.default}
					original_text={trait.text}
					width={k.width_details - 40}
					label_underline={trait.t_trait == 'link'}
					onLabelClick={() => window.open(trait.text, '_blank')}
					label_color={trait.t_trait == 'link' ? 'blue' : 'gray'}
					handle_textChange={async (label, text) => await h.trait_setText_forTrait(text, trait)}/>
			{/each}
		{/if}
	{/key}
</div>
