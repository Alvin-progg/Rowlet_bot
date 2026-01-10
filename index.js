require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, REST, Routes } = require('discord.js');

// Initialize Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
    ],
});

// ========== CONFIGURATION ==========

// Role limits configuration
const ROLE_LIMITS = {
    mainTank: 1,
    offTank: 1,
    healer: 1,
    blazing: 1,
    stillgaze: 1,
    shadowCaller: 1,
    dps: 3,
    leacher: 1,
};

// Custom emoji IDs 
const EMOJIS = {
    mainTank: '1234567890',      
    offTank: '1459441602715189583',     
    healer: '1459441666954891367',       
    blazing: '1459441447089602787',       
    stillgaze: '1459441784194203852',       
    shadowCaller: '1459441501032546304',   
    dps: '1459441823763271691',            
    leacher: '1459441728024219764',         
    date: '📅',
    queue: '📋',
};

// Store active raid events
const raidEvents = new Map();

// ========== HELPER FUNCTIONS ==========

// Generate unique event ID
function generateEventId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Create the raid embed
function createRaidEmbed(event) {
    const totalSignups = Object.values(event.roles)
        .filter(role => role.name !== 'queue')
        .reduce((sum, role) => sum + role.users.length, 0);

    const uniqueSignups = new Set(
        Object.values(event.roles)
            .filter(role => role.name !== 'queue')
            .flatMap(role => role.users.map(u => u.id))
    ).size;

    // Helper function to format users with role emojis in queue
    const formatUsers = (users) => {
        if (!users || users.length === 0) return '-';
        return users.map(u => {
            if (u.queuedRole) {
                return `<:emoji:${EMOJIS[u.queuedRole]}> ${u.id}`;
            }
            return u.id || u;
        }).join('\n');
    };

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
                name: `👑 Raid Leader / Main Tank`,
                value: formatUsers(event.roles.mainTank.users),
                inline: true
            },
            {
                name: `<:emoji:${EMOJIS.offTank}> Off Tank (${event.roles.offTank.users.length}/${ROLE_LIMITS.offTank})`,
                value: formatUsers(event.roles.offTank.users),
                inline: true
            },
            {
                name: `<:emoji:${EMOJIS.healer}> Healer (${event.roles.healer.users.length}/${ROLE_LIMITS.healer})`,
                value: formatUsers(event.roles.healer.users),
                inline: true
            },
            {
                name: `<:emoji:${EMOJIS.blazing}> Blazing (${event.roles.blazing.users.length}/${ROLE_LIMITS.blazing})`,
                value: formatUsers(event.roles.blazing.users),
                inline: true
            },
            {
                name: `<:emoji:${EMOJIS.stillgaze}> Stillgaze (${event.roles.stillgaze.users.length}/${ROLE_LIMITS.stillgaze})`,
                value: formatUsers(event.roles.stillgaze.users),
                inline: true
            },
            {
                name: `<:emoji:${EMOJIS.shadowCaller}> Shadow Caller (${event.roles.shadowCaller.users.length}/${ROLE_LIMITS.shadowCaller})`,
                value: formatUsers(event.roles.shadowCaller.users),
                inline: true
            },
            {
                name: `<:emoji:${EMOJIS.dps}> DPS (${event.roles.dps.users.length}/${ROLE_LIMITS.dps})`,
                value: formatUsers(event.roles.dps.users),
                inline: true
            },
            {
                name: `<:emoji:${EMOJIS.leacher}> Leacher (${event.roles.leacher.users.length}/${ROLE_LIMITS.leacher})`,
                value: formatUsers(event.roles.leacher.users),
                inline: true
            },
            {
                name: `${EMOJIS.queue} In Queue (${event.roles.queue.users.length})`,
                value: formatUsers(event.roles.queue.users),
                inline: true
            }
        )
        .setFooter({ 
            text: `Sign ups: Total: ${uniqueSignups} - Main Roles: ${totalSignups}\nEvent ID: ${event.id}`
        });
}

// Create the role selection menu
function createRoleMenu() {
    return new StringSelectMenuBuilder()
        .setCustomId('role-menu')
        .setPlaceholder('Choose your role')
        .addOptions(
            { 
                label: 'Off Tank', 
                value: 'offTank', 
                emoji: { id: EMOJIS.offTank, name: 'offTank' }
            },
            { 
                label: 'Healer', 
                value: 'healer', 
                emoji: { id: EMOJIS.healer, name: 'healer' }
            },
            { 
                label: 'Blazing', 
                value: 'blazing', 
                emoji: { id: EMOJIS.blazing, name: 'blazing' }
            },
            { 
                label: 'Stillgaze', 
                value: 'stillgaze', 
                emoji: { id: EMOJIS.stillgaze, name: 'stillgaze' }
            },
            { 
                label: 'Shadow Caller', 
                value: 'shadowCaller', 
                emoji: { id: EMOJIS.shadowCaller, name: 'shadowCaller' }
            },
            { 
                label: 'DPS', 
                value: 'dps', 
                emoji: { id: EMOJIS.dps, name: 'dps' }
            },
            { 
                label: 'Leacher', 
                value: 'leacher', 
                emoji: { id: EMOJIS.leacher, name: 'leacher' }
            },
            { 
                label: 'Remove Role', 
                value: 'remove', 
                emoji: '❌' 
            },
        );
}

// Initialize raid event structure
function initializeRaidEvent(title, date, description, host) {
    return {
        id: generateEventId(),
        title,
        date,
        description,
        host,
        roles: {
            mainTank: { name: 'mainTank', users: [{ id: host }], max: ROLE_LIMITS.mainTank },
            offTank: { name: 'offTank', users: [], max: ROLE_LIMITS.offTank },
            healer: { name: 'healer', users: [], max: ROLE_LIMITS.healer },
            blazing: { name: 'blazing', users: [], max: ROLE_LIMITS.blazing },
            stillgaze: { name: 'stillgaze', users: [], max: ROLE_LIMITS.stillgaze },
            shadowCaller: { name: 'shadowCaller', users: [], max: ROLE_LIMITS.shadowCaller },
            dps: { name: 'dps', users: [], max: ROLE_LIMITS.dps },
            leacher: { name: 'leacher', users: [], max: ROLE_LIMITS.leacher },
            queue: { name: 'queue', users: [], max: Infinity },
        },
        messageId: null,
        channelId: null,
    };
}

// Remove user from all roles
function removeUserFromAllRoles(event, userId) {
    for (const roleKey in event.roles) {
        event.roles[roleKey].users = event.roles[roleKey].users.filter(u => {
            const id = u.id || u;
            return id !== userId;
        });
    }
}

// ========== SLASH COMMAND REGISTRATION ==========

const commands = [
    {
        name: 'raid',
        description: 'Create a raid event with date',
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

// ========== BOT EVENTS ==========

client.once('clientReady', () => {
    console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
});

// Handle slash commands
client.on('interactionCreate', async (interaction) => {
    // Handle /raid command
    if (interaction.isCommand() && interaction.commandName === 'raid') {
        const title = interaction.options.getString('title');
        const date = interaction.options.getString('date');
        const description = interaction.options.getString('description') || '';
        const host = interaction.user.toString();

        // Initialize raid event
        const event = initializeRaidEvent(title, date, description, host);

        // Create embed and menu
        const embed = createRaidEmbed(event);
        const selectMenu = createRoleMenu();
        const row = new ActionRowBuilder().addComponents(selectMenu);

        // Send the raid event message
        await interaction.reply({ 
            embeds: [embed], 
            components: [row]
        });
        
        const reply = await interaction.fetchReply();

        // Store event data
        event.messageId = reply.id;
        event.channelId = interaction.channel.id;
        raidEvents.set(reply.id, event);

        console.log(`Raid event created: ${event.id} by ${interaction.user.tag}`);
    }

    // Handle role selection menu
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

        // Handle role removal
        if (selectedRole === 'remove') {
            removeUserFromAllRoles(event, userId);
            responseMessage = 'You have been removed from all roles.';
        } else {
            // Remove user from all roles first (one role per person)
            removeUserFromAllRoles(event, userId);

            // Check if role is full
            const role = event.roles[selectedRole];
            if (role.users.length >= role.max) {
                // Auto-add to queue with role marker
                event.roles.queue.users.push({
                    id: userId,
                    queuedRole: selectedRole
                });
                responseMessage = `The **${selectedRole}** role is full. You've been added to the queue as **${selectedRole}**.`;
            } else {
                // Add user to selected role
                role.users.push({ id: userId });
                responseMessage = `You have been added to the **${selectedRole}** role!`;
            }
        }

        // Update the embed
        const updatedEmbed = createRaidEmbed(event);
        const selectMenu = createRoleMenu();
        const row = new ActionRowBuilder().addComponents(selectMenu);

        try {
            await interaction.update({ 
                embeds: [updatedEmbed], 
                components: [row] 
            });
            // Send a follow-up message to confirm the action
            await interaction.followUp({ 
                content: responseMessage, 
                flags: 64 
            });
        } catch (error) {
            console.error('Error updating raid embed:', error);
        }
    }
});

// ========== START BOT ==========

client.login(process.env.TOKEN || process.env.DISCORD_TOKEN).catch((error) => {
    console.error('❌ Failed to log in:', error);
    console.error('Make sure TOKEN or DISCORD_TOKEN is set in your .env file');
});
