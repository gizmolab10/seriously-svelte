export type StateType = 'idle' | 'layoutComputing' | 'componentsComputing' | 'done';

export interface HoverConfig {
    color?: string;
    cursor?: string;
    invert?: boolean;
    ignore?: boolean;
    custom?: (event: MouseEvent) => void;
}

export interface ComponentState {
    id: string;
    isMounted: boolean;
    element: HTMLElement | null;
    customConfig?: Record<string, any>;
}
