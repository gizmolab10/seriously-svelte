<script lang='ts'>
	import { k, u, Point, ZIndex, dbDispatch, Hierarchy, IDPersistent, persistLocal } from '../../ts/common/Global_Imports';
	import { s_db_type, s_db_loadTime } from '../../ts/state/Reactive_State';
	import Radio_Buttons from '../buttons/Radio_Buttons.svelte';
	import Segmented from '../mouse/Segmented.svelte';
	import { DBType } from '../../ts/db/DBInterface';

	function selection_closure(titles: Array<string>) {
		const type = titles[0] as DBType;	// only ever contains one title
		dbDispatch.db_change_toType(type);
	}

</script>

{#key $s_db_type}
	<div class='storage-information'
		style='
			height:40px;
			padding:5px;'>
		<Segmented
			name='db'
			font_size='0.8em'
			selected={[$s_db_type]}
			height={k.row_height - 4}
			origin={new Point(35, 8)}
			selection_closure={selection_closure}
			titles={[DBType.local, DBType.firebase, DBType.airtable]}/>
		{#if $s_db_loadTime && $s_db_loadTime > 0}
			<div style='
				left:60px;
				top:25.5px;
				color:#333;
				font-size:0.8em;
				position:absolute;
				justify-content:center;'>
				fetch took {$s_db_loadTime} s
			</div>
		{/if}
	</div>
{/key}
