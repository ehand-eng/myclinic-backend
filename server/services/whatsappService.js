const axios = require('axios');
const Doctor = require('../models/Doctor');
const Dispensary = require('../models/Dispensary');
const TimeSlotConfig = require('../models/TimeSlotConfig');
const AbsentTimeSlot = require('../models/AbsentTimeSlot');
const Booking = require('../models/Booking');
const DoctorDispensary = require('../models/DoctorDispensary');
const { t, formatDate, formatDateWithDay, to12Hr, formatTimeRange } = require('./whatsappTranslations');

// ─────────────────────────────────────────────────────────────
// In-memory session store — maps phone number → conversation state
// For production, replace with Redis or MongoDB collection
// ─────────────────────────────────────────────────────────────
const sessions = new Map();
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

// Clean stale sessions every 10 minutes
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
    return sendMessage(to, { type: 'text', text: { body: text } });
}

async function sendList(to, headerText, bodyText, buttonText, sections) {
    return sendMessage(to, {
        type: 'interactive',
        interactive: {
            type: 'list',
            header: { type: 'text', text: headerText },
            body: { text: bodyText },
            action: { button: buttonText, sections }
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
                    reply: { id: b.id, title: b.title.substring(0, 20) }
                }))
            }
        }
    });
}

// ─────────────────────────────────────────────────────────────
// Helper: get session language (default English)
// ─────────────────────────────────────────────────────────────
function lang(session) {
    return session.data.lang || 'en';
}

// ─────────────────────────────────────────────────────────────
// Main message handler
// ─────────────────────────────────────────────────────────────

async function handleIncomingMessage(message, metadata) {
    const from = message.from;
    const session = getSession(from);
    const l = lang(session);

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
        await sendText(from, t(l, 'unsupported_message'));
        return;
    }

    // Global commands
    const lowerInput = userInput.toLowerCase();
    if (lowerInput === 'cancel' || lowerInput === 'restart' || lowerInput === 'menu') {
        clearSession(from);
        const freshSession = getSession(from);
        await handleWelcome(from, freshSession);
        return;
    }

    // ─────────────────────────────────────────────────────────────
    // Shortcode Intercept (e.g., A001)
    // ─────────────────────────────────────────────────────────────
    if (userInput && userInput.trim().length === 4) {
        const codeMatch = userInput.trim().toUpperCase().match(/^[A-Z][0-9]{3}$/);
        if (codeMatch) {
            const shortcode = codeMatch[0];
            const dispensary = await Dispensary.findOne({ dispensaryCode: shortcode }).lean();
            
            if (dispensary) {
                // Start a fresh session with the shortcut context
                clearSession(from);
                const freshSession = getSession(from);
                
                freshSession.data.isShortcutCode = true;
                freshSession.data.shortcutDispensary = dispensary;
                
                console.log(`🚀 Shortcut activated: ${shortcode} for ${dispensary.name}`);
                await handleWelcome(from, freshSession);
                return;
            } else {
                await sendText(from, t(lang(session), 'code_not_recognized'));
                // Just return, letting them continue what they were doing or try again
                return;
            }
        }
    }

    console.log(`📩 WhatsApp [${from}] step=${session.step} lang=${l} input="${userInput}" id="${selectedId}"`);

    try {
        switch (session.step) {
            case 'WELCOME':
                await handleWelcome(from, session);
                break;
            case 'SELECT_LANGUAGE':
                await handleLanguageSelection(from, session, selectedId);
                break;
            case 'SELECT_DOCTOR':
                await handleDoctorSelection(from, session, selectedId);
                break;
            case 'SELECT_DISPENSARY':
                await handleDispensarySelection(from, session, selectedId);
                break;
            case 'SELECT_APPOINTMENT':
                await handleAppointmentSelection(from, session, selectedId);
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
        await sendText(from, t(lang(session), 'error_generic'));
        clearSession(from);
    }
}

// ─────────────────────────────────────────────────────────────
// Step 1: Welcome — show language selection
// ─────────────────────────────────────────────────────────────

async function handleWelcome(from, session) {
    session.step = 'SELECT_LANGUAGE';

    await sendList(from,
        '🏥 MyClinic',
        'Welcome to MyClinic! 👋\nMyClinic වෙත සාදරයෙන් පිළිගනිමු!\nMyClinic க்கு வரவேற்கிறோம்!\n\nPlease select your language.\nකරුණාකර ඔබේ භාෂාව තෝරන්න.\nஉங்கள் மொழியைத் தேர்வு செய்யவும்.',
        'Select Language',
        [{
            title: 'Language / භාෂාව / மொழி',
            rows: [
                { id: 'lang_si', title: 'සිංහල', description: 'Sinhala' },
                { id: 'lang_en', title: 'English', description: 'English' },
                { id: 'lang_ta', title: 'தமிழ்', description: 'Tamil' }
            ]
        }]
    );
}

// ─────────────────────────────────────────────────────────────
// Step 2: Language selected → show doctor list
// ─────────────────────────────────────────────────────────────

async function handleLanguageSelection(from, session, selectedId) {
    const langMap = { lang_si: 'si', lang_en: 'en', lang_ta: 'ta' };
    const selectedLang = langMap[selectedId];

    if (!selectedLang) {
        await sendText(from, 'Please select a language from the list above.');
        return;
    }

    session.data.lang = selectedLang;
    const l = selectedLang;

    // --- SHORTCUT FLOW ---
    if (session.data.isShortcutCode) {
        const dispensary = session.data.shortcutDispensary;
        session.data.dispensaryId = dispensary._id.toString();
        session.data.dispensaryName = dispensary.name;

        if (!dispensary.doctors || dispensary.doctors.length === 0) {
            await sendText(from, t(l, 'no_doctors_shortcut'));
            clearSession(from);
            return;
        }

        if (dispensary.doctors.length === 1) {
            const doctorId = dispensary.doctors[0].toString();
            const doctor = await Doctor.findById(doctorId).select('name specialization').lean();
            if (doctor) {
                // Auto-select doctor and proceed to appointments
                session.data.doctorId = doctorId;
                session.data.doctorName = doctor.name;
                session.data.doctorSpecialization = doctor.specialization;
                await showAvailableAppointments(from, session);
                return;
            }
        }

        // Multiple doctors at this dispensary: show filtered list
        const doctors = await Doctor.find({ _id: { $in: dispensary.doctors } }).select('name specialization').lean();
        
        if (doctors.length === 0) {
           await sendText(from, t(l, 'no_doctors_shortcut'));
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
            t(l, 'select_doctor_header'),
            `${t(l, 'shortcut_dispensary_selected')} *${dispensary.name}*.\n\n${t(l, 'select_doctor_body')}${t(l, 'cancel_hint')}`,
            t(l, 'view_doctors_btn'),
            [{ title: t(l, 'doctors_section_title'), rows }]
        );
        return;
    }
    // --- END SHORTCUT FLOW ---

    // Load doctors for normal flow
    const doctors = await Doctor.find().select('name specialization').limit(10).lean();

    if (doctors.length === 0) {
        await sendText(from, t(l, 'no_doctors'));
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
        t(l, 'select_doctor_header'),
        t(l, 'select_doctor_body') + t(l, 'cancel_hint'),
        t(l, 'view_doctors_btn'),
        [{ title: t(l, 'doctors_section_title'), rows }]
    );
}

// ─────────────────────────────────────────────────────────────
// Step 3: Doctor selected → show dispensaries (or auto-select)
// ─────────────────────────────────────────────────────────────

async function handleDoctorSelection(from, session, selectedId) {
    const l = lang(session);

    if (!selectedId || !selectedId.startsWith('doc_')) {
        await sendText(from, t(l, 'invalid_doctor'));
        return;
    }

    const doctorId = selectedId.replace('doc_', '');
    const doctor = await Doctor.findById(doctorId).select('name specialization').lean();

    if (!doctor) {
        await sendText(from, t(l, 'doctor_not_found'));
        return;
    }

    session.data.doctorId = doctorId;
    session.data.doctorName = doctor.name;
    session.data.doctorSpecialization = doctor.specialization;

    if (session.data.isShortcutCode && session.data.dispensaryId) {
        // Skip dispensary selection because we already know it!
        await showAvailableAppointments(from, session);
        return;
    }

    const dispensaries = await Dispensary.find({ doctors: doctorId }).select('name address').lean();

    if (dispensaries.length === 0) {
        await sendText(from, t(l, 'no_dispensaries'));
        return;
    }

    // Auto-select if single dispensary → go to appointment slots
    if (dispensaries.length === 1) {
        session.data.dispensaryId = dispensaries[0]._id.toString();
        session.data.dispensaryName = dispensaries[0].name;
        await showAvailableAppointments(from, session);
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
        t(l, 'select_dispensary_header'),
        t(l, 'select_dispensary_body'),
        t(l, 'view_locations_btn'),
        [{ title: t(l, 'dispensaries_section_title'), rows }]
    );
}

// ─────────────────────────────────────────────────────────────
// Step 4: Dispensary selected → show appointment slots
// ─────────────────────────────────────────────────────────────

async function handleDispensarySelection(from, session, selectedId) {
    const l = lang(session);

    if (!selectedId || !selectedId.startsWith('disp_')) {
        await sendText(from, t(l, 'invalid_dispensary'));
        return;
    }

    const dispensaryId = selectedId.replace('disp_', '');
    const dispensary = await Dispensary.findById(dispensaryId).select('name address').lean();

    if (!dispensary) {
        await sendText(from, t(l, 'invalid_dispensary'));
        return;
    }

    session.data.dispensaryId = dispensaryId;
    session.data.dispensaryName = dispensary.name;
    await showAvailableAppointments(from, session);
}

// ─────────────────────────────────────────────────────────────
// Combined Appointment Slot Scanner
// Scans across all dates within bookingVisibleDays and returns
// up to 10 available "date + session + next appointment#" slots
// ─────────────────────────────────────────────────────────────

async function showAvailableAppointments(from, session) {
    const l = lang(session);
    const { doctorId, dispensaryId } = session.data;

    // Determine max days to scan
    const doctor = await Doctor.findById(doctorId).select('bookingVisibleDays').lean();
    const dispensary = await Dispensary.findById(dispensaryId).select('bookingVisibleDays').lean();

    // Doctor value wins when explicitly set; fallback to dispensary, then 30
    const doctorDays = doctor?.bookingVisibleDays;
    const dispensaryDays = dispensary?.bookingVisibleDays;
    let maxDays = doctorDays ?? dispensaryDays ?? 30;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const availableSlots = [];
    const MAX_SLOTS = 10; // WhatsApp list row limit

    // Scan each day within range
    for (let dayOffset = 0; dayOffset < maxDays && availableSlots.length < MAX_SLOTS; dayOffset++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + dayOffset);
        const dayOfWeek = currentDate.getDay();

        const startOfDay = new Date(currentDate); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(currentDate); endOfDay.setHours(23, 59, 59, 999);

        // Check if doctor is absent on this date
        const absentSlot = await AbsentTimeSlot.findOne({
            doctorId, dispensaryId,
            date: { $gte: startOfDay, $lte: endOfDay }
        }).lean();

        if (absentSlot && !absentSlot.isModifiedSession) continue; // Skip absent days

        // Get time slot configs for this day of week
        const timeSlots = await TimeSlotConfig.find({ doctorId, dispensaryId, dayOfWeek }).lean();
        if (timeSlots.length === 0) continue;

        for (const ts of timeSlots) {
            if (availableSlots.length >= MAX_SLOTS) break;

            let maxPatients = ts.maxPatients;
            let startTime = ts.startTime;
            let minutesPerPatient = ts.minutesPerPatient || 15;

            // Use modified session params if applicable
            if (absentSlot && absentSlot.isModifiedSession) {
                maxPatients = absentSlot.maxPatients || ts.maxPatients;
                startTime = absentSlot.startTime || ts.startTime;
                minutesPerPatient = absentSlot.minutesPerPatient || ts.minutesPerPatient || 15;
            }

            // Count existing bookings for this session
            const existingBookings = await Booking.find({
                doctorId, dispensaryId,
                bookingDate: { $gte: startOfDay, $lte: endOfDay },
                status: { $ne: 'cancelled' },
                timeSlotConfigId: ts._id
            }).select('appointmentNumber').lean();

            const bookedCount = existingBookings.length;
            if (bookedCount >= maxPatients) continue; // Fully booked

            // Find next appointment number
            const bookedNums = new Set(existingBookings.map(b => b.appointmentNumber));
            let nextNum = 1;
            while (bookedNums.has(nextNum) && nextNum <= maxPatients) nextNum++;

            // Calculate estimated time for this appointment number
            // Same formula as /available API: startTime + (appointmentNumber - 1) * minutesPerPatient
            const [sH, sM] = startTime.split(':').map(Number);
            const apptOffset = (nextNum - 1) * minutesPerPatient;
            const apptDate = new Date(currentDate);
            apptDate.setHours(sH, sM + apptOffset, 0, 0);
            const estHH = String(apptDate.getHours()).padStart(2, '0');
            const estMM = String(apptDate.getMinutes()).padStart(2, '0');
            const estimatedTime = `${estHH}:${estMM}`;

            // Calculate time slot range (e.g. "18:20-18:40")
            const apptEndDate = new Date(apptDate);
            apptEndDate.setMinutes(apptEndDate.getMinutes() + minutesPerPatient);
            const endHH = String(apptEndDate.getHours()).padStart(2, '0');
            const endMM = String(apptEndDate.getMinutes()).padStart(2, '0');
            const slotTimeSlot = `${estHH}:${estMM}-${endHH}:${endMM}`;

            availableSlots.push({
                date: new Date(currentDate),
                timeSlotConfigId: ts._id.toString(),
                startTime,
                endTime: ts.endTime,
                maxPatients,
                minutesPerPatient,
                nextAppointmentNumber: nextNum,
                remaining: maxPatients - bookedCount,
                estimatedTime,
                slotTimeSlot
            });
        }
    }

    if (availableSlots.length === 0) {
        await sendText(from, t(l, 'no_appointments'));
        return;
    }

    // Store slots in session for lookup on selection
    session.data.availableSlots = availableSlots;
    session.step = 'SELECT_APPOINTMENT';

    // Build list rows: "14 March – 6:20 PM – #05"
    const rows = availableSlots.map((slot, idx) => {
        const dateStr = formatDate(slot.date, l);
        const timeStr = to12Hr(slot.estimatedTime);
        const apptLabel = `#${String(slot.nextAppointmentNumber).padStart(2, '0')}`;

        return {
            id: `appt_${idx}`,
            title: `${dateStr} – ${timeStr}`.substring(0, 24),
            description: `${t(l, 'next_appointment')} ${apptLabel} (${slot.slotTimeSlot})`.substring(0, 72)
        };
    });

    await sendList(from,
        t(l, 'select_appointment_header'),
        `👨‍⚕️ *${session.data.doctorName}*\n📍 *${session.data.dispensaryName}*\n\n${t(l, 'select_appointment_body')}`,
        t(l, 'view_appointments_btn'),
        [{ title: t(l, 'appointments_section_title'), rows }]
    );
}

// ─────────────────────────────────────────────────────────────
// Step 5: Appointment selected → enter patient name
// ─────────────────────────────────────────────────────────────

async function handleAppointmentSelection(from, session, selectedId) {
    const l = lang(session);

    if (!selectedId || !selectedId.startsWith('appt_')) {
        await sendText(from, t(l, 'invalid_appointment'));
        return;
    }

    const idx = parseInt(selectedId.replace('appt_', ''), 10);
    const slot = (session.data.availableSlots || [])[idx];

    if (!slot) {
        await sendText(from, t(l, 'invalid_appointment'));
        return;
    }

    // Store selected slot data
    session.data.bookingDate = slot.date;
    session.data.timeSlotConfigId = slot.timeSlotConfigId;
    session.data.startTime = slot.startTime;
    session.data.endTime = slot.endTime;
    session.data.maxPatients = slot.maxPatients;
    session.data.minutesPerPatient = slot.minutesPerPatient;
    session.data.nextAppointmentNumber = slot.nextAppointmentNumber;
    session.data.estimatedTime = slot.estimatedTime;
    session.data.slotTimeSlot = slot.slotTimeSlot;
    session.data.timeSlotLabel = formatTimeRange(slot.startTime, slot.endTime);

    session.step = 'ENTER_NAME';

    const dateStr = formatDateWithDay(slot.date, l);
    const timeStr = to12Hr(slot.estimatedTime);

    await sendText(from,
        `✅ ${t(l, 'date_label')}: *${dateStr}*\n` +
        `🕐 ${t(l, 'time_label')}: *${timeStr}*\n` +
        `📌 ${t(l, 'appointment_label')}: *#${String(slot.nextAppointmentNumber).padStart(2, '0')}*\n` +
        `🔖 ${slot.slotTimeSlot}\n\n` +
        t(l, 'enter_name')
    );
}

// ─────────────────────────────────────────────────────────────
// Step 6: Enter patient name
// ─────────────────────────────────────────────────────────────

async function handleNameEntry(from, session, userInput) {
    const l = lang(session);

    if (!userInput || userInput.length < 2) {
        await sendText(from, t(l, 'invalid_name'));
        return;
    }

    session.data.patientName = userInput;
    session.step = 'ENTER_PHONE';

    const formattedPhone = from.startsWith('94') ? `0${from.substring(2)}` : from;

    await sendButtons(from,
        `📱 ${t(l, 'use_wa_phone')}\n\n*${formattedPhone}*`,
        [
            { id: 'use_wa_phone', title: t(l, 'yes_use_this') },
            { id: 'enter_phone', title: t(l, 'enter_different') }
        ]
    );
}

// ─────────────────────────────────────────────────────────────
// Step 7: Phone number selection
// ─────────────────────────────────────────────────────────────

async function handlePhoneEntry(from, session, userInput, selectedId) {
    const l = lang(session);

    if (selectedId === 'use_wa_phone') {
        session.data.patientPhone = from;
        session.step = 'CONFIRM_BOOKING';
        await showBookingSummary(from, session);
    } else if (selectedId === 'enter_phone') {
        session.step = 'ENTER_PHONE_MANUAL';
        await sendText(from, t(l, 'enter_phone_manual'));
    } else {
        await sendText(from, t(l, 'tap_button'));
    }
}

async function handleManualPhoneEntry(from, session, userInput) {
    const l = lang(session);
    const cleanPhone = userInput.replace(/[\s\-()]/g, '');

    if (!/^(\+94|0)?7\d{8}$/.test(cleanPhone)) {
        await sendText(from, t(l, 'invalid_phone'));
        return;
    }

    session.data.patientPhone = cleanPhone;
    session.step = 'CONFIRM_BOOKING';
    await showBookingSummary(from, session);
}

// ─────────────────────────────────────────────────────────────
// Step 8: Show booking summary for confirmation
// ─────────────────────────────────────────────────────────────

async function showBookingSummary(from, session) {
    const l = lang(session);
    const d = session.data;
    const formattedPhone = d.patientPhone.startsWith('94') ? `0${d.patientPhone.substring(2)}` : d.patientPhone;
    const dateStr = formatDateWithDay(d.bookingDate, l);
    const timeStr = to12Hr(d.estimatedTime || d.startTime);
    const apptNum = `#${String(d.nextAppointmentNumber).padStart(2, '0')}`;

    const summary = [
        t(l, 'booking_summary'),
        '',
        `👨‍⚕️ ${t(l, 'doctor_label')}: *${d.doctorName}* (${d.doctorSpecialization || ''})`,
        `📍 ${t(l, 'dispensary_label')}: *${d.dispensaryName}*`,
        `📅 ${t(l, 'date_label')}: *${dateStr}*`,
        `🕐 ${t(l, 'time_label')}: *${timeStr}*`,
        `🔖 ${d.slotTimeSlot || ''}`,
        `📌 ${t(l, 'appointment_label')}: *${apptNum}*`,
        `👤 ${t(l, 'patient_label')}: *${d.patientName}*`,
        `📱 ${t(l, 'phone_label')}: *${formattedPhone}*`,
        '',
        t(l, 'confirm_question')
    ].join('\n');

    await sendButtons(from, summary, [
        { id: 'confirm_booking', title: t(l, 'confirm_btn') },
        { id: 'cancel_booking', title: t(l, 'cancel_btn') }
    ]);
}

// ─────────────────────────────────────────────────────────────
// Step 9: Confirmation → create booking
// ─────────────────────────────────────────────────────────────

async function handleConfirmation(from, session, selectedId) {
    const l = lang(session);

    if (selectedId === 'cancel_booking') {
        clearSession(from);
        await sendText(from, t(l, 'booking_cancelled'));
        return;
    }

    if (selectedId !== 'confirm_booking') {
        await sendText(from, t(l, 'tap_confirm_or_cancel'));
        return;
    }

    const d = session.data;
    const { doctorId, dispensaryId, bookingDate, patientName, patientPhone, timeSlotConfigId } = d;

    // Fetch time slot config
    const timeSlotConfig = await TimeSlotConfig.findById(timeSlotConfigId).lean();
    if (!timeSlotConfig) {
        await sendText(from, t(l, 'slot_unavailable'));
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

    let startTime = d.startTime || timeSlotConfig.startTime;
    let maxPatients = d.maxPatients || timeSlotConfig.maxPatients;
    let minutesPerPatient = d.minutesPerPatient || timeSlotConfig.minutesPerPatient || 15;

    if (absentSlot && absentSlot.isModifiedSession) {
        startTime = absentSlot.startTime || startTime;
        maxPatients = absentSlot.maxPatients || maxPatients;
        minutesPerPatient = absentSlot.minutesPerPatient || minutesPerPatient;
    }

    // Race condition check — re-verify availability
    const existingBookings = await Booking.find({
        doctorId, dispensaryId,
        bookingDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: 'cancelled' }
    }).lean();

    if (existingBookings.length >= maxPatients) {
        await sendText(from, t(l, 'slots_full'));
        clearSession(from);
        return;
    }

    // Find next available appointment number (recalculate for accuracy)
    const bookedNums = new Set(existingBookings.map(b => b.appointmentNumber));
    let nextNum = 1;
    while (bookedNums.has(nextNum) && nextNum <= maxPatients) nextNum++;

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
    console.log(`✅ WhatsApp booking created: ${transactionId} for ${patientName} [${l}]`);

    // Send localized confirmation
    const dateStr = formatDateWithDay(bookingDate, l);
    const feeText = fees.totalFee ? `\n💰 ${t(l, 'fee_label')}: *Rs. ${fees.totalFee}*` : '';

    const confirmation = [
        t(l, 'booking_confirmed'),
        '',
        `🎫 ${t(l, 'reference_label')}: *${transactionId}*`,
        `📌 ${t(l, 'appointment_label')}: *#${String(nextNum).padStart(2, '0')}*`,
        `👨‍⚕️ ${t(l, 'doctor_label')}: *${d.doctorName}*`,
        `📍 ${t(l, 'dispensary_label')}: *${d.dispensaryName}*`,
        `📅 ${t(l, 'date_label')}: *${dateStr}*`,
        `🕐 ${t(l, 'estimated_time_label')}: *${to12Hr(estimatedTime)}*`,
        feeText,
        '',
        t(l, 'thank_you'),
        '',
        t(l, 'type_menu')
    ].join('\n');

    await sendText(from, confirmation);
    clearSession(from);
}

module.exports = { handleIncomingMessage };
