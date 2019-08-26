import * as simulation from './simulation';
import * as game from './game';
import { cachedInstance } from './utils';

const enum JobType {
    SimulateMovements,
    CreateGame
}

const start = (job: JobType): Promise<any> => new Promise((resolve) => {
    const worker = new Worker(document.querySelector('script').src);
    worker.addEventListener('message', msg => resolve(msg.data));
    worker.postMessage({ job });
});

export const getSimulatedMovements = cachedInstance(() => start(JobType.SimulateMovements));
export const createGame = () => start(JobType.CreateGame);

export const work = () => {
    const handlers = new Map();
    handlers.set(JobType.SimulateMovements, () => simulation.simulateMovements());
    handlers.set(JobType.CreateGame, () => game.create());

    self.addEventListener('message', message => {
        self.postMessage(handlers.get(message.data.job)(), []);
        self.close();
    });
};
