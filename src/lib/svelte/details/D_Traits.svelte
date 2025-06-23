<script lang='ts'>
	import { w_thing_traits, w_ancestries_grabbed, w_count_resize_hideables } from '../../ts/common/Stores';
	import { T_Trait, T_Details, T_Element, T_Request, T_Direction } from '../../ts/common/Global_Imports';
	import { h, k, ux, colors, Size, S_Mouse } from '../../ts/common/Global_Imports';
	import Identifiable from '../../ts/runtime/Identifiable';
	import { s_details } from '../../ts/state/S_Details';
	import Text_Editor from '../kit/Text_Editor.svelte';
    const s_hideable = s_details.s_hideables_byType[T_Details.traits];
	const es_button = ux.s_element_for(new Identifiable('trait'), T_Element.button, 'trait');
	let text_box_size = new Size(k.width_details - 34, 68);
	let prior_trigger = k.empty;
	let reattachments = 0;

	s_details.update();
	es_button.set_forHovering(colors.default, 'pointer');

	$: {
		const trigger = `${$w_thing_traits.map(t => t.text).join(', ')} ${$w_ancestries_grabbed.map(a => a.id).join(', ')}`;
		if (trigger !== prior_trigger) {
			prior_trigger = trigger;
			reattachments++;
			setTimeout(() => {
				$w_count_resize_hideables++;
			}, 1);
		}
	}

	function handleClick_onNextPrevious(t_request: T_Request, s_mouse: S_Mouse, column: number): any {
		switch (t_request) {
			case T_Request.is_visible:    return true;
			case T_Request.name:		  return T_Direction[column];
			case T_Request.handle_click:  if (s_mouse.isDown) { s_details.selectNext_traitThing(column == 1); }
		}
		return false;
	}

</script>

{#key reattachments}
	<div class='traits'
		style='
			width: 100%;
			padding: 2px;
			display: flex;
			position: relative;
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
			<div style='left: 6px; top: 0px; position: relative;'>
				{#each $w_thing_traits as trait}
					<Text_Editor
						top={8}
						height={78}
						label={trait.t_trait}
						color={colors.default}
						original_text={trait.text}
						width={k.width_details - 20}
						label_underline={trait.t_trait == 'link'}
						label_color={trait.t_trait == 'link' ? 'blue' : 'black'}
						handle_textChange={async (label, text) => await h.trait_setText_forTrait(text, trait)}
						handleClick_onLabel={trait.t_trait == 'link' ? (event) => window.open(trait.text, '_blank') : null}/>
				{/each}
			</div>
		{/if}
	</div>
{/key}
