import * as simulation from './simulation';
import * as game from './game';
import { cachedInstance } from './utils';
import * as map from './map';

const enum JobType {
    SimulateMovements,
    CreateLevel
}

interface JobInterface {
    resolve: (a: any) => void
}

let worker: Worker = null;
let pendingJobs: Map<number, JobInterface> = null;
let nextJobId = 1;

const handleMessage = msg => {
    const job = pendingJobs.get(msg.data.jobId);
    job.resolve(msg.data.response);
};

export const initialize = () => {
    worker = new Worker(document.querySelector('script').src);
    pendingJobs = new Map();
    worker.addEventListener('message', handleMessage);
};

const start = (job: JobType): Promise<any> => {
    if (worker) {
        return new Promise((resolve) => {

            const jobId = nextJobId++;
            pendingJobs.set(jobId, { resolve });
            worker.postMessage({ jobId, job });
        });
    }

    return handleJob({ job });
};

export const getSimulatedMovements = () => start(JobType.SimulateMovements);
export const createLevel = () => start(JobType.CreateLevel);

const handleJob = (() => {
    const handlers = new Map();
    handlers.set(JobType.SimulateMovements, cachedInstance(() => simulation.simulateMovements()));
    handlers.set(JobType.CreateLevel, async () => {
        console.log(new Date(), 'before map create');
        const levelMap = map.create(map.randomTiles());
        console.log(new Date(), 'before find biggest');
        const region = await simulation.findBiggestRegion(levelMap);
        return { map: levelMap, region };
    });

    return ({ job }) => handlers.get(job)();
})();

export const work = () => {
    self.addEventListener('message', async (message) => {
        const jobId = message.data.jobId;
        const response = await handleJob(message.data);
        self.postMessage({ jobId, response }, []);
    });
};
