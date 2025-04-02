import "dotenv/config";
import {
  ActivityType,
  Client,
  GatewayIntentBits,
  IntentsBitField,
  Partials,
  REST,
  Routes,
  type ApplicationCommandData,
  type ApplicationCommandDataResolvable,
  type ClientEvents,
  type GatewayIntentsString,
} from "discord.js";
import { file, Glob } from "bun";
import type { Command, Event } from "./typings";
import { err, info, success } from "../utils/logger";

export type CoreClientOptions = {
  globalCommands?: string;
  clientId: string;
};

export default class CoreBot extends Client {
  commands: Map<string, Command> = new Map();
  opts: Partial<CoreClientOptions> = {};
  constructor(opts?: CoreClientOptions) {
    super({
      intents: Object.keys(GatewayIntentBits).filter((f) =>
        isNaN(parseInt(f))
      ) as unknown as GatewayIntentBits[],
      partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.GuildScheduledEvent,
        Partials.Message,
        Partials.Reaction,
        Partials.ThreadMember,
        Partials.User,
      ],
      allowedMentions: {
        repliedUser: true,
      },
    });
    this.opts = opts || this.opts;
  }

  public init() {
    this.login(process.env.TOKEN);
    this.register();
  }

  public register() {
    this.registerCommands();
    this.registerEvents();
  }
  private async registerCommands() {
    const commandList: ApplicationCommandDataResolvable[] = [];
    const filesGlob = new Glob(`**/*Command.ts`);

    const fileList = Array.from(
      filesGlob.scanSync({
        cwd: `./src/commands`,
        onlyFiles: true,
      })
    );

    for (let i = 0; i < fileList.length; i++) {
      const filePwd = fileList[i];
      const data = (await import(`${process.cwd()}/src/commands/${filePwd}`))
        ?.default as Command;
      if (!data.name) return;

      this.commands.set(data.name, data);
      commandList.push(data);
    }

    const rest = new REST().setToken(process.env.TOKEN!);
    if (!this.opts.globalCommands) {
      info(`Registering commands globally.}`);
      rest
        .put(Routes.applicationCommands(this.opts.clientId!), {
          body: commandList,
        })
        .then((data) => {
          success(
            `Registered ${
              (data as unknown as Array<any>).length || 0
            } commands globally.`
          );
        })
        .catch(() => {
          err(`Failed to register commands globally.`, 0);
        });
    } else {
      info(`Registering commands in: ${this.opts.globalCommands}`);
      rest
        .put(
          Routes.applicationGuildCommands(
            this.opts.clientId!,
            this.opts.globalCommands
          ),
          {
            body: commandList,
          }
        )
        .then((data) => {
          success(
            `Registered ${
              (data as unknown as Array<any>).length || 0
            } commands in: ${this.opts.globalCommands}`
          );
        })
        .catch((e) => {
          err(`Failed to register commands in: ${this.opts.globalCommands}`, 0);
        });
    }
  }
  private async registerEvents() {
    const filesGlob = new Glob(`*Event.ts`);

    const fileList = Array.from(
      filesGlob.scanSync({
        cwd: `./src/events`,
        onlyFiles: true,
      })
    );
    info(`Registering events`);
    for (let i = 0; i < fileList.length; i++) {
      const filePwd = fileList[i];
      const data = (await import(`${process.cwd()}/src/events/${filePwd}`))
        ?.default as Event<keyof ClientEvents>;
      if (!data.name) return;
      success(`Registered event: ${data.name}`)
      this.on(data.name, data.run);
    }
  }
}
