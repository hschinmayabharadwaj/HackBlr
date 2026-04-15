'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Language = 'en' | 'hi' | 'bn' | 'ta' | 'te' | 'mr';

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', direction: 'ltr' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', direction: 'ltr' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', direction: 'ltr' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', direction: 'ltr' },
];

// Complete translations for all languages
const englishTranslations: Record<string, string> = {
  // Common
  'common.loading': 'Loading...',
  'common.error': 'An error occurred',
  'common.retry': 'Try Again',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.continue': 'Continue',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.skip': 'Skip',
  'common.done': 'Done',
  'common.close': 'Close',
  'common.settings': 'Settings',
  'common.profile': 'Profile',
  'common.logout': 'Log Out',
  'common.welcome': 'Welcome',
  'common.offline': 'You are offline',
  'common.offlineDesc': 'Some features may be limited',
  
  // Navigation
  'nav.dashboard': 'Dashboard',
  'nav.checkin': 'Daily Check-in',
  'nav.voiceAgent': 'Voice Agent',
  'nav.mindfulness': 'Mindfulness',
  'nav.progress': 'Progress',
  'nav.forum': 'Forum',
  'nav.games': 'Games',
  'nav.resources': 'Resources',
  'nav.profile': 'Profile',
  'nav.motionArcade': 'Motion Arcade',
  
  // Dashboard
  'dashboard.greeting': 'Good {timeOfDay}, {name}!',
  'dashboard.morning': 'morning',
  'dashboard.afternoon': 'afternoon',
  'dashboard.evening': 'evening',
  'dashboard.affirmation': 'Your Daily Affirmation',
  'dashboard.howFeeling': 'How are you feeling today?',
  'dashboard.checkInPrompt': 'Take a moment to check in with yourself. It only takes a minute.',
  'dashboard.startCheckIn': 'Start Daily Check-in',
  'dashboard.trackProgress': 'Track Your Progress',
  'dashboard.trackProgressDesc': 'See your mood trends and celebrate your journey.',
  'dashboard.viewProgress': 'View Progress',
  'dashboard.exploreResources': 'Explore Resources',
  'dashboard.exploreResourcesDesc': 'Discover tools and guides for your well-being.',
  'dashboard.browseResources': 'Browse Resources',
  
  // Crisis
  'crisis.titleUrgent': "We're Here For You",
  'crisis.titleSupport': 'Support is Available',
  'crisis.messageUrgent': "It sounds like you're going through a really difficult time. Please know that you're not alone.",
  'crisis.messageSupport': "We noticed you might be going through a tough time. It's okay to ask for help.",
  'crisis.helplineTitle': 'Crisis Helplines',
  'crisis.available': 'Available',
  'crisis.showMore': 'Show more helplines',
  'crisis.showLess': 'Show less',
  'crisis.reminder': 'Remember',
  'crisis.reminderText': "You matter, and your feelings are valid.",
  'crisis.close': 'Close',
  'crisis.continue': 'Continue',
  'crisis.needHelp': 'Need Help?',
  'crisis.helpAvailable': 'If you\'re in crisis, help is available 24/7',
  'crisis.call': 'Call',
  
  // Emergency Contacts
  'emergency.title': 'Emergency Contacts',
  'emergency.description': 'Add trusted people who can support you.',
  'emergency.noContacts': 'No emergency contacts added yet',
  'emergency.addFirst': 'Add someone you trust to reach out to.',
  'emergency.addContact': 'Add Emergency Contact',
  'emergency.name': 'Name',
  'emergency.namePlaceholder': 'Enter contact name',
  'emergency.phone': 'Phone Number',
  'emergency.phonePlaceholder': 'Enter phone number',
  'emergency.relationship': 'Relationship',
  'emergency.relationshipPlaceholder': 'e.g., Parent, Friend, Therapist',
  'emergency.save': 'Save Contact',
  
  // Theme
  'theme.title': 'Appearance',
  'theme.description': 'Customize how ManasMitra looks for you.',
  'theme.mode': 'Theme Mode',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'theme.system': 'System',
  'theme.colors': 'Accent Color',
  
  // Language
  'language.title': 'Language',
  'language.description': 'Choose your preferred language.',
  'language.select': 'Select Language',
  
  // Onboarding
  'onboarding.welcome': 'Welcome to ManasMitra Voice Access',
  'onboarding.welcomeDesc': 'Your voice-first companion for accessible guidance and everyday tasks.',
  'onboarding.getStarted': 'Get Started',
  
  // Progress Page
  'progress.title': 'Your Wellness Journey',
  'progress.subtitle': 'Visualize your mood trends over time.',
  'progress.moodTrends': 'Mood Trends',
  'progress.moodTrendsDesc': 'Showing your mood scores from the last 30 check-ins.',
  'progress.noData': 'Not enough data to show a trend.',
  'progress.noDataDesc': 'Complete at least two daily check-ins to see your progress.',
  
  // Settings Page
  'settings.customizeDesc': 'Customize your ManasMitra experience',
  'settings.installApp': 'Install App',
  'settings.installAppDesc': 'Install ManasMitra on your device for quick access and offline support.',
  'settings.viewInstructions': 'View Instructions',
  'settings.tutorial': 'Tutorial',
  'settings.tutorialDesc': 'View the onboarding tutorial again to learn about ManasMitra\'s features.',
  'settings.restartTutorial': 'Restart Tutorial',
  'settings.about': 'About ManasMitra',
  'settings.version': 'Version',
  'settings.aboutDesc': 'ManasMitra is your voice-first AI companion for accessible guidance, translation, and task support.',
  'settings.crisisSupport': 'Crisis Support',
  'settings.crisisSupportDesc': 'If you\'re in crisis, please reach out to:',
  'settings.appInstalled': 'App is installed',
  'settings.howToInstall': 'How to Install ManasMitra',
  'settings.followSteps': 'Follow these steps to add the app to your device',
  
  // Voice Agent
  'voice.title': 'Voice Access Companion',
  'voice.subtitle': 'Ask for plain-language help, translations, summaries, or next steps',
  'voice.placeholder': 'Say what you need or type a request...',
  'voice.send': 'Send',
  
  // Games
  'games.title': 'Wellness Games',
  'games.subtitle': 'Interactive activities for relaxation and self-discovery.',
  
  // Mindfulness
  'mindfulness.title': 'Mindfulness',
  'mindfulness.subtitle': 'Guided meditation and breathing exercises.',
  
  // Forum
  'forum.title': 'Community Forum',
  'forum.subtitle': 'Connect with others on their wellness journey.',
};

// Hindi translations
const hindiTranslations: Record<string, string> = {
  'common.loading': 'लोड हो रहा है...',
  'common.error': 'एक त्रुटि हुई',
  'common.retry': 'पुनः प्रयास करें',
  'common.cancel': 'रद्द करें',
  'common.save': 'सहेजें',
  'common.continue': 'जारी रखें',
  'common.back': 'वापस',
  'common.next': 'अगला',
  'common.skip': 'छोड़ें',
  'common.done': 'पूर्ण',
  'common.close': 'बंद करें',
  'common.settings': 'सेटिंग्स',
  'common.profile': 'प्रोफ़ाइल',
  'common.logout': 'लॉग आउट',
  'common.welcome': 'स्वागत है',
  'common.offline': 'आप ऑफ़लाइन हैं',
  'common.offlineDesc': 'कुछ सुविधाएं सीमित हो सकती हैं',
  
  'nav.dashboard': 'डैशबोर्ड',
  'nav.checkin': 'दैनिक चेक-इन',
  'nav.voiceAgent': 'वॉइस एजेंट',
  'nav.mindfulness': 'माइंडफुलनेस',
  'nav.progress': 'प्रगति',
  'nav.forum': 'फोरम',
  'nav.games': 'खेल',
  'nav.resources': 'संसाधन',
  'nav.profile': 'प्रोफ़ाइल',
  'nav.motionArcade': 'मोशन आर्केड',
  
  'dashboard.greeting': 'शुभ {timeOfDay}, {name}!',
  'dashboard.morning': 'प्रभात',
  'dashboard.afternoon': 'दोपहर',
  'dashboard.evening': 'संध्या',
  'dashboard.affirmation': 'आपका दैनिक प्रेरणा वाक्य',
  'dashboard.howFeeling': 'आज आप कैसा महसूस कर रहे हैं?',
  'dashboard.checkInPrompt': 'अपने आप से जुड़ने के लिए एक पल लें।',
  'dashboard.startCheckIn': 'दैनिक चेक-इन शुरू करें',
  'dashboard.trackProgress': 'अपनी प्रगति देखें',
  'dashboard.trackProgressDesc': 'अपने मूड ट्रेंड देखें और अपनी यात्रा का जश्न मनाएं।',
  'dashboard.viewProgress': 'प्रगति देखें',
  'dashboard.exploreResources': 'संसाधन खोजें',
  'dashboard.exploreResourcesDesc': 'अपनी भलाई के लिए उपकरण और गाइड खोजें।',
  'dashboard.browseResources': 'संसाधन देखें',
  
  'crisis.titleUrgent': 'हम आपके साथ हैं',
  'crisis.titleSupport': 'सहायता उपलब्ध है',
  'crisis.messageUrgent': 'लगता है आप कठिन समय से गुजर रहे हैं। आप अकेले नहीं हैं।',
  'crisis.helplineTitle': 'संकट हेल्पलाइन',
  'crisis.needHelp': 'मदद चाहिए?',
  'crisis.helpAvailable': 'यदि आप संकट में हैं, तो 24/7 मदद उपलब्ध है',
  'crisis.call': 'कॉल करें',
  
  'emergency.title': 'आपातकालीन संपर्क',
  'emergency.description': 'विश्वसनीय लोगों को जोड़ें जो आपका समर्थन कर सकते हैं।',
  'emergency.noContacts': 'अभी तक कोई आपातकालीन संपर्क नहीं जोड़ा गया',
  'emergency.addFirst': 'किसी विश्वसनीय व्यक्ति को जोड़ें।',
  'emergency.addContact': 'आपातकालीन संपर्क जोड़ें',
  
  'theme.title': 'दिखावट',
  'theme.description': 'ManasMitra की दिखावट को अनुकूलित करें।',
  'theme.mode': 'थीम मोड',
  'theme.light': 'लाइट',
  'theme.dark': 'डार्क',
  'theme.system': 'सिस्टम',
  
  'language.title': 'भाषा',
  'language.description': 'अपनी पसंदीदा भाषा चुनें।',
  'language.select': 'भाषा चुनें',
  
  'onboarding.welcome': 'ManasMitra में आपका स्वागत है',
  'onboarding.welcomeDesc': 'आपका AI-संचालित मानसिक स्वास्थ्य साथी।',
  'onboarding.getStarted': 'शुरू करें',
  
  'progress.title': 'आपकी वेलनेस यात्रा',
  'progress.subtitle': 'समय के साथ अपने मूड के रुझान देखें।',
  'progress.moodTrends': 'मूड ट्रेंड्स',
  'progress.moodTrendsDesc': 'पिछले 30 चेक-इन से आपके मूड स्कोर।',
  'progress.noData': 'रुझान दिखाने के लिए पर्याप्त डेटा नहीं।',
  'progress.noDataDesc': 'अपनी प्रगति देखने के लिए कम से कम दो दैनिक चेक-इन पूरा करें।',
  
  'settings.customizeDesc': 'अपने ManasMitra अनुभव को अनुकूलित करें',
  'settings.installApp': 'ऐप इंस्टॉल करें',
  'settings.installAppDesc': 'त्वरित पहुंच के लिए अपने डिवाइस पर ManasMitra इंस्टॉल करें।',
  'settings.viewInstructions': 'निर्देश देखें',
  'settings.tutorial': 'ट्यूटोरियल',
  'settings.tutorialDesc': 'ManasMitra की सुविधाओं के बारे में जानने के लिए ट्यूटोरियल देखें।',
  'settings.restartTutorial': 'ट्यूटोरियल पुनः आरंभ करें',
  'settings.about': 'ManasMitra के बारे में',
  'settings.version': 'संस्करण',
  'settings.appInstalled': 'ऐप इंस्टॉल है',
  'settings.howToInstall': 'ManasMitra कैसे इंस्टॉल करें',
  'settings.followSteps': 'ऐप को अपने डिवाइस में जोड़ने के लिए इन चरणों का पालन करें',
  
  'voice.title': 'वॉइस साथी',
  'voice.subtitle': 'अपनी आवाज़ का उपयोग करके ManasMitra से बात करें',
  'voice.placeholder': 'अपना संदेश टाइप करें या माइक्रोफ़ोन का उपयोग करें...',
  'voice.send': 'भेजें',
  
  'games.title': 'वेलनेस गेम्स',
  'games.subtitle': 'विश्राम और आत्म-खोज के लिए इंटरैक्टिव गतिविधियाँ।',
  
  'mindfulness.title': 'माइंडफुलनेस',
  'mindfulness.subtitle': 'निर्देशित ध्यान और श्वास व्यायाम।',
  
  'forum.title': 'सामुदायिक फोरम',
  'forum.subtitle': 'अपनी वेलनेस यात्रा पर दूसरों से जुड़ें।',
};

// Bengali translations
const bengaliTranslations: Record<string, string> = {
  'common.loading': 'লোড হচ্ছে...',
  'common.error': 'একটি ত্রুটি ঘটেছে',
  'common.retry': 'আবার চেষ্টা করুন',
  'common.cancel': 'বাতিল',
  'common.save': 'সংরক্ষণ',
  'common.continue': 'চালিয়ে যান',
  'common.back': 'পিছনে',
  'common.next': 'পরবর্তী',
  'common.skip': 'এড়িয়ে যান',
  'common.done': 'সম্পন্ন',
  'common.close': 'বন্ধ',
  'common.settings': 'সেটিংস',
  'common.profile': 'প্রোফাইল',
  'common.logout': 'লগ আউট',
  'common.welcome': 'স্বাগতম',
  'common.offline': 'আপনি অফলাইন',
  'common.offlineDesc': 'কিছু বৈশিষ্ট্য সীমিত হতে পারে',
  
  'nav.dashboard': 'ড্যাশবোর্ড',
  'nav.checkin': 'দৈনিক চেক-ইন',
  'nav.voiceAgent': 'ভয়েস এজেন্ট',
  'nav.mindfulness': 'মাইন্ডফুলনেস',
  'nav.progress': 'অগ্রগতি',
  'nav.forum': 'ফোরাম',
  'nav.games': 'গেমস',
  'nav.resources': 'সম্পদ',
  'nav.profile': 'প্রোফাইল',
  'nav.motionArcade': 'মোশন আর্কেড',
  
  'dashboard.greeting': 'শুভ {timeOfDay}, {name}!',
  'dashboard.morning': 'সকাল',
  'dashboard.afternoon': 'দুপুর',
  'dashboard.evening': 'সন্ধ্যা',
  'dashboard.affirmation': 'আপনার দৈনিক প্রেরণা',
  'dashboard.howFeeling': 'আজ আপনি কেমন অনুভব করছেন?',
  'dashboard.checkInPrompt': 'নিজের সাথে যোগাযোগের জন্য একটি মুহূর্ত নিন।',
  'dashboard.startCheckIn': 'দৈনিক চেক-ইন শুরু করুন',
  'dashboard.trackProgress': 'আপনার অগ্রগতি ট্র্যাক করুন',
  'dashboard.trackProgressDesc': 'আপনার মেজাজের প্রবণতা দেখুন।',
  'dashboard.viewProgress': 'অগ্রগতি দেখুন',
  'dashboard.exploreResources': 'সম্পদ অন্বেষণ করুন',
  'dashboard.exploreResourcesDesc': 'আপনার সুস্থতার জন্য সরঞ্জাম খুঁজুন।',
  'dashboard.browseResources': 'সম্পদ দেখুন',
  
  'crisis.needHelp': 'সাহায্য দরকার?',
  'crisis.helpAvailable': 'সংকটে থাকলে, ২৪/৭ সাহায্য পাওয়া যায়',
  'crisis.call': 'কল করুন',
  
  'theme.title': 'চেহারা',
  'theme.light': 'লাইট',
  'theme.dark': 'ডার্ক',
  'theme.system': 'সিস্টেম',
  
  'language.title': 'ভাষা',
  'language.select': 'ভাষা নির্বাচন করুন',
  
  'progress.title': 'আপনার সুস্থতা যাত্রা',
  'progress.subtitle': 'সময়ের সাথে আপনার মেজাজের প্রবণতা দেখুন।',
  'progress.moodTrends': 'মেজাজ প্রবণতা',
  'progress.moodTrendsDesc': 'শেষ ৩০টি চেক-ইন থেকে আপনার মেজাজ স্কোর।',
  'progress.noData': 'প্রবণতা দেখানোর জন্য পর্যাপ্ত তথ্য নেই।',
  'progress.noDataDesc': 'আপনার অগ্রগতি দেখতে কমপক্ষে দুটি দৈনিক চেক-ইন সম্পূর্ণ করুন।',
  
  'settings.customizeDesc': 'আপনার ManasMitra অভিজ্ঞতা কাস্টমাইজ করুন',
  'settings.installApp': 'অ্যাপ ইনস্টল করুন',
  'settings.installAppDesc': 'দ্রুত অ্যাক্সেসের জন্য আপনার ডিভাইসে ManasMitra ইনস্টল করুন।',
  'settings.viewInstructions': 'নির্দেশাবলী দেখুন',
  'settings.tutorial': 'টিউটোরিয়াল',
  'settings.tutorialDesc': 'ManasMitra-এর বৈশিষ্ট্যগুলি জানতে টিউটোরিয়াল দেখুন।',
  'settings.restartTutorial': 'টিউটোরিয়াল পুনরায় শুরু করুন',
  'settings.about': 'ManasMitra সম্পর্কে',
  'settings.appInstalled': 'অ্যাপ ইনস্টল করা হয়েছে',
  'settings.howToInstall': 'ManasMitra কিভাবে ইনস্টল করবেন',
  
  'voice.title': 'ভয়েস সঙ্গী',
  'voice.subtitle': 'আপনার ভয়েস ব্যবহার করে ManasMitra-এর সাথে কথা বলুন',
  
  'games.title': 'সুস্থতা গেমস',
  'games.subtitle': 'শিথিলকরণ এবং আত্ম-আবিষ্কারের জন্য ইন্টারেক্টিভ কার্যক্রম।',
  
  'mindfulness.title': 'মাইন্ডফুলনেস',
  'mindfulness.subtitle': 'গাইডেড মেডিটেশন এবং শ্বাস-প্রশ্বাসের ব্যায়াম।',
  
  'forum.title': 'কমিউনিটি ফোরাম',
  'forum.subtitle': 'আপনার সুস্থতা যাত্রায় অন্যদের সাথে যুক্ত হন।',
};

// Tamil translations
const tamilTranslations: Record<string, string> = {
  'common.loading': 'ஏற்றுகிறது...',
  'common.error': 'ஒரு பிழை ஏற்பட்டது',
  'common.retry': 'மீண்டும் முயற்சிக்கவும்',
  'common.cancel': 'ரத்து',
  'common.save': 'சேமி',
  'common.continue': 'தொடரவும்',
  'common.back': 'பின்செல்',
  'common.next': 'அடுத்து',
  'common.skip': 'தவிர்',
  'common.done': 'முடிந்தது',
  'common.close': 'மூடு',
  'common.settings': 'அமைப்புகள்',
  'common.profile': 'சுயவிவரம்',
  'common.logout': 'வெளியேறு',
  'common.welcome': 'வரவேற்கிறோம்',
  'common.offline': 'நீங்கள் ஆஃப்லைனில் உள்ளீர்கள்',
  
  'nav.dashboard': 'டாஷ்போர்ட்',
  'nav.checkin': 'தினசரி செக்-இன்',
  'nav.voiceAgent': 'குரல் உதவியாளர்',
  'nav.mindfulness': 'மைன்ட்ஃபுல்னஸ்',
  'nav.progress': 'முன்னேற்றம்',
  'nav.forum': 'மன்றம்',
  'nav.games': 'விளையாட்டுகள்',
  'nav.resources': 'வளங்கள்',
  'nav.profile': 'சுயவிவரம்',
  'nav.motionArcade': 'மோஷன் ஆர்கேட்',
  
  'dashboard.greeting': 'நல்ல {timeOfDay}, {name}!',
  'dashboard.morning': 'காலை',
  'dashboard.afternoon': 'மதியம்',
  'dashboard.evening': 'மாலை',
  'dashboard.affirmation': 'உங்கள் தினசரி உறுதிமொழி',
  'dashboard.howFeeling': 'இன்று நீங்கள் எப்படி உணர்கிறீர்கள்?',
  'dashboard.checkInPrompt': 'உங்களைப் பற்றி சிந்திக்க ஒரு கணம் எடுத்துக்கொள்ளுங்கள்.',
  'dashboard.startCheckIn': 'தினசரி செக்-இன் தொடங்கு',
  'dashboard.trackProgress': 'உங்கள் முன்னேற்றத்தைக் கண்காணிக்கவும்',
  'dashboard.viewProgress': 'முன்னேற்றத்தைப் பார்',
  
  'crisis.needHelp': 'உதவி வேண்டுமா?',
  'crisis.helpAvailable': 'நெருக்கடியில் இருந்தால், 24/7 உதவி கிடைக்கும்',
  'crisis.call': 'அழைக்கவும்',
  
  'theme.title': 'தோற்றம்',
  'theme.light': 'லைட்',
  'theme.dark': 'டார்க்',
  'theme.system': 'சிஸ்டம்',
  
  'language.title': 'மொழி',
  'language.select': 'மொழியைத் தேர்வுசெய்க',
  
  'progress.title': 'உங்கள் ஆரோக்கிய பயணம்',
  'progress.subtitle': 'காலப்போக்கில் உங்கள் மனநிலை போக்குகளைப் பாருங்கள்.',
  'progress.moodTrends': 'மனநிலை போக்குகள்',
  'progress.moodTrendsDesc': 'கடந்த 30 செக்-இன்களிலிருந்து உங்கள் மனநிலை மதிப்பெண்கள்.',
  'progress.noData': 'போக்கைக் காட்ட போதுமான தரவு இல்லை.',
  'progress.noDataDesc': 'உங்கள் முன்னேற்றத்தைப் பார்க்க குறைந்தது இரண்டு தினசரி செக்-இன்களை முடிக்கவும்.',
  
  'settings.customizeDesc': 'உங்கள் ManasMitra அனுபவத்தைத் தனிப்பயனாக்கவும்',
  'settings.installApp': 'ஆப்பை நிறுவவும்',
  'settings.installAppDesc': 'விரைவான அணுகலுக்கு உங்கள் சாதனத்தில் ManasMitra-ஐ நிறுவவும்.',
  'settings.viewInstructions': 'வழிமுறைகளைப் பார்',
  'settings.tutorial': 'டுடோரியல்',
  'settings.restartTutorial': 'டுடோரியலை மீண்டும் தொடங்கு',
  'settings.about': 'ManasMitra பற்றி',
  'settings.appInstalled': 'ஆப் நிறுவப்பட்டது',
  'settings.howToInstall': 'ManasMitra-ஐ எவ்வாறு நிறுவுவது',
  
  'voice.title': 'குரல் துணை',
  'voice.subtitle': 'உங்கள் குரலைப் பயன்படுத்தி ManasMitra-உடன் பேசுங்கள்',
  
  'games.title': 'ஆரோக்கிய விளையாட்டுகள்',
  'games.subtitle': 'ஓய்வு மற்றும் சுய-கண்டுபிடிப்புக்கான ஊடாடும் செயல்பாடுகள்.',
  
  'mindfulness.title': 'மைன்ட்ஃபுல்னஸ்',
  'mindfulness.subtitle': 'வழிகாட்டப்பட்ட தியானம் மற்றும் சுவாசப் பயிற்சிகள்.',
  
  'forum.title': 'சமூக மன்றம்',
  'forum.subtitle': 'உங்கள் ஆரோக்கிய பயணத்தில் மற்றவர்களுடன் இணைக.',
};

// Telugu translations
const teluguTranslations: Record<string, string> = {
  'common.loading': 'లోడ్ అవుతోంది...',
  'common.error': 'ఒక లోపం సంభవించింది',
  'common.retry': 'మళ్ళీ ప్రయత్నించండి',
  'common.cancel': 'రద్దు',
  'common.save': 'సేవ్',
  'common.continue': 'కొనసాగించు',
  'common.back': 'వెనుకకు',
  'common.next': 'తదుపరి',
  'common.skip': 'దాటవేయి',
  'common.done': 'పూర్తయింది',
  'common.close': 'మూసివేయి',
  'common.settings': 'సెట్టింగ్‌లు',
  'common.profile': 'ప్రొఫైల్',
  'common.logout': 'లాగ్ అవుట్',
  'common.welcome': 'స్వాగతం',
  'common.offline': 'మీరు ఆఫ్‌లైన్‌లో ఉన్నారు',
  
  'nav.dashboard': 'డాష్‌బోర్డ్',
  'nav.checkin': 'రోజువారీ చెక్-ఇన్',
  'nav.voiceAgent': 'వాయిస్ ఏజెంట్',
  'nav.mindfulness': 'మైండ్‌ఫుల్‌నెస్',
  'nav.progress': 'పురోగతి',
  'nav.forum': 'ఫోరం',
  'nav.games': 'గేమ్‌లు',
  'nav.resources': 'వనరులు',
  'nav.profile': 'ప్రొఫైల్',
  'nav.motionArcade': 'మోషన్ ఆర్కేడ్',
  
  'dashboard.greeting': 'శుభ {timeOfDay}, {name}!',
  'dashboard.morning': 'ఉదయం',
  'dashboard.afternoon': 'మధ్యాహ్నం',
  'dashboard.evening': 'సాయంత్రం',
  'dashboard.affirmation': 'మీ రోజువారీ ప్రేరణ',
  'dashboard.howFeeling': 'ఈ రోజు మీరు ఎలా అనుభవిస్తున్నారు?',
  'dashboard.checkInPrompt': 'మిమ్మల్ని మీరు తనిఖీ చేసుకోవడానికి ఒక క్షణం తీసుకోండి.',
  'dashboard.startCheckIn': 'రోజువారీ చెక్-ఇన్ ప్రారంభించండి',
  'dashboard.trackProgress': 'మీ పురోగతిని ట్రాక్ చేయండి',
  'dashboard.viewProgress': 'పురోగతి చూడండి',
  
  'crisis.needHelp': 'సహాయం కావాలా?',
  'crisis.helpAvailable': 'సంక్షోభంలో ఉంటే, 24/7 సహాయం అందుబాటులో ఉంది',
  'crisis.call': 'కాల్ చేయండి',
  
  'theme.title': 'రూపం',
  'theme.light': 'లైట్',
  'theme.dark': 'డార్క్',
  'theme.system': 'సిస్టమ్',
  
  'language.title': 'భాష',
  'language.select': 'భాషను ఎంచుకోండి',
  
  'progress.title': 'మీ ఆరోగ్య ప్రయాణం',
  'progress.subtitle': 'కాలక్రమంలో మీ మూడ్ ధోరణులను చూడండి.',
  'progress.moodTrends': 'మూడ్ ధోరణులు',
  'progress.moodTrendsDesc': 'చివరి 30 చెక్-ఇన్‌ల నుండి మీ మూడ్ స్కోర్‌లు.',
  'progress.noData': 'ధోరణిని చూపించడానికి తగినంత డేటా లేదు.',
  'progress.noDataDesc': 'మీ పురోగతిని చూడటానికి కనీసం రెండు రోజువారీ చెక్-ఇన్‌లను పూర్తి చేయండి.',
  
  'settings.customizeDesc': 'మీ ManasMitra అనుభవాన్ని అనుకూలీకరించండి',
  'settings.installApp': 'యాప్ ఇన్‌స్టాల్ చేయండి',
  'settings.installAppDesc': 'త్వరిత యాక్సెస్ కోసం మీ పరికరంలో ManasMitra ఇన్‌స్టాల్ చేయండి.',
  'settings.viewInstructions': 'సూచనలు చూడండి',
  'settings.tutorial': 'ట్యుటోరియల్',
  'settings.restartTutorial': 'ట్యుటోరియల్ మళ్ళీ ప్రారంభించండి',
  'settings.about': 'ManasMitra గురించి',
  'settings.appInstalled': 'యాప్ ఇన్‌స్టాల్ చేయబడింది',
  'settings.howToInstall': 'ManasMitra ఎలా ఇన్‌స్టాల్ చేయాలి',
  
  'voice.title': 'వాయిస్ సహచరుడు',
  'voice.subtitle': 'మీ వాయిస్ ఉపయోగించి ManasMitra తో మాట్లాడండి',
  
  'games.title': 'ఆరోగ్య గేమ్‌లు',
  'games.subtitle': 'విశ్రాంతి మరియు స్వీయ-ఆవిష్కరణ కోసం ఇంటరాక్టివ్ కార్యకలాపాలు.',
  
  'mindfulness.title': 'మైండ్‌ఫుల్‌నెస్',
  'mindfulness.subtitle': 'గైడెడ్ మెడిటేషన్ మరియు శ్వాస వ్యాయామాలు.',
  
  'forum.title': 'కమ్యూనిటీ ఫోరం',
  'forum.subtitle': 'మీ ఆరోగ్య ప్రయాణంలో ఇతరులతో కనెక్ట్ అవ్వండి.',
};

// Marathi translations
const marathiTranslations: Record<string, string> = {
  'common.loading': 'लोड होत आहे...',
  'common.error': 'एक त्रुटी झाली',
  'common.retry': 'पुन्हा प्रयत्न करा',
  'common.cancel': 'रद्द करा',
  'common.save': 'सेव्ह करा',
  'common.continue': 'पुढे जा',
  'common.back': 'मागे',
  'common.next': 'पुढील',
  'common.skip': 'वगळा',
  'common.done': 'पूर्ण',
  'common.close': 'बंद करा',
  'common.settings': 'सेटिंग्ज',
  'common.profile': 'प्रोफाइल',
  'common.logout': 'लॉग आउट',
  'common.welcome': 'स्वागत आहे',
  'common.offline': 'तुम्ही ऑफलाइन आहात',
  
  'nav.dashboard': 'डॅशबोर्ड',
  'nav.checkin': 'दैनिक चेक-इन',
  'nav.voiceAgent': 'व्हॉइस एजंट',
  'nav.mindfulness': 'माइंडफुलनेस',
  'nav.progress': 'प्रगती',
  'nav.forum': 'फोरम',
  'nav.games': 'गेम्स',
  'nav.resources': 'संसाधने',
  'nav.profile': 'प्रोफाइल',
  'nav.motionArcade': 'मोशन आर्केड',
  
  'dashboard.greeting': 'शुभ {timeOfDay}, {name}!',
  'dashboard.morning': 'सकाळ',
  'dashboard.afternoon': 'दुपार',
  'dashboard.evening': 'संध्याकाळ',
  'dashboard.affirmation': 'तुमचे दैनिक प्रेरणा वाक्य',
  'dashboard.howFeeling': 'आज तुम्हाला कसे वाटत आहे?',
  'dashboard.checkInPrompt': 'स्वतःशी संपर्क साधण्यासाठी एक क्षण घ्या.',
  'dashboard.startCheckIn': 'दैनिक चेक-इन सुरू करा',
  'dashboard.trackProgress': 'तुमची प्रगती ट्रॅक करा',
  'dashboard.viewProgress': 'प्रगती पहा',
  
  'crisis.needHelp': 'मदत हवी आहे?',
  'crisis.helpAvailable': 'संकटात असाल तर, 24/7 मदत उपलब्ध आहे',
  'crisis.call': 'कॉल करा',
  
  'theme.title': 'दिसणे',
  'theme.light': 'लाइट',
  'theme.dark': 'डार्क',
  'theme.system': 'सिस्टम',
  
  'language.title': 'भाषा',
  'language.select': 'भाषा निवडा',
  
  'progress.title': 'तुमचा वेलनेस प्रवास',
  'progress.subtitle': 'कालांतराने तुमच्या मूड ट्रेंड्स पहा.',
  'progress.moodTrends': 'मूड ट्रेंड्स',
  'progress.moodTrendsDesc': 'मागील 30 चेक-इन मधून तुमचे मूड स्कोअर.',
  'progress.noData': 'ट्रेंड दाखवण्यासाठी पुरेसा डेटा नाही.',
  'progress.noDataDesc': 'तुमची प्रगती पाहण्यासाठी किमान दोन दैनिक चेक-इन पूर्ण करा.',
  
  'settings.customizeDesc': 'तुमचा ManasMitra अनुभव कस्टमाइझ करा',
  'settings.installApp': 'अॅप इन्स्टॉल करा',
  'settings.installAppDesc': 'जलद प्रवेशासाठी तुमच्या डिव्हाइसवर ManasMitra इन्स्टॉल करा.',
  'settings.viewInstructions': 'सूचना पहा',
  'settings.tutorial': 'ट्यूटोरियल',
  'settings.restartTutorial': 'ट्यूटोरियल पुन्हा सुरू करा',
  'settings.about': 'ManasMitra बद्दल',
  'settings.appInstalled': 'अॅप इन्स्टॉल केले',
  'settings.howToInstall': 'ManasMitra कसे इन्स्टॉल करायचे',
  
  'voice.title': 'व्हॉइस साथीदार',
  'voice.subtitle': 'तुमचा आवाज वापरून ManasMitra शी बोला',
  
  'games.title': 'वेलनेस गेम्स',
  'games.subtitle': 'विश्रांती आणि आत्म-शोधासाठी इंटरॅक्टिव्ह क्रियाकलाप.',
  
  'mindfulness.title': 'माइंडफुलनेस',
  'mindfulness.subtitle': 'मार्गदर्शित ध्यान आणि श्वासोच्छवासाचे व्यायाम.',
  
  'forum.title': 'कम्युनिटी फोरम',
  'forum.subtitle': 'तुमच्या वेलनेस प्रवासात इतरांशी जोडले जा.',
};

export const translations: Record<Language, Record<string, string>> = {
  en: englishTranslations,
  hi: hindiTranslations,
  bn: bengaliTranslations,
  ta: tamilTranslations,
  te: teluguTranslations,
  mr: marathiTranslations,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
  direction: 'ltr' | 'rtl';
  languageInfo: LanguageInfo;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'manasmitra_language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  
  useEffect(() => {
    // Load saved language or detect from browser
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
      setLanguageState(saved);
    } else {
      // Detect from browser
      const browserLang = navigator.language.split('-')[0] as Language;
      if (SUPPORTED_LANGUAGES.some(l => l.code === browserLang)) {
        setLanguageState(browserLang);
      }
    }
  }, []);
  
  useEffect(() => {
    // Update document direction for RTL languages
    const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === language);
    if (langInfo) {
      document.documentElement.dir = langInfo.direction;
      document.documentElement.lang = language;
    }
  }, [language]);
  
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, []);
  
  const t = useCallback((key: string, params?: Record<string, string>): string => {
    // Try current language first, then fall back to English
    let text = translations[language]?.[key] || translations.en[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), value);
      });
    }
    
    return text;
  }, [language]);
  
  const languageInfo = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];
  
  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        direction: languageInfo.direction,
        languageInfo,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  
  // Return default values if used outside provider (during SSR or before mount)
  if (context === undefined) {
    return {
      language: 'en' as Language,
      setLanguage: () => {},
      t: (key: string) => translations.en[key] || key,
      direction: 'ltr' as const,
      languageInfo: SUPPORTED_LANGUAGES[0],
    };
  }
  
  return context;
}
