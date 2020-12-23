// Interactions

namespace Discord {
    export type snowflake = string;

    export enum AllowedMentionsType {
        ROLE_MENTIONS = "roles",
        USER_MENTIONS = "users",
        EVERYONE_MENTIONS = "everyone"
    }

    export interface AllowedMentions {
        parse: AllowedMentionsType[],
        roles: snowflake[],
        users: snowflake[],
        replied_user: boolean
    }

    export interface EmbedField {
        name: string,
        value: string,
        inline?: boolean
    }

    export interface EmbedAuthor {
        name?: string,
        url?: string,
        icon_url?: string,
        proxy_icon_url?: string
    }

    export interface EmbedProvider {
        name?: string,
        url?: string
    }

    export interface EmbedImage {
        url?: string,
        proxy_url?: string,
        height?: number,
        width?: number
    }

    export interface EmbedVideo {
        url? : string,
        height?: number,
        width?: number
    }

    export interface EmbedThumbnail {
        url?: string,
        proxy_url?: string,
        height?: number,
        width?: number
    }

    export enum EmbedType {
        RICH = "rich",
        IMAGE = "image",
        VIDEO = "video",
        GIFV = "gifv",
        ARTICLE = "article",
        LINK = "link"
    }

    export interface EmbedFooter {
        text: string,
        icon_url?: string,
        proxy_icon_url?: string
    }

    export interface Embed {
        title?: string,
        type?: EmbedType,
        description?: string,
        url?: string,
        timestamp?: number,
        color?: number,
        footer?: EmbedFooter,
        image?: EmbedImage,
        thumbnail?: EmbedThumbnail,
        video?: EmbedVideo,
        provider?: EmbedProvider,
        author?: EmbedAuthor,
        fields?: EmbedField[]
    }

    export enum PremiumType {
        NONE = 0,
        NITRO_CLASSIC = 1,
        NITRO = 2
    }

    export interface User {
        id: snowflake,
        username: string,
        discriminator: string,
        avatar?: string,
        bot?: boolean,
        system?: boolean,
        mfa_enabled?: boolean,
        locale?: string,
        verified?: boolean,
        email?: boolean,
        flags?: number,
        premium_type?: PremiumType,
        public_flags?: number
    }

    export interface GuildMember {
        user?: User,
        nick?: string,
        roles: snowflake[],
        joined_at: number,
        premium_since?: number,
        deaf: boolean,
        mute: boolean,
        pending?: boolean
    }

    export interface EditWebhookBody {
        content?: string,
        embeds?: Embed[],
        allowed_mentions?: AllowedMentions
    }

    export interface WebhookBody {
        content?: string,
        username?: string,
        avatar_url?: string,
        tts?: boolean,
        embeds?: Embed[],
        allowed_mentions?: AllowedMentions
    }

    export interface InteractionApplicationCommandCallbackData {
        tts?: boolean,
        content: string,
        embeds?: Embed[],
        allowed_mentions?: AllowedMentions
    }

    export enum InteractionResponseType {
        Pong = 1,
        Acknowledge = 2,
        ChannelMessage = 3,
        ChannelMessageWithSource = 4,
        ACKWithSource = 5
    }

    export interface InteractionResponse {
        type: InteractionResponseType,
        data?: InteractionApplicationCommandCallbackData
    }

    export interface ApplicationCommandInteractionDataOption {
        name: string,
        value?: any,
        options?: ApplicationCommandInteractionDataOption[]
    }

    export interface ApplicationCommandInteractionData {
        id: snowflake,
        name: string,
        options?: ApplicationCommandInteractionDataOption[]
    }

    export enum InteractionType {
        Ping = 1,
        ApplicationCommand = 2
    }

    export interface Interaction {
        id: snowflake,
        type: InteractionType,
        data?: ApplicationCommandInteractionData,
        guild_id: snowflake,
        channel_id: snowflake,
        member: GuildMember,
        token: string,
        version: number
    }

    export interface ApplicationCommandOptionChoice {
        name: string,
        value: string | number
    }

    export enum ApplicationCommandOptionType {
        SUB_COMMAND = 1,
        SUB_COMMAND_GROUP = 2,
        STRING = 3,
        INTEGER = 4,
        BOOLEAN = 5,
        USER = 6,
        CHANNEL = 7,
        ROLE = 8
    }

    export interface ApplicationCommandOption {
        type: ApplicationCommandOptionType,
        name: string,
        description: string,
        default?: boolean,
        required?: boolean,
        choices?: ApplicationCommandOptionChoice[],
        options?: ApplicationCommandOption
    }

    export interface ApplicationCommandNew {
        name: string,
        description: string,
        options?: ApplicationCommandOption[]
    }

    export interface ApplicationCommand extends ApplicationCommandNew {
        id: snowflake,
        application_id: snowflake
    }
};

export = Discord;