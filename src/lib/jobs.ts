// https://svelte.dev/tutorial/writable-stores
// https://svelte.dev/tutorial/auto-subscriptions
// https://svelte.dev/tutorial/derived-stores
// The way that this works is totally insane ATM, but it works!
// From https://svelte.dev/docs#run-time-svelte-store-get:
// > This works by creating a subscription, reading the value, then unsubscribing.
// > It's therefore not recommended in hot code paths.
// And I say to that: I don't care!
// I don't want to use Web Workers, but I'm starting to get the feeling I should
import { writable, derived, get } from "svelte/store"

export class Job {
	title: string
	job: AsyncIterable<string>
	id: string

	constructor(title: string, job: AsyncIterable<string>) {
		this.title = title
		this.job = job
		this.id = (Math.random() * 10e17).toString()
	}
}

let working = false 

export const jobs = writable<Job[]>([])
export const jobCount = derived(
	jobs,
	$jobs => $jobs.length
)
export const updates = writable<{
	id: string,
	update: string,
	timestamp: Date
}[]>([])
export function addJob(job: Job) {
	jobs.update(jobs => [...jobs, job])
}


jobCount.subscribe((newCount) => {
	if (!working) work(get(jobs))
})

async function work(currentJobs: Job[]) {
	working = true
	
	for (const job of currentJobs) {
		try {
			for await (const update of job.job) {
				const updateObject = {
					id: job.id,
					update,
					timestamp: new Date()
				}
				console.log(updateObject)
				updates.update(jobs => [updateObject, ...jobs])
			}
		} catch (e) {
			console.error(e)
			updates.update(jobs => [{
				id: job.id,
				update: `Error: ${e}`,
				timestamp: new Date()	
			}, ...jobs])
		} finally {
			jobs.update(jobs => jobs.filter(j => j !== job))
		}
	}

	if (get(jobCount) > 0) await work(get(jobs))

	working = false
}

// const sleep = (n: number) => new Promise(resolve => setTimeout(resolve, n))
// async function* makeTestJob(n: number) {
// 	for (let index = 1; index <= n; index++) {
// 		yield index.toString()
// 		await sleep(1000)
// 	}

// 	yield `Slept ${n} seconds complete!`
// }

// setTimeout(
// 	() => {
// 		for (let index = 5; index <= 10; index++) {
// 			jobs.update(jobs => [...jobs, new Job(`${index} seconds`, makeTestJob(index))])
// 		}
// 	},
// 	5000
// )
