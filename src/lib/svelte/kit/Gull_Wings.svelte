<script lang="ts">
    import { k, Point, Angle, T_Layer, Direction, svgPaths } from '../../ts/common/Global_Imports';
    export let radius = k.radius.gull_wings.ultra_thin;
    export let direction = Direction.down;
    export let zindex = T_Layer.lines;
    export let center = Point.zero;
    export let color = 'black';
    export let thickness = 1;
    const diameter = radius * 2;
    let gullWingsPath = svgPaths.gull_wings(Point.zero, radius, direction);

</script>

<svg
    style='
        z-index: {zindex};
        position: absolute;
        pointer-events: none;
        top: {center.y - radius}px;
        left: {center.x - radius}px;'
    class='gull-wings'
    width={diameter}
    height={diameter}
    viewBox={`${-radius} ${-radius} ${diameter} ${diameter}`}> 
    <path 
        fill={color}
        stroke={color}
        d={gullWingsPath}
        stroke-width={thickness}/>
</svg>
