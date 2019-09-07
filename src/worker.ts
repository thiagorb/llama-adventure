import * as simulation from './simulation';
import * as level from './level';
import { cachedInstance } from './utils';

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

export const startSimulatedMovements = () => start(JobType.SimulateMovements);
export const createLevel = (): Promise<level.Level> => start(JobType.CreateLevel);

const handleJob = (() => {
    const handlers = new Map();
    handlers.set(JobType.SimulateMovements, () => {
        simulation.getSimulatedMovements();
    });
    handlers.set(JobType.CreateLevel, level.create);

    return ({ job }) => handlers.get(job)();
})();

export const work = () => {
    self.addEventListener('message', async (message) => {
        const jobId = message.data.jobId;
        const response = await handleJob(message.data);
        // @ts-ignore
        self.postMessage({ jobId, response }, []);
    });
};
