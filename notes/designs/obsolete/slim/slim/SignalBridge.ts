import { signals } from '../../signals/Signals';
import { T_Signal } from '../../common/Enumerations';
import type { StateMachine } from './StateMachine';

export class SignalBridge {
    constructor(private stateMachine: StateMachine<string>) {
        this.setupSignalHandlers();
    }

    private setupSignalHandlers() {
        signals.signal_emitter.connect((t_signal: T_Signal, priority: number) => {
            switch(t_signal) {
                case T_Signal.reposition:
                    if (priority === 1) {
                        this.stateMachine.transition('layoutComputing');
                    }
                    break;
                case T_Signal.rebuild:
                    if (priority === 1) {
                        this.stateMachine.transition('componentsComputing');
                    }
                    break;
            }
        });
    }

    async emitLegacySignal(state: string) {
        switch(state) {
            case 'layoutComputing':
                signals.signal(T_Signal.reposition, null, null);
                break;
            case 'componentsComputing':
                signals.signal(T_Signal.rebuild, null, null);
                break;
        }
    }
}
