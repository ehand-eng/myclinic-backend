const axios = require('axios');
const Doctor = require('../models/Doctor');
const Dispensary = require('../models/Dispensary');
const TimeSlotConfig = require('../models/TimeSlotConfig');
const AbsentTimeSlot = require('../models/AbsentTimeSlot');
const Booking = require('../models/Booking');
const DoctorDispensary = require('../models/DoctorDispensary');

// ─────────────────────────────────────────────────────────────
// In-memory session store — maps phone number → conversation state
// For production, replace with Redis or MongoDB collection
// ─────────────────────────────────────────────────────────────
const sessions = new Map();

// Session timeout: clear stale sessions after 30 minutes
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

function getSession(phone) {
    const existing = sessions.get(phone);
    if (existing) {
        existing.lastActivity = Date.now();
        return existing;
    }
    const session = { step: 'WELCOME', data: {}, lastActivity: Date.now() };
    sessions.set(phone, session);
    return session;
}

function clearSession(phone) {
    sessions.delete(phone);
}

// Periodically clean up stale sessions (every 10 minutes)
setInterval(() => {
    const now = Date.now();
    for (const [phone, session] of sessions.entries()) {
        if (now - session.lastActivity > SESSION_TIMEOUT_MS) {
            sessions.delete(phone);
            console.log(`🧹 Cleared stale WhatsApp session for ${phone}`);
        }
    }
}, 10 * 60 * 1000);

// ─────────────────────────────────────────────────────────────
// Meta WhatsApp Cloud API helpers
// ─────────────────────────────────────────────────────────────

function getApiUrl() {
    const baseUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v21.0';
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    return `${baseUrl}/${phoneNumberId}/messages`;
}

async function sendMessage(to, payload) {
    try {
        const response = await axios.post(getApiUrl(), {
            messaging_product: 'whatsapp',
            to,
            ...payload
        }, {
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`📤 WhatsApp message sent to ${to}`);
        return response.data;
    } catch (err) {
        console.error('❌ WhatsApp send error:', err.response?.data || err.message);
        throw err;
    }
}

async function sendText(to, text) {
    return sendMessage(to, {
        type: 'text',
        text: { body: text }
    });
}

async function sendList(to, headerText, bodyText, buttonText, sections) {
    return sendMessage(to, {
        type: 'interactive',
        interactive: {
            type: 'list',
            header: { type: 'text', text: headerText },
            body: { text: bodyText },
            action: {
                button: buttonText,
                sections
            }
        }
    });
}

async function sendButtons(to, bodyText, buttons) {
    return sendMessage(to, {
        type: 'interactive',
        interactive: {
            type: 'button',
            body: { text: bodyText },
            action: {
                buttons: buttons.map(b => ({
                    type: 'reply',
                    reply: { id: b.id, title: b.title.substring(0, 20) } // WhatsApp max 20 chars
                }))
            }
        }
    });
}

// ─────────────────────────────────────────────────────────────
// Main message handler — routes to the correct step
// ─────────────────────────────────────────────────────────────

async function handleIncomingMessage(message, metadata) {
    const from = message.from; // Patient's phone number (e.g. "94762199100")
    const session = getSession(from);

    // Extract user input based on message type
    let userInput = '';
    let selectedId = '';

    if (message.type === 'text') {
        userInput = message.text.body.trim();
    } else if (message.type === 'interactive') {
        if (message.interactive.type === 'list_reply') {
            selectedId = message.interactive.list_reply.id;
            userInput = message.interactive.list_reply.title;
        } else if (message.interactive.type === 'button_reply') {
            selectedId = message.interactive.button_reply.id;
            userInput = message.interactive.button_reply.title;
        }
    } else {
        // Ignore unsupported message types (images, stickers, etc.)
        await sendText(from, '⚠️ Please send a text message or select from the options provided.');
        return;
    }

    // Handle global commands at any point
    const lowerInput = userInput.toLowerCase();
    if (lowerInput === 'cancel' || lowerInput === 'restart' || lowerInput === 'menu') {
        clearSession(from);
        const freshSession = getSession(from);
        await handleWelcome(from, freshSession);
        return;
    }

    console.log(`📩 WhatsApp [${from}] step=${session.step} input="${userInput}" id="${selectedId}"`);

    // ─── Conversation State Machine ───
    try {
        switch (session.step) {
            case 'WELCOME':
                await handleWelcome(from, session);
                break;
            case 'SELECT_DOCTOR':
                await handleDoctorSelection(from, session, selectedId, userInput);
                break;
            case 'SELECT_DISPENSARY':
                await handleDispensarySelection(from, session, selectedId);
                break;
            case 'SELECT_DATE':
                await handleDateSelection(from, session, userInput);
                break;
            case 'SELECT_TIMESLOT':
                await handleTimeSlotSelection(from, session, selectedId);
                break;
            case 'ENTER_NAME':
                await handleNameEntry(from, session, userInput);
                break;
            case 'ENTER_PHONE':
                await handlePhoneEntry(from, session, userInput, selectedId);
                break;
            case 'ENTER_PHONE_MANUAL':
                await handleManualPhoneEntry(from, session, userInput);
                break;
            case 'CONFIRM_BOOKING':
                await handleConfirmation(from, session, selectedId);
                break;
            default:
                clearSession(from);
                const freshSession = getSession(from);
                await handleWelcome(from, freshSession);
        }
    } catch (error) {
        console.error(`❌ WhatsApp flow error [${from}]:`, error);
        await sendText(from, '😔 Something went wrong. Please type *menu* to start over.');
        clearSession(from);
    }
}

// ─────────────────────────────────────────────────────────────
// Step Handlers
// ─────────────────────────────────────────────────────────────

async function handleWelcome(from, session) {
    const doctors = await Doctor.find().select('name specialization').limit(10).lean();

    if (doctors.length === 0) {
        await sendText(from, '😔 No doctors are currently available. Please try again later.');
        clearSession(from);
        return;
    }

    session.data.doctorsList = doctors;
    session.step = 'SELECT_DOCTOR';

    const rows = doctors.map(d => ({
        id: `doc_${d._id}`,
        title: d.name.substring(0, 24),
        description: (d.specialization || '').substring(0, 72)
    }));

    await sendList(from,
        '🏥 MyClinic Booking',
        'Welcome to MyClinic! 👋\n\nPlease select a doctor to book an appointment.\n\nType *cancel* at any time to start over.',
        'View Doctors',
        [{ title: 'Available Doctors', rows }]
    );
}

async function handleDoctorSelection(from, session, selectedId, userInput) {
    if (!selectedId || !selectedId.startsWith('doc_')) {
        await sendText(from, '⚠️ Please select a doctor from the list above. Tap *View Doctors* to see the options.');
        return;
    }

    const doctorId = selectedId.replace('doc_', '');
    const doctor = await Doctor.findById(doctorId).select('name specialization').lean();

    if (!doctor) {
        await sendText(from, '⚠️ Doctor not found. Please try again.');
        return;
    }

    session.data.doctorId = doctorId;
    session.data.doctorName = doctor.name;
    session.data.doctorSpecialization = doctor.specialization;

    // Find dispensaries for this doctor
    const dispensaries = await Dispensary.find({ doctors: doctorId })
        .select('name address')
        .lean();

    if (dispensaries.length === 0) {
        await sendText(from, `😔 No dispensaries found for Dr. ${doctor.name}. Type *menu* to try a different doctor.`);
        return;
    }

    // Auto-select if only one dispensary
    if (dispensaries.length === 1) {
        session.data.dispensaryId = dispensaries[0]._id.toString();
        session.data.dispensaryName = dispensaries[0].name;
        session.step = 'SELECT_DATE';

        await sendText(from,
            `✅ *Dr. ${doctor.name}* selected\n` +
            `📍 Dispensary: *${dispensaries[0].name}*\n` +
            `${dispensaries[0].address ? `📌 ${dispensaries[0].address}\n` : ''}` +
            `\n📅 Please enter your preferred date:\n\n` +
            `• Type *today* or *tomorrow*\n` +
            `• Or enter a date like *2025-03-15*`
        );
        return;
    }

    // Show dispensary list
    session.step = 'SELECT_DISPENSARY';
    const rows = dispensaries.map(d => ({
        id: `disp_${d._id}`,
        title: d.name.substring(0, 24),
        description: (d.address || '').substring(0, 72)
    }));

    await sendList(from,
        '📍 Select Dispensary',
        `Dr. ${doctor.name} is available at ${dispensaries.length} locations. Please select one.`,
        'View Locations',
        [{ title: 'Dispensaries', rows }]
    );
}

async function handleDispensarySelection(from, session, selectedId) {
    if (!selectedId || !selectedId.startsWith('disp_')) {
        await sendText(from, '⚠️ Please select a dispensary from the list above.');
        return;
    }

    const dispensaryId = selectedId.replace('disp_', '');
    const dispensary = await Dispensary.findById(dispensaryId).select('name address').lean();

    if (!dispensary) {
        await sendText(from, '⚠️ Dispensary not found. Please try again.');
        return;
    }

    session.data.dispensaryId = dispensaryId;
    session.data.dispensaryName = dispensary.name;
    session.step = 'SELECT_DATE';

    await sendText(from,
        `✅ *${dispensary.name}* selected\n` +
        `${dispensary.address ? `📌 ${dispensary.address}\n` : ''}` +
        `\n📅 Please enter your preferred date:\n\n` +
        `• Type *today* or *tomorrow*\n` +
        `• Or enter a date like *2025-03-15*`
    );
}

async function handleDateSelection(from, session, userInput) {
    // Parse date input
    let bookingDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lowerInput = userInput.toLowerCase();
    if (lowerInput === 'today') {
        bookingDate = new Date(today);
    } else if (lowerInput === 'tomorrow') {
        bookingDate = new Date(today);
        bookingDate.setDate(bookingDate.getDate() + 1);
    } else {
        // Try parsing YYYY-MM-DD or other formats
        bookingDate = new Date(userInput);
    }

    if (isNaN(bookingDate.getTime())) {
        await sendText(from, '⚠️ Could not understand that date. Please enter in *YYYY-MM-DD* format (e.g. *2025-03-15*), or type *today* / *tomorrow*.');
        return;
    }

    if (bookingDate < today) {
        await sendText(from, '⚠️ Cannot book in the past. Please enter a *future date*.');
        return;
    }

    // Check bookingVisibleDays limit
    const doctor = await Doctor.findById(session.data.doctorId).select('bookingVisibleDays').lean();
    const dispensary = await Dispensary.findById(session.data.dispensaryId).select('bookingVisibleDays').lean();

    const doctorDays = doctor?.bookingVisibleDays;
    const dispensaryDays = dispensary?.bookingVisibleDays;
    let maxDays = 30; // default
    if (doctorDays && dispensaryDays) maxDays = Math.min(doctorDays, dispensaryDays);
    else if (doctorDays) maxDays = doctorDays;
    else if (dispensaryDays) maxDays = dispensaryDays;

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + maxDays);

    if (bookingDate > maxDate) {
        await sendText(from, `⚠️ Bookings are only available up to *${maxDays} days* in advance. Please choose an earlier date.`);
        return;
    }

    session.data.bookingDate = bookingDate;
    const dayOfWeek = bookingDate.getDay();
    const { doctorId, dispensaryId } = session.data;

    // Check for absence on this date
    const startOfDay = new Date(bookingDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(bookingDate); endOfDay.setHours(23, 59, 59, 999);

    const absentSlot = await AbsentTimeSlot.findOne({
        doctorId, dispensaryId,
        date: { $gte: startOfDay, $lte: endOfDay }
    }).lean();

    if (absentSlot && !absentSlot.isModifiedSession) {
        await sendText(from, `😔 Doctor is not available on *${bookingDate.toDateString()}*. Please try another date.`);
        return;
    }

    // Find time slot configurations for this day
    const timeSlots = await TimeSlotConfig.find({ doctorId, dispensaryId, dayOfWeek }).lean();

    if (timeSlots.length === 0) {
        await sendText(from, `😔 No sessions available on *${bookingDate.toDateString()}* (${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]}). Please try another date.`);
        return;
    }

    // Check availability for each slot
    const availableSlots = [];
    for (const ts of timeSlots) {
        let maxPatients = ts.maxPatients;

        // If modified session, use modified maxPatients
        if (absentSlot && absentSlot.isModifiedSession) {
            maxPatients = absentSlot.maxPatients || ts.maxPatients;
        }

        const existingCount = await Booking.countDocuments({
            doctorId, dispensaryId,
            bookingDate: { $gte: startOfDay, $lte: endOfDay },
            status: { $ne: 'cancelled' },
            timeSlotConfigId: ts._id
        });

        const remaining = maxPatients - existingCount;
        if (remaining > 0) {
            availableSlots.push({
                ...ts,
                remaining,
                maxPatients
            });
        }
    }

    if (availableSlots.length === 0) {
        await sendText(from, `😔 All appointments on *${bookingDate.toDateString()}* are fully booked. Please try another date.`);
        return;
    }

    // Auto-select if only one time slot
    if (availableSlots.length === 1) {
        const slot = availableSlots[0];
        session.data.timeSlotConfigId = slot._id.toString();
        session.data.timeSlotLabel = `${slot.startTime} - ${slot.endTime}`;
        session.step = 'ENTER_NAME';

        await sendText(from,
            `✅ Date: *${bookingDate.toDateString()}*\n` +
            `🕐 Session: *${slot.startTime} - ${slot.endTime}*\n` +
            `📊 ${slot.remaining} of ${slot.maxPatients} slots available\n\n` +
            `👤 Please enter the *patient name*:`
        );
        return;
    }

    session.data.availableSlots = availableSlots;
    session.step = 'SELECT_TIMESLOT';

    const rows = availableSlots.map(ts => ({
        id: `ts_${ts._id}`,
        title: `${ts.startTime} - ${ts.endTime}`,
        description: `${ts.remaining} of ${ts.maxPatients} slots left`
    }));

    await sendList(from,
        '🕐 Select Time Slot',
        `Available sessions on *${bookingDate.toDateString()}*:`,
        'View Slots',
        [{ title: 'Time Slots', rows }]
    );
}

async function handleTimeSlotSelection(from, session, selectedId) {
    if (!selectedId || !selectedId.startsWith('ts_')) {
        await sendText(from, '⚠️ Please select a time slot from the list above.');
        return;
    }

    const tsId = selectedId.replace('ts_', '');
    const slot = (session.data.availableSlots || []).find(s => s._id.toString() === tsId);

    session.data.timeSlotConfigId = tsId;
    session.data.timeSlotLabel = slot ? `${slot.startTime} - ${slot.endTime}` : 'Selected';
    session.step = 'ENTER_NAME';

    await sendText(from, '👤 Please enter the *patient name*:');
}

async function handleNameEntry(from, session, userInput) {
    if (!userInput || userInput.length < 2) {
        await sendText(from, '⚠️ Please enter a valid name (at least 2 characters).');
        return;
    }

    session.data.patientName = userInput;
    session.step = 'ENTER_PHONE';

    // Offer to use the WhatsApp number
    const formattedPhone = from.startsWith('94') ? `0${from.substring(2)}` : from;

    await sendButtons(from,
        `📱 Use your WhatsApp number (*${formattedPhone}*) as contact?`,
        [
            { id: 'use_wa_phone', title: 'Yes, use this' },
            { id: 'enter_phone', title: 'Enter different' }
        ]
    );
}

async function handlePhoneEntry(from, session, userInput, selectedId) {
    if (selectedId === 'use_wa_phone') {
        session.data.patientPhone = from;
        session.step = 'CONFIRM_BOOKING';
        await showBookingSummary(from, session);
    } else if (selectedId === 'enter_phone') {
        session.step = 'ENTER_PHONE_MANUAL';
        await sendText(from, '📱 Please enter the contact phone number (e.g. *0762199100*):');
    } else {
        // Unexpected input
        await sendText(from, '⚠️ Please tap one of the buttons above.');
    }
}

async function handleManualPhoneEntry(from, session, userInput) {
    const cleanPhone = userInput.replace(/[\s\-()]/g, '');

    // Validate Sri Lankan phone number
    if (!/^(\+94|0)?7\d{8}$/.test(cleanPhone)) {
        await sendText(from, '⚠️ Invalid phone number format. Please enter like: *0762199100* or *+94762199100*');
        return;
    }

    session.data.patientPhone = cleanPhone;
    session.step = 'CONFIRM_BOOKING';
    await showBookingSummary(from, session);
}

async function showBookingSummary(from, session) {
    const { doctorName, doctorSpecialization, dispensaryName, bookingDate, timeSlotLabel, patientName, patientPhone } = session.data;

    const formattedPhone = patientPhone.startsWith('94') ? `0${patientPhone.substring(2)}` : patientPhone;

    const summary = [
        '📋 *Booking Summary*',
        '',
        `👨‍⚕️ Doctor: *${doctorName}* (${doctorSpecialization || 'General'})`,
        `📍 Dispensary: *${dispensaryName}*`,
        `📅 Date: *${new Date(bookingDate).toDateString()}*`,
        `🕐 Session: *${timeSlotLabel}*`,
        `👤 Patient: *${patientName}*`,
        `📱 Phone: *${formattedPhone}*`,
        '',
        'Would you like to confirm this booking?'
    ].join('\n');

    await sendButtons(from, summary, [
        { id: 'confirm_booking', title: '✅ Confirm' },
        { id: 'cancel_booking', title: '❌ Cancel' }
    ]);
}

async function handleConfirmation(from, session, selectedId) {
    if (selectedId === 'cancel_booking') {
        clearSession(from);
        await sendText(from, '❌ Booking cancelled. Type *menu* to start a new booking.');
        return;
    }

    if (selectedId !== 'confirm_booking') {
        await sendText(from, '⚠️ Please tap *Confirm* or *Cancel*.');
        return;
    }

    const { doctorId, dispensaryId, bookingDate, patientName, patientPhone, timeSlotConfigId } = session.data;

    // Fetch the time slot config
    const timeSlotConfig = await TimeSlotConfig.findById(timeSlotConfigId).lean();
    if (!timeSlotConfig) {
        await sendText(from, '😔 Time slot is no longer available. Type *menu* to start over.');
        clearSession(from);
        return;
    }

    const startOfDay = new Date(bookingDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(bookingDate); endOfDay.setHours(23, 59, 59, 999);

    // Check for modified session
    const absentSlot = await AbsentTimeSlot.findOne({
        doctorId, dispensaryId,
        date: { $gte: startOfDay, $lte: endOfDay }
    }).lean();

    let startTime, maxPatients, minutesPerPatient;

    if (absentSlot && absentSlot.isModifiedSession) {
        startTime = absentSlot.startTime;
        maxPatients = absentSlot.maxPatients || timeSlotConfig.maxPatients;
        minutesPerPatient = absentSlot.minutesPerPatient || timeSlotConfig.minutesPerPatient || 15;
    } else {
        startTime = timeSlotConfig.startTime;
        maxPatients = timeSlotConfig.maxPatients;
        minutesPerPatient = timeSlotConfig.minutesPerPatient || 15;
    }

    // Check availability again (race condition protection)
    const existingBookings = await Booking.find({
        doctorId, dispensaryId,
        bookingDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: 'cancelled' }
    }).lean();

    if (existingBookings.length >= maxPatients) {
        await sendText(from, '😔 Sorry, all appointments are now booked for this date. Type *menu* to try another date.');
        clearSession(from);
        return;
    }

    // Find next available appointment number
    const bookedNums = new Set(existingBookings.map(b => b.appointmentNumber));
    let nextNum = 1;
    while (bookedNums.has(nextNum) && nextNum <= maxPatients) {
        nextNum++;
    }

    // Calculate estimated time
    const [startH, startM] = startTime.split(':').map(Number);
    const offset = (nextNum - 1) * minutesPerPatient;
    const estDate = new Date(bookingDate);
    estDate.setHours(startH, startM + offset, 0, 0);
    const estimatedTime = `${String(estDate.getHours()).padStart(2, '0')}:${String(estDate.getMinutes()).padStart(2, '0')}`;

    // Calculate time slot range
    const endEst = new Date(estDate);
    endEst.setMinutes(endEst.getMinutes() + minutesPerPatient);
    const timeSlot = `${estimatedTime}-${String(endEst.getHours()).padStart(2, '0')}:${String(endEst.getMinutes()).padStart(2, '0')}`;

    // Generate transaction ID
    const transactionId = `TRX-WA-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // Get fee configuration
    let fees = {};
    try {
        const feeConfig = await DoctorDispensary.findOne({
            doctorId, dispensaryId, isActive: true
        }).lean();

        if (feeConfig) {
            fees = {
                doctorFee: feeConfig.doctorFee || 0,
                dispensaryFee: feeConfig.dispensaryFee || 0,
                bookingCommission: feeConfig.bookingCommission || 0,
                channelPartnerFee: 0,
                totalFee: (feeConfig.doctorFee || 0) + (feeConfig.dispensaryFee || 0) + (feeConfig.bookingCommission || 0)
            };
        }
    } catch (feeErr) {
        console.warn('Could not load fee config for WhatsApp booking:', feeErr.message);
    }

    // Create the booking
    const booking = new Booking({
        patientId: `wa-${patientPhone}`,
        doctorId,
        dispensaryId,
        bookingDate: new Date(bookingDate),
        timeSlot,
        timeSlotConfigId: timeSlotConfig._id,
        appointmentNumber: nextNum,
        estimatedTime,
        status: 'scheduled',
        symptoms: undefined,
        isPaid: false,
        isPatientVisited: false,
        patientName,
        patientPhone,
        transactionId,
        fees: Object.keys(fees).length > 0 ? fees : undefined,
        bookedUser: 'whatsapp',
        bookedBy: 'WHATSAPP',
        paymentMethod: 'cash',
        paymentStatus: 'not_required',
        smsDelivery: {
            status: 'pending',
            lastUpdated: new Date()
        }
    });

    await booking.save();
    console.log(`✅ WhatsApp booking created: ${transactionId} for ${patientName}`);

    // Send confirmation
    const feeText = fees.totalFee ? `\n💰 Fee: *Rs. ${fees.totalFee}*` : '';
    const confirmation = [
        '✅ *Booking Confirmed!*',
        '',
        `🎫 Reference: *${transactionId}*`,
        `📌 Appointment #*${nextNum}*`,
        `👨‍⚕️ Dr. *${session.data.doctorName}*`,
        `📍 *${session.data.dispensaryName}*`,
        `📅 *${new Date(bookingDate).toDateString()}*`,
        `🕐 Estimated Time: *${estimatedTime}*`,
        feeText,
        '',
        'Thank you for booking with MyClinic! 🙏',
        '',
        'Type *menu* to make another booking.'
    ].join('\n');

    await sendText(from, confirmation);
    clearSession(from);
}

module.exports = { handleIncomingMessage };
