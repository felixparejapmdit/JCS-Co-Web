/**
 * Async jobs: work that takes longer than a request should wait for (loading the sample data into
 * MySQL takes ~20 s) starts in the background and answers at once with a job id. The caller then
 * asks for the job until it is done: GET /api/v1/jobs/{id}, or the internal operation jobs.get.
 *
 * The job runs in the server process that started it; its status lives in the store (store.ts), so
 * with Redis any instance can report it. Status is kept for one hour.
 */
import { randomBytes } from 'node:crypto';
import { DbError } from '../db';
import { store } from './store';

const TTL = 3600;

export type JobStatus = 'running' | 'done' | 'failed';

export interface Job {
  id: string;
  kind: string;
  owner: string;
  status: JobStatus;
  /** What it is doing now, for the screen (e.g. "Loading chemag (1 of 1)"). */
  progress?: string;
  result?: unknown;
  error?: string;
  startedAt: string;
  finishedAt?: string;
}

async function save(job: Job) {
  await store().set(`job:${job.id}`, JSON.stringify(job), TTL);
}

/** Starts work in the background and returns its job at once. */
export async function startJob(kind: string, owner: string, work: (progress: (text: string) => Promise<void>) => Promise<unknown>): Promise<Job> {
  const job: Job = { id: `job_${randomBytes(12).toString('base64url')}`, kind, owner, status: 'running', startedAt: new Date().toISOString() };
  await save(job);
  const progress = async (text: string) => {
    job.progress = text;
    await save(job);
  };
  void (async () => {
    try {
      job.result = await work(progress);
      job.status = 'done';
    } catch (err) {
      job.status = 'failed';
      job.error = err instanceof DbError ? err.message : 'The job stopped with an error. See the server log for details.';
      if (!(err instanceof DbError)) console.error(`[cloud-aos] job ${job.id} (${kind}) failed`, err);
    }
    job.progress = undefined;
    job.finishedAt = new Date().toISOString();
    await save(job);
  })();
  return job;
}

/** A job, for its owner only (anyone else gets "not found"). */
export async function getJob(id: string, owner: string): Promise<Job> {
  const text = /^job_[A-Za-z0-9_-]{8,40}$/.test(id) ? await store().get(`job:${id}`) : null;
  const job = text ? (JSON.parse(text) as Job) : null;
  if (!job || job.owner !== owner) throw new DbError('That job does not exist or has expired.', 404);
  return job;
}

/** One job of a kind at a time per owner: the running one, if any. */
export async function runningJob(kind: string, owner: string): Promise<Job | null> {
  const id = await store().get(`job-running:${kind}:${owner}`);
  if (!id) return null;
  try {
    const job = await getJob(id, owner);
    return job.status === 'running' ? job : null;
  } catch {
    return null;
  }
}

export async function markRunning(kind: string, owner: string, id: string) {
  await store().set(`job-running:${kind}:${owner}`, id, TTL);
}
