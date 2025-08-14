<script lang='ts'>
    import { k, Point, colors, Direction } from '../../ts/common/Global_Imports';
	import { w_background_color, w_show_directionals_ofType } from '../../ts/managers/Stores';
    import Triangle_Button from './Triangle_Button.svelte';
    export let hit_closure;
    const buttonSize = 20;
    const origin = new Point(32, 37);
    const offsetY = buttonSize / 2 - 1;

	function hover_closure(isHovering) {
        return [isHovering ? colors.default : $w_background_color, k.empty];
    }

	function handle_s_mouse(s_mouse: S_Mouse): boolean {
        const target = s_mouse.element;
        if (!s_mouse.isHover && !!target && (s_mouse.isLong || s_mouse.isRepeat)) {
            const pointsUp = target.id == 'up';
            hit_closure(pointsUp, s_mouse.event?.metaKey);
        }
	}

</script>

<div class='directionals'>
    {#if $w_show_directionals_ofType[0]}
        <Triangle_Button
            handle_s_mouse={handle_s_mouse}
            center={origin.offsetByY(-offsetY)}
            hover_closure={hover_closure}
            strokeColor={colors.default}
            detect_autorepeat={true}
            angle={Direction.up}
            size={buttonSize}
            name='up'
        />
    {/if}
    {#if $w_show_directionals_ofType[1]}
        <Triangle_Button
            handle_s_mouse={handle_s_mouse}
            center={origin.offsetByY(offsetY)}
            hover_closure={hover_closure}
            strokeColor={colors.default}
            detect_longClick={true}
            detect_autorepeat={true}
            angle={Direction.down}
            size={buttonSize}
            name='down'
        />
    {/if}
</div>

<style>
    .directionals {
		top: 0px;
		left: 0px;
		position: absolute;     
    }
</style>
