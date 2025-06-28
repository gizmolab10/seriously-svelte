<script lang='ts'>
    export let size = 48;
    export let speed = '1s';
    export let stroke = 'black';
    export let strokeWidth = 2;
</script>

<div style='position: relative; width: {size}px; height: {size}px; --spinner-speed: {speed};'>
    <svg width={size} height={size} viewBox='0 0 {size} {size}'>
        <circle
            cx={size/2}
            cy={size/2}
            stroke={stroke}
            fill='transparent'
            class='spinner-circle'
            stroke-dasharray='10 10'
            r={size/2 - strokeWidth}
            stroke-width={strokeWidth}/>
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