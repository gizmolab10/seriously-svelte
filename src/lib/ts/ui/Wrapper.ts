import Identifiable from "../common/Identifiable";
import { Thing, Relationship } from "../common/GlobalImports";

export interface ThingWrapper {
    relationship: Relationship;
    thing: Thing;
}

export default class Wrapper extends Identifiable {
    private component: any;

    constructor(component: any) {
		super(null);
        this.component = component;
    }
}
