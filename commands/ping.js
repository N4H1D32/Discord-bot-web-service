module.exports = {
    name: 'ping',
    description: 'Gecikmə müddətini göstərir',
    prefixRequired: true,
    execute(message, args) {
        return message.channel.send(`Pong!  Sürət: ${message.client.ws.ping}ms`);
    }
};