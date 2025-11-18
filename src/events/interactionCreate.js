const {
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { FORUM_CHANNEL, AUDIT_CHANNEL, STAFF_ROLES } = require('../config');
const {
  readAgents,
  getAgentBySid,
  updateAgent,
  writeAgents
} = require('../utils/db');
const { sendAudit } = require('../utils/audit');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    // ===== СЛЭШ-КОМАНДЫ =====
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(err);
        if (!interaction.replied && !interaction.deferred) {
          interaction.reply({
            content: 'Ошибка при выполнении команды.',
            ephemeral: true
          });
        }
      }
      return;
    }

    // ===== КНОПКИ =====
    if (interaction.isButton()) {
      const id = interaction.customId;

      // Открытие модалки заявки
      if (['apply_join', 'apply_restore', 'apply_unban'].includes(id)) {
        const modal = buildApplyModal(id);
        return interaction.showModal(modal);
      }

      // Модерация заявок
      if (id.startsWith('appmod_')) {
        return handleModerationButton(interaction, client);
      }

      // Подтверждение / отклонение увольнения по собственному
      if (id.startsWith('leave_accept_') || id.startsWith('leave_decline_')) {
        return handleLeaveButtons(interaction, client);
      }
    }

    // ===== МОДАЛКИ =====
    if (interaction.isModalSubmit()) {
      if (
        ['modal_apply_join', 'modal_apply_restore', 'modal_apply_unban'].includes(
          interaction.customId
        )
      ) {
        return handleApplicationModal(interaction, client);
      }
    }
  }
};

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

function buildApplyModal(typeId) {
  let title;
  if (typeId === 'apply_join') title = 'Заявка на вступление';
  if (typeId === 'apply_restore') title = 'Заявка на восстановление';
  if (typeId === 'apply_unban') title = 'Заявка на снятие ЧС';

  const modal = new ModalBuilder().setCustomId(toModalId(typeId)).setTitle(title);

  const inputServer = new TextInputBuilder()
    .setCustomId('server')
    .setLabel('Сервер')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const inputNick = new TextInputBuilder()
    .setCustomId('nick')
    .setLabel('Ник / статик (можно вписать #SID)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const inputNameAge = new TextInputBuilder()
    .setCustomId('name_age')
    .setLabel('Имя и возраст')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const inputAbout = new TextInputBuilder()
    .setCustomId('about')
    .setLabel('О себе')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  const inputMotivation = new TextInputBuilder()
    .setCustomId('motivation')
    .setLabel('Мотивация / комментарий')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(inputServer),
    new ActionRowBuilder().addComponents(inputNick),
    new ActionRowBuilder().addComponents(inputNameAge),
    new ActionRowBuilder().addComponents(inputAbout),
    new ActionRowBuilder().addComponents(inputMotivation)
  );

  return modal;
}

function toModalId(buttonId) {
  if (buttonId === 'apply_join') return 'modal_apply_join';
  if (buttonId === 'apply_restore') return 'modal_apply_restore';
  if (buttonId === 'apply_unban') return 'modal_apply_unban';
  return buttonId;
}

async function handleApplicationModal(interaction, client) {
  const forum = await client.channels.fetch(FORUM_CHANNEL).catch(() => null);
  if (!forum) {
    return interaction.reply({
      content: 'Форум-канал не найден или не настроен.',
      ephemeral: true
    });
  }

  const typeMap = {
    modal_apply_join: 'Заявка на вступление',
    modal_apply_restore: 'Заявка на восстановление',
    modal_apply_unban: 'Заявка на снятие ЧС'
  };

  const type = typeMap[interaction.customId] || 'Заявка';

  const server = interaction.fields.getTextInputValue('server');
  const nick = interaction.fields.getTextInputValue('nick');
  const nameAge = interaction.fields.getTextInputValue('name_age');
  const about = interaction.fields.getTextInputValue('about');
  const motivation = interaction.fields.getTextInputValue('motivation');

  const applicant = interaction.user;

  const embed = new EmbedBuilder()
    .setTitle('📄 Заявка')
    .setColor(0x57f287)
    .addFields(
      { name: 'Заявитель', value: `${applicant} / \`${applicant.id}\``, inline: false },
      { name: 'Тип заявки', value: type, inline: false },
      { name: 'Сервер', value: server, inline: true },
      { name: 'Ник / статик', value: nick, inline: true },
      { name: 'Имя и возраст', value: nameAge, inline: false },
      { name: 'О себе', value: about.slice(0, 1024), inline: false },
      { name: 'Мотивация / комментарий', value: motivation.slice(0, 1024), inline: false },
      { name: 'Статус', value: '⏳ На рассмотрении', inline: false }
    )
    .setTimestamp();

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('appmod_take')
      .setLabel('Взять на рассмотрение')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('appmod_accept').setLabel('Принять').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('appmod_decline').setLabel('Отклонить').setStyle(ButtonStyle.Danger)
  );

  const buttons2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('appmod_unban').setLabel('Снять Ч.С.').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('appmod_restore').setLabel('Восстановить').setStyle(ButtonStyle.Primary)
  );

  const threadName = `${type} — ${applicant.username}`;

  const thread = await forum.threads.create({
    name: threadName,
    message: {
      embeds: [embed],
      components: [buttons, buttons2]
    }
  });

  await interaction.reply({
    content: `✅ Ваша заявка создана: ${thread}`,
    ephemeral: true
  });
}

function hasStaffRole(member) {
  return STAFF_ROLES.some(id => member.roles.cache.has(id));
}

// автообновление БД по заявке
function updateAgentFromApplication(embed, applicantId, action) {
  const fields = embed.data?.fields || embed.fields || [];
  const nickField = fields.find(f => f.name === 'Ник / статик');
  if (!nickField) return;

  const nick = nickField.value;
  const sidMatch = nick.match(/#(\d{1,10})/); // ищем #3333
  if (!sidMatch) return;

  const sid = sidMatch[1];

  const db = readAgents();
  const today = new Date().toISOString().split('T')[0];

  if (!db[sid]) {
    db[sid] = {
      sid,
      discordId: applicantId,
      name: nick,
      rank: 1,
      joinDate: today,
      invitedBySid: null,
      blacklist: false,
      left: null
    };
  } else {
    db[sid].discordId = applicantId;
    db[sid].name = nick;
    if (action === 'unban' || action === 'restore') db[sid].blacklist = false;
    if (action === 'restore' || action === 'accept') db[sid].left = null;
  }

  writeAgents(db);
}

async function handleModerationButton(interaction, client) {
  const member = interaction.member;
  if (!hasStaffRole(member)) {
    return interaction.reply({
      content: 'У тебя нет прав для управления заявками.',
      ephemeral: true
    });
  }

  const action = interaction.customId.replace('appmod_', ''); // take / accept / ...
  const channel = interaction.channel;
  const msg = interaction.message;

  if (!msg.embeds[0]) {
    return interaction.reply({ content: 'Нет данных заявки.', ephemeral: true });
  }

  const embed = EmbedBuilder.from(msg.embeds[0]);
  const fields = embed.data?.fields || [];
  const applicantLine = fields.find(f => f.name === 'Заявитель');
  const applicantId = applicantLine
    ? applicantLine.value.match(/`(\d{17,20})`/)?.[1]
    : null;

  const applicantUser = applicantId
    ? await client.users.fetch(applicantId).catch(() => null)
    : null;

  function updateStatus(text) {
    const newFields = (embed.data?.fields || []).map(f =>
      f.name === 'Статус' ? { ...f, value: text } : f
    );
    embed.setFields(newFields);
  }

  let auditText = '';

  switch (action) {
    case 'take':
      updateStatus(`👀 На рассмотрении: ${interaction.user}`);
      auditText = `🔎 ${interaction.user} взял(а) на рассмотрение заявку в теме ${channel}.`;
      break;

    case 'accept':
      updateStatus(`✅ Принят(а) модератором: ${interaction.user}`);
      auditText = `✅ ${interaction.user} принял(а) заявку ${channel}.`;
      if (applicantUser) {
        applicantUser
          .send(`✅ Ваша заявка **принята**!\nТема: ${channel.url}`)
          .catch(() => null);
      }
      if (applicantId) updateAgentFromApplication(embed, applicantId, 'accept');
      break;

    case 'decline':
      updateStatus(`❌ Отклонён(а) модератором: ${interaction.user}`);
      auditText = `❌ ${interaction.user} отклонил(а) заявку ${channel}.`;
      if (applicantUser) {
        applicantUser
          .send(`❌ Ваша заявка **отклонена**.\nТема: ${channel.url}`)
          .catch(() => null);
      }
      break;

    case 'unban':
      updateStatus(`✅ Снят с ЧС модератором: ${interaction.user}`);
      auditText = `🚫➡✅ ${interaction.user} снял(а) Ч.С. по заявке ${channel}.`;
      if (applicantUser) {
        applicantUser
          .send(`✅ По вашей заявке **снята Ч.С.**\nТема: ${channel.url}`)
          .catch(() => null);
      }
      if (applicantId) updateAgentFromApplication(embed, applicantId, 'unban');
      break;

    case 'restore':
      updateStatus(`✅ Восстановлен(а) модератором: ${interaction.user}`);
      auditText = `♻️ ${interaction.user} восстановил(а) участника по заявке ${channel}.`;
      if (applicantUser) {
        applicantUser
          .send(`✅ Вы были **восстановлены** по заявке.\nТема: ${channel.url}`)
          .catch(() => null);
      }
      if (applicantId) updateAgentFromApplication(embed, applicantId, 'restore');
      break;

    default:
      return interaction.reply({
        content: 'Неизвестное действие.',
        ephemeral: true
      });
  }

  await msg.edit({ embeds: [embed], components: msg.components });
  await interaction.reply({
    content: '✅ Статус заявки обновлён.',
    ephemeral: true
  });

  if (AUDIT_CHANNEL) {
    await sendAudit(client, '📝 Аудит заявок', auditText, [
      applicantUser
        ? { name: 'Заявитель', value: `${applicantUser} / \`${applicantUser.id}\`` }
        : { name: 'Заявитель', value: 'не найден' },
      { name: 'Тема', value: `${channel}` }
    ]);
  }
}

async function handleLeaveButtons(interaction, client) {
  const member = interaction.member;
  if (!hasStaffRole(member)) {
    return interaction.reply({ content: 'Нет прав.', ephemeral: true });
  }

  const isAccept = interaction.customId.startsWith('leave_accept_');
  const sid = interaction.customId.split('_').pop();

  const dbAgent = getAgentBySid(sid);
  if (!dbAgent) {
    return interaction.reply({
      content: 'Агент не найден в базе.',
      ephemeral: true
    });
  }

  const guild = interaction.guild;
  const targetMember = await guild.members.fetch(dbAgent.discordId).catch(() => null);

  if (isAccept) {
    if (targetMember) {
      await targetMember.kick('Увольнение по собственному.').catch(() => null);
    }

    updateAgent(sid, { left: 'Увольнение по собственному' });

    await sendAudit(
      client,
      '🚪 Увольнение по собственному',
      `${interaction.user} одобрил(а) увольнение агента SID #${sid}.`,
      [
        { name: 'SID', value: `#${sid}` },
        { name: 'Discord ID', value: `\`${dbAgent.discordId}\`` }
      ]
    );

    await interaction.update({
      content: '✅ Заявка на увольнение одобрена.',
      components: []
    });
  } else {
    await interaction.update({
      content: '❌ Заявка на увольнение отклонена.',
      components: []
    });
  }
}
