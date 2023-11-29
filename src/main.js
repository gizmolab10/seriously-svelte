import SeriouslyApp from "./SeriouslyApp.svelte";
import './styles/app.css';

const app = new SeriouslyApp({
	target: document.getElementById('app')
})

export default SeriouslyApp;
