<script lang='ts'>
	import { T_Trait, T_Details, T_Element, T_Request, T_Direction } from '../../ts/common/Global_Imports';
	import { h, k, ux, colors, Size, S_Mouse } from '../../ts/common/Global_Imports';
	import { w_thing_traits, w_ancestries_grabbed } from '../../ts/managers/Stores';
	import Identifiable from '../../ts/runtime/Identifiable';
	import Text_Editor from '../text/Text_Editor.svelte';
	import { s_details } from '../../ts/state/S_Details';
    const s_banner_hideable = s_details.s_banner_hideables_byType[T_Details.traits];
	const s_button = ux.s_element_for(new Identifiable('trait'), T_Element.button, 'trait');
	let text_box_size = new Size(k.width.details - 34, 68);
	s_details.update();
	s_button.set_forHovering(colors.default, 'pointer');

</script>

{#if !$w_thing_traits || $w_thing_traits.length == 0}
		<div class='traits'
			style='
				width: 100%;
				display: flex;
				position: relative;
				text-align: center;
				align-items: center;
				flex-direction: column;
				justify-content: center;
				-ms-overflow-style: none;
				height:{k.height.empty}px;
				font-size:{k.font_size.details}px;'>
				no traits
			</div>
	{:else}
		<div style='padding: 6px'>
			{#each $w_thing_traits as trait}
				<Text_Editor
					top={5}
					height={78}
					label={trait.t_trait}
					color={colors.default}
					original_text={trait.text}
					width={k.width.details - 20}
					label_underline={trait.t_trait == 'link'}
					label_color={trait.t_trait == 'link' ? 'blue' : 'black'}
					handle_textChange={async (label, text) => await h.trait_setText_forTrait(text, trait)}
					handleClick_onLabel={trait.t_trait == 'link' ? (event) => window.open(trait.text, '_blank') : null}/>
			{/each}
		</div>
	{/if}
