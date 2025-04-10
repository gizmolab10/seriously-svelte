<script lang='ts'>
    import { run } from 'svelte/legacy';

    import { Rect } from '../ts/common/Global_Imports'
    interface Props {
        line_thickness?: number;
        rect?: any;
        cross?: boolean;
        name?: string;
        zindex?: number;
        color: any;
    }

    let {
        line_thickness = 1,
        rect = Rect.zero,
        cross = false,
        name = 'box',
        zindex = 0,
        color
    }: Props = $props();
    let box_size = $state(rect.size);
    let cross_size = $state(box_size.multipliedBy(3));
    let cross_rect = $state(Rect.createCenterRect(rect.center, cross_size));

    run(() => {
        box_size = rect.size;
        cross_size = box_size.multipliedBy(3);
        cross_rect = Rect.createCenterRect(rect.center, cross_size);
    });

</script>

<div
    class='box'
    id={name}
    style='
        z-index:{zindex};
        position:absolute;
        top:{rect.origin.y}px;
        left:{rect.origin.x}px;
        width:{box_size.width}px;
        height:{box_size.height}px;
        border:{line_thickness}px solid {color};
'>
</div>
{#if cross}
    <div
        style='
            z-index:{zindex};
            position:absolute;
            width:{cross_size.width}px;
            top:{cross_rect.center.y}px;
            left:{cross_rect.origin.x}px;
            height:{line_thickness / 10}px;
    '>
    </div>
{/if}
<div
    style='
    z-index:{zindex};
    position:absolute;
    top:{cross_rect.origin.y}px;
    left:{cross_rect.center.x}px;
    height:{cross_size.height}px;
    width:{line_thickness / 10}px;
    '>
</div>
    