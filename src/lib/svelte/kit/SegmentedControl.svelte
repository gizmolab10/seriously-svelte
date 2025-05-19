<script lang="ts">
    import { SegmentedControl } from '@skeletonlabs/skeleton';
    
    // Props
    export let options: string[] = ['Option 1', 'Option 2', 'Option 3'];
    export let selected: string = options[0];
    export let onSelect: (value: string) => void = () => {};
    
    // Handle selection change
    function handleChange(event: CustomEvent) {
        selected = event.detail;
        onSelect(selected);
    }
</script>

<SegmentedControl
    options={options}
    selected={selected}
    on:change={handleChange}
    variant="filled"
    class="w-full"
/> 