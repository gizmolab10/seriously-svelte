<script lang='ts'>
    export let angle = 0;
    export let speed = '1s';
    export let diameter = 48;
    export let strokeWidth = 2;
    export let stroke = 'black';
    export let number_of_dashes = 10;
    const dash_width = Math.PI * (diameter - strokeWidth) / number_of_dashes / 2;
</script>

<div style='
    position:relative;
    width:{diameter}px;
    height:{diameter}px;
    --spinner-speed:{speed};'>
    <svg width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`}>
        <circle
            cx={diameter/2}
            cy={diameter/2}
            stroke={stroke}
            fill='transparent'
            class='spinner-circle'
            stroke-width={strokeWidth}
            r={(diameter - strokeWidth) / 2}
            stroke-dasharray='{dash_width} {dash_width}'/>
    </svg>
</div>

<style>
    .spinner-circle {
        transform-origin: center;
        animation: spin var(--spinner-speed) linear infinite;
    }
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
</style> 