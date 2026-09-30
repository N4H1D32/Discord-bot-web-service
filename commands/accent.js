module.exports = {
    name: 'accent',
    description: 'Bot haqqında məlumat',
    prefixRequired: true,
    execute(message, args) {
        return message.channel.send('Hyundai Accent aktivdir!');
    }
};