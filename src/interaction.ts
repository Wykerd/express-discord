import { Request, Response } from "express";
import Discord, { 
    snowflake, InteractionType, InteractionResponseType, 
    ApplicationCommandNew, InteractionResponse, 
    ApplicationCommand, EditWebhookBody, WebhookBody 
} from './types';
import fetch from 'node-fetch';
import nacl from 'tweetnacl';

const base_endpoint = 'https://discord.com/api/v8';

export interface CloudRequest extends Request {
    rawBody?: Buffer
}

export interface ApplicationCommandMap {
    [key: string]: ApplicationCommand
}

export type ApplicationCommandCallback = (command: ApplicationCommandHandler) => any;

export interface ApplicationCommandHandlerIndex {
    ids: {
        [key: string]: ApplicationCommandCallback
    },
    names: {
        [key: string]: ApplicationCommandCallback
    }
};


export default class InteractionsClient {
    private readonly publicKey : string;
    public readonly applicationId: snowflake;
    public readonly botToken: snowflake;
    public commands : ApplicationCommandMap = {};
    public handlers : ApplicationCommandHandlerIndex = {
        ids: {},
        names: {}
    };
    
    constructor (publicKey : string, applicationId: snowflake, botToken: snowflake) {
        this.publicKey = publicKey;
        this.applicationId = applicationId;
        this.botToken = botToken;
        this.handler = this.handler.bind(this);
    };

    /**
     * Declares a global command without creating it
     * @param command The command to push into the internal state
     */
    public declareCommand (command : ApplicationCommand) : ApplicationCommand {
        this.commands[command.id] = command;

        return command;
    }

    public addId (id: snowflake, callback: ApplicationCommandCallback) {
        this.handlers.ids[id] = callback;
    }

    public add (name: string, callback: ApplicationCommandCallback) {
        this.handlers.names[name] = callback;
    };

    /**
     * Get all the existing global commands and declares them.
     */
    public async getCommands () : Promise<ApplicationCommand[]> {
        const res = await fetch(`${base_endpoint}/applications/${this.applicationId}/commands`, {
            headers: {
                'Authorization': `Bot ${this.botToken}`
            }
        });
        if (res.status !== 200)
            throw new Error('Unexpected status from Discord API response');
        const commands = await res.json();
        const cmds = commands.map((e : ApplicationCommand) => this.declareCommand(e));

        return cmds;
    }

    /**
     * Create a new global command and declares it once done
     * @param command The command to create
     */
    public async createCommand (command: ApplicationCommandNew) : Promise<ApplicationCommand> {
        const res = await fetch(`${base_endpoint}/applications/${this.applicationId}/commands`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bot ${this.botToken}`
            },
            body: JSON.stringify(command)
        });

        if (res.status !== 200)
            throw new Error('Unexpected status from Discord API response ' + JSON.stringify(await res.json()));
        
        return this.declareCommand(await res.json());
    };

    /**
     * Edit an existing global command.
     * @param command The updated values for the command
     * @param id The id of the command to update
     */
    public async editCommand (command: ApplicationCommandNew, id: snowflake) {
        const res = await fetch(`${base_endpoint}/applications/${this.applicationId}/commands/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bot ${this.botToken}`
            },
            body: JSON.stringify(command)
        });

        if (res.status !== 200)
            throw new Error('Unexpected status from Discord API response');

        return this.declareCommand(await res.json());
    }

    /**
     * Delete a global command
     * @param id The snowflake ID of the command to delete
     */
    public async deleteCommand (id: snowflake) {
        const res = await fetch(`${base_endpoint}/applications/${this.applicationId}/commands/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bot ${this.botToken}`
            }
        });

        if (res.status !== 204)
            throw new Error('Unexpected status from Discord API response');
    }

    private verifySig (signature?: string, timestamp?: string, body?: string) {
        try {
            return (signature && timestamp && body) && nacl.sign.detached.verify(
                Buffer.from(timestamp + body),
                Buffer.from(signature, 'hex'),
                Buffer.from(this.publicKey, 'hex')
            );   
        } catch {
            return false;  
        }
    };

    /**
     * The express handler
     * @param req Express request context - This must expose a rawBody property through some middleware!
     * @param res Express response context
     */
    public handler (req: CloudRequest, res: Response) {
        if (req.method !== 'POST')
            return res.status(404).json({
                error: 'Not Found',
                message: 'This endpoint only accepts POST method'
            });

        const timestamp = req.get('X-Signature-Timestamp');

        try {
            if (!this.verifySig(req.get('X-Signature-Ed25519'), timestamp, req.rawBody?.toString("utf8")))
                return res.status(401).json({
                    error: 'Prohibited',
                    message: 'Invalid request signature'
                });   
        } catch (error) {
            return res.status(401).json({
                error: 'Prohibited',
                message: 'Invalid request signature',
                stack: (error as Error).stack
            });   
        }
        
        switch (req.body.type) {
            case InteractionType.Ping:
                return res.status(200).json({
                    type: InteractionResponseType.Pong
                });

            case InteractionType.ApplicationCommand:
                {
                    const interaction = req.body as Discord.Interaction;

                    const handler = new ApplicationCommandHandler(new Date(), this, res, interaction);

                    if (interaction.data) {
                        if (this.handlers.names[interaction.data.name]) {
                            this.handlers.names[interaction.data.name](handler);
                            return;
                        };

                        if (this.handlers.ids[interaction.data.id]) {
                            this.handlers.ids[interaction.data.id](handler);
                            return;
                        };
                    }

                    handler.acknowledge();
                }
                break;
        
            default:
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Invalid `InteractionType` specified in body property `type`'
                })
        }      
    };
}

export class ApplicationCommandHandler {
    // Internals
    public client : InteractionsClient;
    public readonly timestamp : number;
    private response : Response;
    private isAck : boolean = false;

    // Interaction properties
    public readonly interaction: Discord.Interaction;

    constructor (timestamp : Date, client: InteractionsClient, 
                 response: Response, interaction: Discord.Interaction) 
    {
        if (interaction.type !== InteractionType.ApplicationCommand)
            throw new TypeError('Invalid `InteractionType` expected `' + InteractionType.ApplicationCommand + '`');

        this.timestamp = timestamp.getTime();

        if (Number.isNaN(this.timestamp))
            throw new TypeError('Provided timestamp is invalid');

        this.client = client;
        this.response = response;

        this.interaction = interaction;
    };

    /**
     * Checks that token is still valid
     */
    public isValid () {
        return (Date.now() - this.timestamp < 900000)
    };

    /**
     * Respond to the command
     * @param response The response to make
     */
    public respond (response: InteractionResponse) {
        if (!this.isValid())
            throw new Error('The interaction token has expired');
        if (this.isAck)
            throw new Error('The command has already been responded to');

        this.response.status(200).json(response);
        this.isAck = true;
    }

    /**
     * Edit an response
     */
    public async editResponse (edit: EditWebhookBody, id: snowflake) {
        if (!this.isValid())
            throw new Error('The interaction token has expired');

        const res = await fetch(`/webhooks/application.id/${this.interaction.token}/messages/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bot ${this.client.botToken}`
            },
            body: JSON.stringify(edit)
        });

        if (res.status !== 200)
            throw new Error('Unexpected status from Discord API response');

        return res;
    }

    /**
     * Delete an response
     */
    public async deleteResponse (id: snowflake) {
        if (!this.isValid())
            throw new Error('The interaction token has expired');
        
        const res = await fetch(`/webhooks/application.id/${this.interaction.token}/messages/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bot ${this.client.botToken}`
            }
        });

        if (res.status !== 204)
            throw new Error('Unexpected status from Discord API response');

        return res;
    }

    public editInitialResponse (edit: EditWebhookBody) {
        return this.editResponse(edit, '@original');
    };

    public deleteInitialResponse () {
        return this.deleteResponse('@original')
    };

    public async followup (create: WebhookBody) {
        if (!this.isValid())
            throw new Error('The interaction token has expired');

        const res = await fetch(`/webhooks/application.id/${this.interaction.token}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bot ${this.client.botToken}`
            },
            body: JSON.stringify(create)
        });

        if (res.status !== 200)
            throw new Error('Unexpected status from Discord API response');

        return res;
    }

    /**
     * Acknowledge the response without responding to it
     */
    public acknowledge () {
        if (!this.isValid())
            throw new Error('The interaction token has expired');
        if (this.isAck)
            throw new Error('The command has already been responded to');

        const res : InteractionResponse = {
            type: InteractionResponseType.Pong
        }
        this.response.status(200).json(res);
        this.isAck = true;
    }

    /**
     * Ensures that the command has been acknowledged.
     */
    public ensureAck () {
        if (!this.isAck)
            this.acknowledge();
    };
};
