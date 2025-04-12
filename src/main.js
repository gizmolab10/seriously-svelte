// @ts-ignore
import SeriouslyApp from './SeriouslyApp.svelte';
import { mount } from "svelte";
import './styles/app.css';

const app = mount(SeriouslyApp, { target: document.body });

export default app;
