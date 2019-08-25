import * as simulation from './simulation';
import { cachedInstance } from './utils';

const enum JobType {
    SimulateMovements,
}

export const getSimulatedMovements = cachedInstance((): Promise<any> => new Promise((resolve) => {
    const worker = new Worker(document.querySelector('script').src);
    worker.addEventListener('message', (msg) => {
        resolve(msg.data.movements);
    });
    worker.postMessage({ job: JobType.SimulateMovements });
}));

export const work = () => {
    self.addEventListener('message', message => {
        if (message.data.job === JobType.SimulateMovements) {
            self.postMessage(
                { movements: simulation.simulateMovements() },
                null,
                []
            );
            self.close();
        }
    });
};
