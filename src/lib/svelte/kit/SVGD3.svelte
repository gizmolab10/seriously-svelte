<script>
    import { Rect, Size, Point, onMount } from '../../ts/common/GlobalImports';
    import * as d3 from 'd3';

    export let path = 'M10 10 L 90 90';
    export let center = new Point();
    export let size = new Size();
    export let stroke = 'black';
    export let fill = 'white';
    export let zIndex = 0;

    let svg;

    onMount(() => {
        const selected = d3.select(svg);
        const item = selected.append('path')
                        .attr('d', path)
                        .attr('fill', fill)
                        .attr('stroke', stroke);
        const pathCenter = Rect.createFromDOMRect(item.node().getBBox()).center;
        const deltaX = center.x - (pathCenter.x);
        const deltaY = center.y - (pathCenter.y);
        item.attr('transform', `translate(${deltaX}, ${deltaY})`);
    });
</script>

<svg bind:this={svg}
    width={size.width}
    height={size.height}
    style='z-index: {zIndex};
		position: absolute;'>
</svg>
