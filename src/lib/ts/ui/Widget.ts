import Identifiable from "../common/Identifiable";
import Relationship from "../data/Relationship";

export default class Widget extends Identifiable {
    private component: any;
    ancestralString: string;

    constructor(component: any, ancestralString: string) {
		super(null);
        this.component = component;
        this.ancestralString = ancestralString;
    }
}
