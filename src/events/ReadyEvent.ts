import  { ActivityType, type ClientEvents } from "discord.js";
import type { Event } from "../core/typings";
import { app } from "..";

export default {
    name: "ready",
    run: () => {
        app.user?.setActivity({
            name: "",
            state: "dnd",
            type: ActivityType.Competing
        })
    }
} as Event<keyof ClientEvents>