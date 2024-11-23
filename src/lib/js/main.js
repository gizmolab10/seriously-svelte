import SeriouslyApp from '../svelte/main/SeriouslyApp.svelte';
import '../../styles/app.css';

const seriouslyApp = new SeriouslyApp({
	target: document.body,
})

export { SeriouslyApp }; // Explicitly export the SeriouslyApp component
export default seriouslyApp;
