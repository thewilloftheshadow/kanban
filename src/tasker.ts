import { Env } from "./index.js";

export enum TaskPriority {
	Next = "Next",
	Soon = "Soon",
	Later = "Later"
}

export type Task = {
	id: string
	title: string
	priority: TaskPriority
}

export class Tasker {
	private env: Env
	private userId: string

	constructor(env: Env, userId: string) {
		this.env = env
		this.userId = userId
	}

	async createTask(title: string, priority: TaskPriority = TaskPriority.Later) {
		const tasks = await this.getTasks()
		const task: Task = {
			id: crypto.randomUUID(),
			title,
			priority
		}
		tasks.push(task)
		await this.saveTasks(tasks)
		return task
	}

	async getTask(id: string): Promise<Task | undefined> {
		const tasks = await this.getTasks()
		return tasks.find(task => task.id === id)
	}

	async deleteTask(id: string) {
		const tasks = await this.getTasks()
		const index = tasks.findIndex(task => task.id === id)
		if (index !== -1) {
			tasks.splice(index, 1)
			await this.saveTasks(tasks)
		}
	}

	async updatePriority(id: string, priority: TaskPriority) {
		const tasks = await this.getTasks()
		const index = tasks.findIndex(task => task.id === id)
		if (index !== -1) {
			tasks[index].priority = priority
			await this.saveTasks(tasks)
		}
	}

	private saveTasks(tasks: Task[]) {
		tasks.map(x => {
			// check if it has all properties of a task, if not, default it
			if (!x.id) x.id = crypto.randomUUID()
			if (!x.priority) x.priority = TaskPriority.Next
			if (!x.title) x.title = "ERROR TITLE NOT FOUND"
		})
		return this.env.db.put(`tasks-${this.userId}`, JSON.stringify(tasks))
	}

	async getTasks(): Promise<Task[]> {
		const data = await this.env.db.get(`tasks-${this.userId}`)
		if (data) {
			return JSON.parse(data) as Task[]
		} else {
			return []
		}
	}
}