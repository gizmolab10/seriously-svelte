<!-- @migration-task Error while migrating Svelte code: `$s_hierarchygrabs` is an illegal variable name. To reference a global variable called `$s_hierarchygrabs`, use `globalThis.$s_hierarchygrabs`
https://svelte.dev/e/global_reference_invalid -->
<!-- @migration-task Error while migrating Svelte code: `$s_hierarchygrabs` is an illegal variable name. To reference a global variable called `$s_hierarchygrabs`, use `globalThis.$s_hierarchygrabs`
https://svelte.dev/e/global_reference_invalid -->
<script lang='ts'>
	import { k, ux, Point, debug, Direction, dbDispatch } from '../../ts/common/Global_Imports';
	import Triangle_Button from '../mouse/Triangle_Button.svelte';
	export let center = Point.zero;
    export let name = k.empty;
    export let ancestry;
	const element_state = ux.element_state_forName(name);		// survives onDestroy, created by widget
	let size = k.dot_size;

	element_state.set_forHovering(ancestry.thing.color, 'pointer');

	function hover_closure(isHovering) {
		return [debug.lines ? 'transparent' : element_state.stroke, k.empty];
	}

	function handle_mouse_state(mouse_state: Mouse_State): boolean {
		if (mouse_state.isHover) {
			element_state.isOut = mouse_state.isOut;
		} else {
			if ($s_hierarchygrabs.latestAncestryGrabbed(true)?.isFocus) {
				$s_hierarchyancestry_rebuild_persistentMoveRight(ancestry, false, false);
			} else {
				ancestry.grabOnly();
			}
		}
	}

</script>

<Triangle_Button
	handle_mouse_state={handle_mouse_state}
	strokeColor={element_state.stroke}
	hover_closure={hover_closure}
	name={ancestry.thing.title}
	angle={Direction.right}
	center={center}
    size={size}
/>
