require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, REST, Routes } = require('discord.js');

// Initialize Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
    ],
});




const ROLE_LIMITS = {
    tank: 1,
    healer: 1,
    debuff: 1,
    dps: 4,
    queue: 3,
};


const EMOJIS = {
    tank: '🛡️',
    healer: '💚',
    debuff: '⚡',
    dps: '⚔️',
    queue: '📋',
    date: '📅',
};


const raidEvents = new Map();


function generateEventId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}


function createRaidEmbed(event) {
    const totalSignups = Object.values(event.roles)
        .filter(role => role.name !== 'queue')
        .reduce((sum, role) => sum + role.users.length, 0);

    const uniqueSignups = new Set(
        Object.values(event.roles)
            .filter(role => role.name !== 'queue')
            .flatMap(role => role.users)
    ).size;

    return new EmbedBuilder()
        .setTitle(event.title)
        .setDescription(
            `Hosted by **${event.host}**\n\n` +
            `${EMOJIS.date} Date: **${event.date}**\n\n` +
            `${event.description ? `**Description:**\n${event.description}\n\n` : ''}`
        )
        .setColor('#0099ff')
        .addFields(
            {
                name: `${EMOJIS.tank} Tank (${event.roles.tank.users.length}/${ROLE_LIMITS.tank})`,
                value: event.roles.tank.users.join('\n') || '-',
                inline: true
            },
            {
                name: `${EMOJIS.healer} Healer (${event.roles.healer.users.length}/${ROLE_LIMITS.healer})`,
                value: event.roles.healer.users.join('\n') || '-',
                inline: true
            },
            {
                name: `${EMOJIS.debuff} Debuff (${event.roles.debuff.users.length}/${ROLE_LIMITS.debuff})`,
                value: event.roles.debuff.users.join('\n') || '-',
                inline: true
            },
            {
                name: `${EMOJIS.dps} DPS (${event.roles.dps.users.length}/${ROLE_LIMITS.dps})`,
                value: event.roles.dps.users.join('\n') || '-',
                inline: true
            },
            {
                name: `${EMOJIS.queue} In Queue (${event.roles.queue.users.length}/${ROLE_LIMITS.queue})`,
                value: event.roles.queue.users.join('\n') || '-',
                inline: true
            }
        )
        .setFooter({ 
            text: `Sign ups: Total: ${uniqueSignups} - Main Roles: ${totalSignups}\nEvent ID: ${event.id}`
        });
}


function createRoleMenu() {
    return new StringSelectMenuBuilder()
        .setCustomId('role-menu')
        .setPlaceholder('Choose your role')
        .addOptions(
            { 
                label: 'Tank', 
                value: 'tank', 
                emoji: EMOJIS.tank
            },
            { 
                label: 'Healer', 
                value: 'healer', 
                emoji: EMOJIS.healer
            },
            { 
                label: 'Debuff', 
                value: 'debuff', 
                emoji: EMOJIS.debuff
            },
            { 
                label: 'DPS', 
                value: 'dps', 
                emoji: EMOJIS.dps
            },
            { 
                label: 'Queue', 
                value: 'queue', 
                emoji: EMOJIS.queue
            },
            { 
                label: 'Remove Role', 
                value: 'remove', 
                emoji: '❌' 
            },
        );
}


function initializeRaidEvent(title, date, description, host) {
    return {
        id: generateEventId(),
        title,
        date,
        description,
        host,
        roles: {
            tank: { name: 'tank', users: [], max: ROLE_LIMITS.tank },
            healer: { name: 'healer', users: [], max: ROLE_LIMITS.healer },
            debuff: { name: 'debuff', users: [], max: ROLE_LIMITS.debuff },
            dps: { name: 'dps', users: [], max: ROLE_LIMITS.dps },
            queue: { name: 'queue', users: [], max: ROLE_LIMITS.queue },
        },
        messageId: null,
        channelId: null,
    };
}


function removeUserFromAllRoles(event, userId) {
    for (const roleKey in event.roles) {
        event.roles[roleKey].users = event.roles[roleKey].users.filter(id => id !== userId);
    }
}


const commands = [
    {
        name: 'raid',
        description: 'Create a raid event with date and time',
        options: [
            {
                name: 'title',
                description: 'The title/name of the raid event',
                type: 3, 
                required: true,
            },
            {
                name: 'date',
                description: 'The date for the raid (e.g., 1/10/2026)',
                type: 3, 
                required: true,
            },
            {
                name: 'description',
                description: 'Additional details about the raid (optional)',
                type: 3, 
                required: false,
            },
        ],
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN || process.env.DISCORD_TOKEN);

(async () => {
    try {
        if (process.env.CLIENT_ID) {
            console.log('Registering slash commands...');
            
            // Use guild commands for instant updates if GUILD_ID is provided
            const route = process.env.GUILD_ID 
                ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
                : Routes.applicationCommands(process.env.CLIENT_ID);
            
            await rest.put(route, { body: commands });
            
            console.log('✅ Slash commands registered successfully!');
        } else {
            console.log('⚠️ CLIENT_ID not found in .env - slash commands not registered');
        }
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
})();



client.once('clientReady', () => {
    console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
});


client.on('interactionCreate', async (interaction) => {
    // Handle /raid command
    if (interaction.isCommand() && interaction.commandName === 'raid') {
        const title = interaction.options.getString('title');
        const date = interaction.options.getString('date');
        const description = interaction.options.getString('description') || '';
        const host = interaction.user.toString();


        const event = initializeRaidEvent(title, date, description, host);


        const embed = createRaidEmbed(event);
        const selectMenu = createRoleMenu();
        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({ 
            embeds: [embed], 
            components: [row]
        });
        
        const reply = await interaction.fetchReply();

        event.messageId = reply.id;
        event.channelId = interaction.channel.id;
        raidEvents.set(reply.id, event);

        console.log(`Raid event created: ${event.id} by ${interaction.user.tag}`);
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'role-menu') {
        const event = raidEvents.get(interaction.message.id);
        
        if (!event) {
            await interaction.reply({ 
                content: 'This raid event is no longer active.', 
                flags: 64 
            });
            return;
        }

        const selectedRole = interaction.values[0];
        const userId = `<@${interaction.user.id}>`;
        let responseMessage = '';


        if (selectedRole === 'remove') {
            removeUserFromAllRoles(event, userId);
            responseMessage = 'You have been removed from all roles.';
        } else {

            removeUserFromAllRoles(event, userId);


            const role = event.roles[selectedRole];
            if (role.users.length >= role.max) {
                await interaction.reply({ 
                    content: `The **${selectedRole}** role is already full (${role.max}/${role.max}).`, 
                    flags: 64 
                });
                return;
            }


            role.users.push(userId);
            responseMessage = `You have been added to the **${selectedRole}** role!`;
        }


        const updatedEmbed = createRaidEmbed(event);
        const selectMenu = createRoleMenu();
        const row = new ActionRowBuilder().addComponents(selectMenu);

        try {
            await interaction.update({ 
                embeds: [updatedEmbed], 
                components: [row] 
            });

            await interaction.followUp({ 
                content: responseMessage, 
                flags: 64 
            });
        } catch (error) {
            console.error('Error updating raid embed:', error);
        }
    }
});


client.login(process.env.TOKEN || process.env.DISCORD_TOKEN).catch((error) => {
    console.error('❌ Failed to log in:', error);
    console.error('Make sure TOKEN or DISCORD_TOKEN is set in your .env file');
});
