<script>
	import { k } from '../../ts/common/GlobalImports';
	import Button from '../mouse buttons/Button.svelte';
	export let help_click_closure = () => {};
	export let hover_closure = (flag) => {};
	export let name = k.empty;

	function closure(mouseData) {

	}

</script>

<Button name={name}/>
