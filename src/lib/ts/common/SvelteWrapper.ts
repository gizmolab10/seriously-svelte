import { e, Ancestry, SvelteComponent, Create_Mouse_State, SvelteComponentType } from './GlobalImports';
import Identifiable from '../data/Identifiable';

// Ancestry sometimes needs to access and or alter an associated svelte component

export default class SvelteWrapper extends Identifiable {
    component: SvelteComponent;
    type: SvelteComponentType;
    ancestry: Ancestry;

    constructor(component: SvelteComponent, ancestry: Ancestry, type: SvelteComponentType) {
		super();
        this.type = type;
        this.ancestry = ancestry;
        this.component = component;
    	ancestry?.wrapper_add(this);
        e.subscribeTo_mouseData(this);
    }

    handle_closure(closure: Create_Mouse_State): boolean {
        const component = this.component;
        if (component && typeof component.handle_mouseData === 'function') {
            const mouseData = closure(null, this.component);
            this.component.handle_mouseData(mouseData);
            console.log(`BANG! ${mouseData.isUp}`);
        }
        return true;
    }

}
