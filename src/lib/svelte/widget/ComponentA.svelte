<script lang="ts">
    import ComponentB from './ComponentB.svelte';

    let value = 0;
    $: derivedValue = {
        value,
        isEven: value % 2 === 0
    };

    function increment() {
        value += 1;
    }
</script>

<div class="component-a">
    <button on:click={increment}>Increment Value</button>
    <ComponentB {derivedValue} />
</div>

<style>
    .component-a {
        padding: 1rem;
        border: 1px solid #ccc;
        margin: 1rem;
    }
</style> 