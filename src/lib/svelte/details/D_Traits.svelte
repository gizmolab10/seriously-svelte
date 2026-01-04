<script lang='ts'>
	import { h, k, x, Size, colors, details, elements, databases, show } from '../../ts/common/Global_Imports';
	import { T_Detail, T_Hit_Target, T_Control } from '../../ts/common/Global_Imports';
	import { T_Database } from '../../ts/database/DB_Common';
	import DB_Filesystem from '../../ts/database/DB_Filesystem';
	import Identifiable from '../../ts/runtime/Identifiable';
	import Text_Editor from '../text/Text_Editor.svelte';
	const { w_item: w_trait } = x.si_thing_traits;
	const s_button = elements.s_element_for(new Identifiable('trait'), T_Hit_Target.trait, 'trait');
	let text_box_size = new Size(k.width.details - 34, 68);
	s_button.set_forHovering(colors.default, 'pointer');
	x.update_grabs_forSearch();

	const { w_t_database } = databases;
	const { w_id_popupView, w_preview_content, w_preview_type, w_preview_filename } = show;
	$: isFilesystemDB = $w_t_database === T_Database.filesystem;

	async function handleLinkClick(event: MouseEvent) {
		if (!$w_trait) return;
		
		if (isFilesystemDB && h.db instanceof DB_Filesystem) {
			const thing = $w_trait.owner;
			if (thing) {
				const entry = h.db.getFileEntry(thing.id);
				if (entry && !entry.isDirectory) {
					const ext = entry.name.split('.').pop()?.toLowerCase() || '';
					const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
					const textExts = ['txt', 'md', 'json', 'js', 'ts', 'svelte', 'html', 'css', 'csv'];
					
					if (imageExts.includes(ext)) {
						$w_preview_content = await h.db.readFileAsDataURL(thing.id);
						$w_preview_type = 'image';
					} else if (textExts.includes(ext)) {
						$w_preview_content = await h.db.readFileAsText(thing.id);
						$w_preview_type = 'text';
					} else {
						$w_preview_content = `Cannot preview .${ext} files. Use download button.`;
						$w_preview_type = 'unsupported';
					}
					$w_preview_filename = entry.name;
					$w_id_popupView = T_Control.preview;
				}
			}
		} else {
			window.open($w_trait.text, '_blank');
		}
	}
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
			color={colors.default}
			label={$w_trait.t_trait}
			width={k.width.details - 20}
			original_text={$w_trait.text}
			label_underline={$w_trait.t_trait == 'link'}
			label_color={$w_trait.t_trait == 'link' ? 'blue' : 'black'}
			handle_textChange={async (label, text) => await h.trait_setText_forTrait(text, $w_trait)}
			handleClick_onLabel={$w_trait.t_trait == 'link' ? handleLinkClick : null}/>
	</div>
{/if}
