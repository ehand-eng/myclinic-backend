const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');

// Webhook verification (GET) — Meta calls this once during setup
router.get('/webhook', (req, res) => {
    console.log("ssssssss +++++++++++ whatsapp webhook");
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === "myclinic_whatsapp_token") {
        console.log('✅ WhatsApp webhook verified');
        return res.status(200).send(challenge);
    }

    console.warn('❌ WhatsApp webhook verification failed');
    return res.sendStatus(403);
});

// Incoming messages (POST) — Meta sends all WhatsApp messages here
router.post('/webhook', async (req, res) => {
    // Always respond 200 immediately — Meta requires acknowledgment within 5 seconds
    res.sendStatus(200);

    try {
        const body = req.body;

        if (body.object !== 'whatsapp_business_account') return;

        const entries = body.entry || [];
        for (const entry of entries) {
            const changes = entry.changes || [];
            for (const change of changes) {
                const value = change.value;
                if (!value.messages) continue;

                for (const message of value.messages) {
                    await whatsappService.handleIncomingMessage(message, value.metadata);
                }
            }
        }
    } catch (error) {
        console.error('❌ Error processing WhatsApp message:', error);
    }
});

module.exports = router;
