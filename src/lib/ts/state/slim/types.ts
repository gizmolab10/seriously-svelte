export interface SlimState {
    hover: {
        current: string | null;
        config: Map<string, any>;
    };
    components: {
        active: Map<string, any>;
        state: any;
    };
}
