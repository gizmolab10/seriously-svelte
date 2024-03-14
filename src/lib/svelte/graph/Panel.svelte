<script>
	import { g, k, u, get, Path, Rect, Size, Point, Thing, launch, TypeDB, ZIndex, signals, onMount } from '../../ts/common/GlobalImports';
	import { IDButton, Hierarchy, IDPersistant, dbDispatch, debugReact, persistLocal } from '../../ts/common/GlobalImports';
	import { s_build, s_isBusy, s_path_here, s_db_type, s_graphRect } from '../../ts/common/State';
	import { s_show_details, s_id_popupView, s_things_arrived } from '../../ts/common/State';
	import CircularButton from '../kit/CircularButton.svelte';
	import TitleEditor from '../widget/TitleEditor.svelte';
	import BuildNotes from './BuildNotes.svelte';
	import Controls from './Controls.svelte';
	import Help from '../help/Help.svelte';
	import Details from './Details.svelte';
	import Crumbs from './Crumbs.svelte';
	import Graph from './Graph.svelte';
	const bottomOfTitle = k.height_banner + k.height_titleAtTop;
	let toggle = false;

	$: { updateHerePath($s_path_here); }
	window.addEventListener('resize', (event) => { g.graphRect_update(); });
	const rebuild_signalHandler = signals.handle_rebuildWidgets(() => { updateHerePath($s_path_here); });

	onMount(() => {
		(async () => {
			await launch.setup();
			updateHerePath($s_path_here);
		})()
	});

	function updateHerePath(newHerePath) {
		if (newHerePath && !newHerePath.matchesPath(g.herePath)) {
			g.herePath = newHerePath;
		}
		g.graphRect_update();
		toggle = !toggle;	// remount graph component
	}

</script>

<style>
	p {
		text-align: center;
		font-size: 3em;
		width: 100%;
	}
	.crumbs {
		position: fixed;
		top: 41px;
	}
	.build {
		border-radius: 1em;
		position: absolute;
		border: 1px solid;
		cursor: pointer;
		left: 35px;
		top: -2px;
	}
	.top-title {
		text-align: center;
		position: fixed;
		font-size: 2em;
		right: 0px;
		top: 40px;
	}
	.horizontal-line {
		background-color: lightgray;
		position: fixed;
		height: 1px;
		width: 110%;
	}
	.vertical-line {
		background-color: lightgray;
		position: absolute;
		width: 1px;
	}
</style>

{#if $s_isBusy}
	<p>Welcome to Seriously</p>
	{#if $s_db_type != TypeDB.local}
		<p>(loading your {$s_db_type} data{$s_db_type == TypeDB.firebase ? ', from ' + dbDispatch.db.baseID : ''})</p>
	{/if}
{:else if !$s_things_arrived}
	<p>Nothing is available.</p>
{:else}
	<Controls/>
	{#if $s_id_popupView == null}
		{#if $s_show_details}
			<Details/>
			<div class='vertical-line' style='
				left: {k.width_details}px;
				z-index: {ZIndex.frontmost};
				top: {$s_graphRect.origin.y}px;
				height: {$s_graphRect.size.height}px;'>
			</div>
		{/if}
		<div class='horizontal-line' style='
			left: 0px;
			z-index: {ZIndex.frontmost};
			top: {k.height_banner - 2}px;'>
		</div>
		<div class='crumbs' style='z-index: {ZIndex.frontmost};'>
			<Crumbs/>
			<div class='horizontal-line'
				style='
					top: 68px;
					left: 0px;
					z-index: {ZIndex.frontmost};'>
			</div>
		</div>
		{#if g.titleIsAtTop}
			<div class='top-title'
				style='
					top: 70px;
					z-index: {ZIndex.frontmost};
					color: {$s_path_here.thing?.color};
					left: 0px;'>
				{$s_path_here.title}
			</div>
			<div class='horizontal-line'
				style='
					z-index: {ZIndex.frontmost};
					top: {bottomOfTitle + 28}px;
					left: 0px;'>
			</div>
		{/if}
	{/if}
	<div class='right-side' style='
		left: {$s_show_details ? k.width_details : 0}px;
		z-index: {ZIndex.panel};
		position: fixed;
		height: 100%;'>
		{#if $s_id_popupView == IDButton.help}
			<Help/>
		{:else if $s_id_popupView == IDButton.builds}
			<BuildNotes/>
		{:else if $s_id_popupView == null}
			{#key toggle}
				<Graph/>
			{/key}
		{/if}
	</div>
{/if}
