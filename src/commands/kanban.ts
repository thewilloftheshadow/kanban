import { ApplicationCommandOptionType, AutocompleteInteraction, Command, CommandWithSubcommands, Embed, type CommandInteraction } from "@buape/carbon"
import { Env } from "../index.js"
import { Task, Tasker, TaskPriority } from "../tasker.js"

export default class KanbanCommand extends CommandWithSubcommands {
    name = "kanban"
    description = "Kanban"
    subcommands: Command[]

    private env: Env

    constructor(env: Env) {
        super()
        this.env = env
        this.subcommands = [
            new Add(env),
            new List(env),
            new Delete(env),
            new Move(env)
        ]
    }

}

class Add extends Command {
    env: Env
    constructor(env: Env) {
        super()
        this.env = env
    }

    name = "add"
    description = "Add a task"
    options = [
        {
            name: "title",
            description: "The title of the task",
            type: ApplicationCommandOptionType.String as const,
            required: true
        },
        {
            name: "priority",
            description: "The priority of the task",
            type: ApplicationCommandOptionType.String as const,
            required: true,
            choices: [
                { name: "Next", value: "Next" },
                { name: "Soon", value: "Soon" },
                { name: "Later", value: "Later" }
            ]
        },
        {
            name: "ephemeral",
            description: "Whether to send the message as an ephemeral message",
            type: ApplicationCommandOptionType.Boolean as const,
            required: false
        }
    ]
    async run(interaction: CommandInteraction) {
        const ephemeral = interaction.options.getBoolean("ephemeral", false)
        if (ephemeral) this.ephemeral = true
        await interaction.defer()
        if (!interaction.userId) return
        const tasker = new Tasker(this.env, interaction.userId)
        const priority = (interaction.options.getString("priority") || "Later") as TaskPriority
        const task = await tasker.createTask(interaction.options.getString("title", true), priority)
        await interaction.reply(`Task created!\n-# ||${task.id}||`)
    }
}

class List extends Command {
    env: Env
    constructor(env: Env) {
        super()
        this.env = env
    }

    name = "list"
    description = "List all tasks"
    defer = true
    async run(interaction: CommandInteraction) {
        if (!interaction.userId) return
        const tasker = new Tasker(this.env, interaction.userId)
        const tasks = await tasker.getTasks()

        await interaction.reply({ embeds: [new TaskEmbed(tasks)] })
    }
}
class TaskEmbed extends Embed {
    title = "Tasks"
    color = 0xDDC4D7

    constructor(tasks: Task[]) {
        super()
        const nextTasks = tasks.filter(task => task.priority === TaskPriority.Next)
        const soonTasks = tasks.filter(task => task.priority === TaskPriority.Soon)
        const laterTasks = tasks.filter(task => task.priority === TaskPriority.Later)

        this.fields = [
            {
                name: "📍 Next",
                value: nextTasks.length ? nextTasks.map(task => `- ${task.title}`).join("\n") : "*No tasks*",
                inline: false
            },
            {
                name: "🔜 Soon",
                value: soonTasks.length ? soonTasks.map(task => `- ${task.title}`).join("\n") : "*No tasks*",
                inline: false
            },
            {
                name: "⏳ Later",
                value: laterTasks.length ? laterTasks.map(task => `- ${task.title}`).join("\n") : "*No tasks*",
                inline: false
            }
        ]
    }
}

class Delete extends Command {
    env: Env
    constructor(env: Env) {
        super()
        this.env = env
    }

    name = "delete"
    description = "Delete a task"
    options = [
        {
            name: "id",
            description: "The id of the task to delete",
            type: ApplicationCommandOptionType.String as const,
            required: true,
            autocomplete: true
        },
        {
            name: "ephemeral",
            description: "Whether to send the message as an ephemeral message",
            type: ApplicationCommandOptionType.Boolean as const,
            required: false
        }
    ]
    async run(interaction: CommandInteraction) {
        const ephemeral = interaction.options.getBoolean("ephemeral", false)
        if (ephemeral) this.ephemeral = true
        await interaction.defer()
        if (!interaction.userId) return
        const tasker = new Tasker(this.env, interaction.userId)
        const task = await tasker.getTask(interaction.options.getString("id", true))
        if (!task) return
        await tasker.deleteTask(task.id)
        await interaction.reply(`Task deleted!\n-# ||${task.id}||`)
    }

    async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
        if (!interaction.userId) return
        const tasker = new Tasker(this.env, interaction.userId)
        const tasks = await tasker.getTasks()
        const ids = tasks.map(task => { return { name: task.title, value: task.id } })
        await interaction.respond(ids)
    }
}

class Move extends Command {
    env: Env
    constructor(env: Env) {
        super()
        this.env = env
    }

    name = "move"
    description = "Move a task to a different priority"
    options = [
        {
            name: "id",
            description: "The id of the task to move",
            type: ApplicationCommandOptionType.String as const,
            required: true,
            autocomplete: true
        },
        {
            name: "priority",
            description: "The new priority of the task",
            type: ApplicationCommandOptionType.String as const,
            required: true,
            choices: [
                { name: "Next", value: "Next" },
                { name: "Soon", value: "Soon" },
                { name: "Later", value: "Later" }
            ]
        },
        {
            name: "ephemeral",
            description: "Whether to send the message as an ephemeral message",
            type: ApplicationCommandOptionType.Boolean as const,
            required: false
        }
    ]

    async run(interaction: CommandInteraction) {
        const ephemeral = interaction.options.getBoolean("ephemeral", false)
        if (ephemeral) this.ephemeral = true
        await interaction.defer()
        if (!interaction.userId) return

        const tasker = new Tasker(this.env, interaction.userId)
        const taskId = interaction.options.getString("id", true)
        const newPriority = interaction.options.getString("priority", true) as TaskPriority

        await tasker.updatePriority(taskId, newPriority)
        await interaction.reply(`Task moved to ${newPriority}!\n-# ||${taskId}||`)
    }

    async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
        if (!interaction.userId) return
        const tasker = new Tasker(this.env, interaction.userId)
        const tasks = await tasker.getTasks()
        const ids = tasks.map(task => { return { name: task.title, value: task.id } })
        await interaction.respond(ids)
    }
}