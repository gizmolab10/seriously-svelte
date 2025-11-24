<script lang='ts'>
	import { h, k, x, Size, colors, details, elements } from '../../ts/common/Global_Imports';
	import { T_Detail, T_Hoverable } from '../../ts/common/Global_Imports';
	import Identifiable from '../../ts/runtime/Identifiable';
	import Text_Editor from '../text/Text_Editor.svelte';
	const { w_item: w_trait } = x.si_thing_traits;
	const s_button = elements.s_element_for(new Identifiable('trait'), T_Hoverable.button, 'trait');
	let text_box_size = new Size(k.width.details - 34, 68);
	s_button.set_forHovering(colors.default, 'pointer');
	x.update_grabs_forSearch();

</script>

{#if !$w_trait}
	<div class='no-traits'
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
	<div class='trait-editor' style='padding: 6px'>
		<Text_Editor
			top={5}
			height={78}
			label={$w_trait.t_trait}
			color={colors.default}
			original_text={$w_trait.text}
			width={k.width.details - 20}
			label_underline={$w_trait.t_trait == 'link'}
			label_color={$w_trait.t_trait == 'link' ? 'blue' : 'black'}
			handle_textChange={async (label, text) => await h.trait_setText_forTrait(text, $w_trait)}
			handleClick_onLabel={$w_trait.t_trait == 'link' ? (event) => window.open($w_trait.text, '_blank') : null}/>
	</div>
{/if}
