// ─────────────────────────────────────────────────────────────
// WhatsApp Booking Flow — Multi-Language Translations
// Supports: English (en), Sinhala (si), Tamil (ta)
// ─────────────────────────────────────────────────────────────

const translations = {
    // ─── Language Selection ───
    welcome_header: {
        en: '🏥 MyClinic Booking',
        si: '🏥 MyClinic වෙන්කිරීම',
        ta: '🏥 MyClinic முன்பதிவு'
    },
    welcome_body: {
        en: 'Welcome to MyClinic! 👋\nPlease select your preferred language.',
        si: 'MyClinic වෙත සාදරයෙන් පිළිගනිමු! 👋\nකරුණාකර ඔබේ භාෂාව තෝරන්න.',
        ta: 'MyClinic க்கு வரவேற்கிறோம்! 👋\nஉங்கள் மொழியைத் தேர்வு செய்யவும்.'
    },
    select_language_btn: {
        en: 'Select Language',
        si: 'භාෂාව තෝරන්න',
        ta: 'மொழியைத் தேர்வுசெய்'
    },
    cancel_hint: {
        en: '\n\nType *cancel* at any time to start over.',
        si: '\n\nඕනෑම වේලාවක *cancel* ටයිප් කර නැවත ආරම්භ කරන්න.',
        ta: '\n\nஎப்போது வேண்டுமானாலும் *cancel* என தட்டச்சு செய்து மீண்டும் தொடங்கவும்.'
    },

    // ─── Doctor Selection ───
    select_doctor_header: {
        en: '👨‍⚕️ Select Doctor',
        si: '👨‍⚕️ වෛද්‍යවරයා තෝරන්න',
        ta: '👨‍⚕️ மருத்துவரைத் தேர்வுசெய்'
    },
    select_doctor_body: {
        en: 'Please select a doctor to book an appointment.',
        si: 'හමුවීමක් වෙන්කරගැනීමට වෛද්‍යවරයකු තෝරන්න.',
        ta: 'சந்திப்பை முன்பதிவு செய்ய மருத்துவரைத் தேர்வு செய்யவும்.'
    },
    view_doctors_btn: {
        en: 'View Doctors',
        si: 'වෛද්‍යවරුන් බලන්න',
        ta: 'மருத்துவர்களைப் பார்'
    },
    doctors_section_title: {
        en: 'Available Doctors',
        si: 'සිටින වෛද්‍යවරුන්',
        ta: 'கிடைக்கும் மருத்துவர்கள்'
    },
    no_doctors: {
        en: '😔 No doctors are currently available. Please try again later.',
        si: '😔 දැනට වෛද්‍යවරුන් නැත. කරුණාකර පසුව උත්සාහ කරන්න.',
        ta: '😔 தற்போது மருத்துவர்கள் இல்லை. பின்னர் முயற்சிக்கவும்.'
    },
    invalid_doctor: {
        en: '⚠️ Please select a doctor from the list. Tap *View Doctors* to see options.',
        si: '⚠️ ලැයිස්තුවෙන් වෛද්‍යවරයකු තෝරන්න.',
        ta: '⚠️ பட்டியலிலிருந்து ஒரு மருத்துவரைத் தேர்வு செய்யவும்.'
    },
    doctor_not_found: {
        en: '⚠️ Doctor not found. Please try again.',
        si: '⚠️ වෛද්‍යවරයා හමු නොවීය. නැවත උත්සාහ කරන්න.',
        ta: '⚠️ மருத்துவர் கிடைக்கவில்லை. மீண்டும் முயற்சிக்கவும்.'
    },

    // ─── Dispensary Selection ───
    select_dispensary_header: {
        en: '📍 Select Dispensary',
        si: '📍 බෙහෙත් ශාලාව තෝරන්න',
        ta: '📍 மருந்தகத்தைத் தேர்வுசெய்'
    },
    select_dispensary_body: {
        en: 'This doctor is available at multiple locations. Please select one.',
        si: 'මෙම වෛද්‍යවරයා ස්ථාන කිහිපයක සිටී. එකක් තෝරන්න.',
        ta: 'இந்த மருத்துவர் பல இடங்களில் கிடைக்கிறார். ஒன்றைத் தேர்வு செய்யவும்.'
    },
    view_locations_btn: {
        en: 'View Locations',
        si: 'ස්ථාන බලන්න',
        ta: 'இடங்களைப் பார்'
    },
    dispensaries_section_title: {
        en: 'Dispensaries',
        si: 'බෙහෙත් ශාලා',
        ta: 'மருந்தகங்கள்'
    },
    no_dispensaries: {
        en: '😔 No dispensaries found for this doctor. Type *menu* to try another.',
        si: '😔 මෙම වෛද්‍යවරයාට බෙහෙත් ශාලා නැත. *menu* ටයිප් කරන්න.',
        ta: '😔 இந்த மருத்துவருக்கு மருந்தகங்கள் இல்லை. *menu* என தட்டச்சு செய்யவும்.'
    },
    invalid_dispensary: {
        en: '⚠️ Please select a dispensary from the list.',
        si: '⚠️ ලැයිස්තුවෙන් බෙහෙත් ශාලාවක් තෝරන්න.',
        ta: '⚠️ பட்டியலிலிருந்து மருந்தகத்தைத் தேர்வு செய்யவும்.'
    },

    // ─── Appointment Slot Selection (combined date+session) ───
    select_appointment_header: {
        en: '📅 Available Appointments',
        si: '📅 පවතින හමුවීම්',
        ta: '📅 கிடைக்கும் சந்திப்புகள்'
    },
    select_appointment_body: {
        en: 'Select an available appointment slot:',
        si: 'පවතින හමුවීම් කාලයක් තෝරන්න:',
        ta: 'கிடைக்கும் சந்திப்பு நேரத்தைத் தேர்வு செய்யவும்:'
    },
    view_appointments_btn: {
        en: 'View Appointments',
        si: 'හමුවීම් බලන්න',
        ta: 'சந்திப்புகளைப் பார்'
    },
    appointments_section_title: {
        en: 'Appointments',
        si: 'හමුවීම්',
        ta: 'சந்திப்புகள்'
    },
    no_appointments: {
        en: '😔 No appointments available in the next few days. Please try again later.',
        si: '😔 ඉදිරි දිනවල හමුවීම් නොමැත. කරුණාකර පසුව උත්සාහ කරන්න.',
        ta: '😔 அடுத்த சில நாட்களில் சந்திப்புகள் இல்லை. பின்னர் முயற்சிக்கவும்.'
    },
    invalid_appointment: {
        en: '⚠️ Please select an appointment from the list.',
        si: '⚠️ ලැයිස්තුවෙන් හමුවීමක් තෝරන්න.',
        ta: '⚠️ பட்டியலிலிருந்து சந்திப்பைத் தேர்வு செய்யவும்.'
    },
    next_appointment: {
        en: 'Next Appt',
        si: 'ඊළඟ අංකය',
        ta: 'அடுத்த எண்'
    },

    // ─── Patient Information ───
    enter_name: {
        en: '👤 Please enter the *patient name*:',
        si: '👤 කරුණාකර *රෝගියාගේ නම* ඇතුළත් කරන්න:',
        ta: '👤 *நோயாளியின் பெயரை* உள்ளிடவும்:'
    },
    invalid_name: {
        en: '⚠️ Please enter a valid name (at least 2 characters).',
        si: '⚠️ වලංගු නමක් ඇතුළත් කරන්න (අවම අක්ෂර 2).',
        ta: '⚠️ சரியான பெயரை உள்ளிடவும் (குறைந்தது 2 எழுத்துகள்).'
    },
    use_wa_phone: {
        en: 'Use your WhatsApp number as contact?',
        si: 'ඔබේ WhatsApp අංකය සම්බන්ධතා අංකය ලෙස භාවිතා කරන්නද?',
        ta: 'உங்கள் WhatsApp எண்ணை தொடர்பு எண்ணாக பயன்படுத்தவா?'
    },
    yes_use_this: {
        en: 'Yes, use this',
        si: 'ඔව්, මෙය',
        ta: 'ஆம், இதை'
    },
    enter_different: {
        en: 'Enter different',
        si: 'වෙනත් අංකයක්',
        ta: 'வேறு எண்'
    },
    enter_phone_manual: {
        en: '📱 Please enter the contact phone number (e.g. *0762199100*):',
        si: '📱 කරුණාකර දුරකථන අංකය ඇතුළත් කරන්න (උදා: *0762199100*):',
        ta: '📱 தொடர்பு எண்ணை உள்ளிடவும் (எ.கா: *0762199100*):'
    },
    invalid_phone: {
        en: '⚠️ Invalid phone number. Please enter like: *0762199100* or *+94762199100*',
        si: '⚠️ වලංගු නොවන දුරකථන අංකය. *0762199100* හෝ *+94762199100* ලෙස ඇතුළත් කරන්න.',
        ta: '⚠️ தவறான தொலைபேசி எண். *0762199100* அல்லது *+94762199100* என உள்ளிடவும்.'
    },
    tap_button: {
        en: '⚠️ Please tap one of the buttons above.',
        si: '⚠️ ඉහත බොත්තම් වලින් එකක් තට්ටු කරන්න.',
        ta: '⚠️ மேலே உள்ள பொத்தான்களில் ஒன்றைத் தட்டவும்.'
    },

    // ─── Booking Summary & Confirmation ───
    booking_summary: {
        en: '📋 *Booking Summary*',
        si: '📋 *වෙන්කිරීම් සාරාංශය*',
        ta: '📋 *முன்பதிவு சுருக்கம்*'
    },
    doctor_label: {
        en: 'Doctor',
        si: 'වෛද්‍යවරයා',
        ta: 'மருத்துவர்'
    },
    dispensary_label: {
        en: 'Dispensary',
        si: 'බෙහෙත් ශාලාව',
        ta: 'மருந்தகம்'
    },
    date_label: {
        en: 'Date',
        si: 'දිනය',
        ta: 'தேதி'
    },
    time_label: {
        en: 'Time',
        si: 'වේලාව',
        ta: 'நேரம்'
    },
    appointment_label: {
        en: 'Appointment',
        si: 'හමුවීම් අංකය',
        ta: 'சந்திப்பு எண்'
    },
    patient_label: {
        en: 'Patient',
        si: 'රෝගියා',
        ta: 'நோயாளி'
    },
    phone_label: {
        en: 'Phone',
        si: 'දුරකථනය',
        ta: 'தொலைபேசி'
    },
    confirm_question: {
        en: 'Would you like to confirm this booking?',
        si: 'මෙම වෙන්කිරීම තහවුරු කරන්නද?',
        ta: 'இந்த முன்பதிவை உறுதிப்படுத்த விரும்புகிறீர்களா?'
    },
    confirm_btn: {
        en: '✅ Confirm',
        si: '✅ තහවුරු',
        ta: '✅ உறுதி'
    },
    cancel_btn: {
        en: '❌ Cancel',
        si: '❌ අවලංගු',
        ta: '❌ ரத்து'
    },
    tap_confirm_or_cancel: {
        en: '⚠️ Please tap *Confirm* or *Cancel*.',
        si: '⚠️ *තහවුරු* හෝ *අවලංගු* තට්ටු කරන්න.',
        ta: '⚠️ *உறுதி* அல்லது *ரத்து* தட்டவும்.'
    },

    // ─── Booking Result ───
    booking_confirmed: {
        en: '✅ *Booking Confirmed!*',
        si: '✅ *වෙන්කිරීම තහවුරු විය!*',
        ta: '✅ *முன்பதிவு உறுதிப்படுத்தப்பட்டது!*'
    },
    reference_label: {
        en: 'Reference',
        si: 'යොමු අංකය',
        ta: 'குறிப்பு'
    },
    estimated_time_label: {
        en: 'Estimated Time',
        si: 'ඇස්තමේන්තු වේලාව',
        ta: 'மதிப்பீட்டு நேரம்'
    },
    fee_label: {
        en: 'Fee',
        si: 'ගාස්තුව',
        ta: 'கட்டணம்'
    },
    thank_you: {
        en: 'Thank you for booking with MyClinic! 🙏',
        si: 'MyClinic සමඟ වෙන්කිරීම සිදු කළාට ස්තූතියි! 🙏',
        ta: 'MyClinic உடன் முன்பதிவு செய்ததற்கு நன்றி! 🙏'
    },
    type_menu: {
        en: 'Type *menu* to make another booking.',
        si: 'තවත් වෙන්කිරීමක් සඳහා *menu* ටයිප් කරන්න.',
        ta: 'மற்றொரு முன்பதிவுக்கு *menu* என தட்டச்சு செய்யவும்.'
    },
    booking_cancelled: {
        en: '❌ Booking cancelled. Type *menu* to start a new booking.',
        si: '❌ වෙන්කිරීම අවලංගු විය. *menu* ටයිප් කර නව වෙන්කිරීමක් ආරම්භ කරන්න.',
        ta: '❌ முன்பதிவு ரத்து செய்யப்பட்டது. *menu* என தட்டச்சு செய்து புதிய முன்பதிவைத் தொடங்கவும்.'
    },
    slots_full: {
        en: '😔 Sorry, all appointments are now booked. Type *menu* to try again.',
        si: '😔 සමාවන්න, සියලුම හමුවීම් වෙන්කර ඇත. *menu* ටයිප් කරන්න.',
        ta: '😔 மன்னிக்கவும், எல்லா சந்திப்புகளும் முன்பதிவு செய்யப்பட்டன. *menu* தட்டச்சு செய்யவும்.'
    },
    slot_unavailable: {
        en: '😔 This slot is no longer available. Type *menu* to start over.',
        si: '😔 මෙම කාලය තවදුරටත් නොමැත. *menu* ටයිප් කරන්න.',
        ta: '😔 இந்த நேரம் இப்போது கிடைக்கவில்லை. *menu* தட்டச்சு செய்யவும்.'
    },

    // ─── Generic / Error ───
    error_generic: {
        en: '😔 Something went wrong. Please type *menu* to start over.',
        si: '😔 යම් දෝෂයක් ඇති විය. *menu* ටයිප් කර නැවත ආරම්භ කරන්න.',
        ta: '😔 ஏதோ பிழை ஏற்பட்டது. *menu* தட்டச்சு செய்து மீண்டும் தொடங்கவும்.'
    },
    unsupported_message: {
        en: '⚠️ Please send a text message or select from the options provided.',
        si: '⚠️ කරුණාකර පෙළ පණිවිඩයක් යවන්න හෝ ලබා දී ඇති විකල්ප තෝරන්න.',
        ta: '⚠️ உரைச் செய்தியை அனுப்பவும் அல்லது கொடுக்கப்பட்ட விருப்பங்களிலிருந்து தேர்வு செய்யவும்.'
    },
    session_reset: {
        en: '🔄 Session reset. Send *Hi* to start a new booking.',
        si: '🔄 සැසිය නැවත සකසන ලදී. නව වෙන්කිරීමක් සඳහා *Hi* යවන්න.',
        ta: '🔄 அமர்வு மீட்டமைக்கப்பட்டது. புதிய முன்பதிவுக்கு *Hi* அனுப்பவும்.'
    }
};

// ─────────────────────────────────────────────────────────────
// Localized Month Names
// ─────────────────────────────────────────────────────────────

const monthNames = {
    en: ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'],
    si: ['ජනවාරි', 'පෙබරවාරි', 'මාර්තු', 'අප්‍රේල්', 'මැයි', 'ජූනි',
        'ජූලි', 'අගෝස්තු', 'සැප්තැම්බර්', 'ඔක්තෝබර්', 'නොවැම්බර්', 'දෙසැම්බර්'],
    ta: ['ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்',
        'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்']
};

const dayNames = {
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    si: ['ඉරිදා', 'සඳුදා', 'අඟහරුවාදා', 'බදාදා', 'බ්‍රහස්පතින්දා', 'සිකුරාදා', 'සෙනසුරාදා'],
    ta: ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி']
};

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

/**
 * Get a translated string. Falls back to English if key/lang missing.
 */
function t(lang, key) {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] || entry['en'] || key;
}

/**
 * Format a date with localized month name.
 * Returns: "14 මාර්තු" (si), "14 March" (en), "14 மார்ச்" (ta)
 */
function formatDate(date, lang) {
    const d = new Date(date);
    const day = d.getDate();
    const month = (monthNames[lang] || monthNames['en'])[d.getMonth()];
    return `${day} ${month}`;
}

/**
 * Format a date with day name.
 * Returns: "14 මාර්තු (සිකුරාදා)"
 */
function formatDateWithDay(date, lang) {
    const d = new Date(date);
    const day = d.getDate();
    const month = (monthNames[lang] || monthNames['en'])[d.getMonth()];
    const dayName = (dayNames[lang] || dayNames['en'])[d.getDay()];
    return `${day} ${month} (${dayName})`;
}

/**
 * Convert 24hr time string "14:30" to 12hr format "2:30 PM"
 */
function to12Hr(time24) {
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Format a time range in 12hr: "09:00" → "9:00 AM"
 */
function formatTimeRange(startTime, endTime) {
    return `${to12Hr(startTime)} - ${to12Hr(endTime)}`;
}

module.exports = {
    t,
    translations,
    monthNames,
    dayNames,
    formatDate,
    formatDateWithDay,
    to12Hr,
    formatTimeRange
};
