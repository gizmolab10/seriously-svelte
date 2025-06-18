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

{#key `${$w_thing_traits.map(t => t.t_trait).join(', ')} ${$w_show_traits_ofType.join(', ')}`}
	<div class='hierarchy_traits'
		style='
			width: 100%;
			padding: 4px;
			display: flex;
			position: relative;
			padding-bottom: 12px;
			scrollbar-width: none;          /* Firefox */
			flex-direction: column;
			-ms-overflow-style: none;
			font-size:{k.font_size.smaller}px;'>
		{#if !$w_thing_traits || $w_thing_traits.length == 0}
			<p class='no-traits' style='
                margin: 0;
                width: 100%;
                height: 48px;
                display: flex;
                text-align: center;
                align-items: center;
                justify-content: center;'>
                no traits
            </p>
		{:else}
			<div style='left: 6px; top: 4px; position: relative;'>
				show these trait types:
				<Segmented
					name='trait-types'
					allow_multiple={true}
					titles={['text', 'link']}
					height={k.height.controls}
					font_size={k.font_size.smaller}
					selected={$w_show_traits_ofType}
					origin={new Point(k.width_details - 64, -15)}
					handle_selection={handleClick_onTraitTypes}/>
				{#each $w_thing_traits as trait}
					<Text_Editor
						top={8}
						height={78}
						label={trait.t_trait}
						color={colors.default}
						original_text={trait.text}
						width={k.width_details - 25}
						label_underline={trait.t_trait == 'link'}
						label_color={trait.t_trait == 'link' ? 'blue' : 'black'}
						handle_textChange={async (label, text) => await h.trait_setText_forTrait(text, trait)}
						handleClick_onLabel={trait.t_trait == 'link' ? (event) => window.open(trait.text, '_blank') : null}/>
				{/each}
			</div>
		{/if}
	</div>
{/key}
