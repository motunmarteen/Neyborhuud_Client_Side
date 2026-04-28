'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { AppLanguage } from '@/types/api';

// Translation dictionaries
const dictionaries: Record<AppLanguage, Record<string, string>> = {
  en: {
    // Feed
    'feed.yourHuud': 'Your Huud',
    'feed.streetRadar': 'Street Radar',
    'feed.followingPlaces': 'Following Places',
    'feed.composerPlaceholder': "What's happening in your neighborhood?",
    'feed.newPost': 'New Post',
    'feed.noPostsTitle': 'No posts found in your area',
    'feed.noPostsSubtitle': 'Be the first to post something!',
    'feed.failedToLoad': 'Failed to load feed',
    'feed.retry': 'Retry',
    'feed.retrying': 'Retrying…',
    'feed.filterByType': 'Filter by type',
    'feed.filterByDept': 'Filter by department',
    'feed.allTypes': 'All Types',
    'feed.allDepartments': 'All Departments',

    // Explore tabs
    'explore.forYou': 'For You',
    'explore.trending': 'Trending',
    'explore.news': 'News',

    // Content types
    'contentType.post': 'Post',
    'contentType.fyi': 'FYI',
    'contentType.gossip': 'Local News',
    'contentType.help_request': 'Help Request',
    'contentType.job': 'Job',
    'contentType.event': 'Event',
    'contentType.marketplace': 'Marketplace',
    'contentType.emergency': 'Emergency',

    // Create post
    'createPost.title': 'Create Post',
    'createPost.postType': 'Post Type',
    'createPost.language': 'Language',
    'createPost.category': 'Category (Optional)',
    'createPost.visibility': 'Visibility',
    'createPost.posting': 'Posting...',
    'createPost.post': 'Post',
    'createPost.postShared': 'Post shared!',
    'createPost.willAppear': 'It will appear at the top of your feed.',
    'createPost.nigeriaOnly': 'Posting is only available for users in Nigeria.',
    'createPost.canInteract': 'You can still like, comment, save, and share posts.',
    'createPost.hashtagHint': 'Use #hashtags for tags (e.g., #safety #event)',

    // Settings
    'settings.title': 'Settings',
    'settings.notifications': 'Notifications',
    'settings.privacy': 'Privacy',
    'settings.account': 'Account',
    'settings.language': 'Language',
    'settings.languageDesc': 'Choose your preferred language for the app interface.',
    'settings.languageSaved': 'Language updated',

    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.loading': 'Loading...',
    'common.public': 'Public',
    'common.neighborhood': 'Neighborhood',
    'common.ward': 'Ward',
  },
  ha: {
    'feed.yourHuud': 'Unguwar Ka',
    'feed.streetRadar': 'Radar na Titi',
    'feed.followingPlaces': 'Wuraren da Kake Bi',
    'feed.composerPlaceholder': 'Me ke faruwa a unguwarka?',
    'feed.newPost': 'Sabon Sakwanni',
    'feed.noPostsTitle': 'Babu sakwanni a yankinku',
    'feed.noPostsSubtitle': 'Ka zama na farko da zai buga wani abu!',
    'feed.failedToLoad': 'An kasa loda fid',
    'feed.retry': 'Sake gwadawa',
    'feed.retrying': 'Ana sake gwadawa…',
    'feed.filterByType': 'Tacewa da iri',
    'feed.filterByDept': 'Tacewa da sashe',
    'feed.allTypes': 'Duk Iri',
    'feed.allDepartments': 'Duk Sashe',
    'explore.forYou': 'Maka Kai',
    'explore.trending': 'Abin da ake magana',
    'explore.news': 'Labari',
    'contentType.post': 'Sakwanni',
    'contentType.fyi': 'FYI',
    'contentType.gossip': 'Local News',
    'contentType.help_request': 'Neman Taimako',
    'contentType.job': 'Aiki',
    'contentType.event': 'Taro',
    'contentType.marketplace': 'Kasuwa',
    'contentType.emergency': 'Gaggawa',
    'createPost.title': 'Ƙirƙiri Sakwanni',
    'createPost.postType': 'Irin Sakwanni',
    'createPost.language': 'Harshe',
    'createPost.category': 'Rukuni (Ba dole ba)',
    'createPost.visibility': 'Ganewa',
    'createPost.posting': 'Ana bugawa...',
    'createPost.post': 'Buga',
    'createPost.postShared': 'An raba sakwanni!',
    'createPost.willAppear': 'Zai bayyana a saman fid ɗin ku.',
    'createPost.nigeriaOnly': 'Buga sakwanni yana samuwa ga masu amfani a Najeriya kawai.',
    'createPost.canInteract': 'Har yanzu za ka iya so, sharhi, ajiyewa, da raba sakwanni.',
    'createPost.hashtagHint': 'Yi amfani da #hashtags don tags (misali, #safety #event)',
    'settings.title': 'Saituna',
    'settings.notifications': 'Sanarwa',
    'settings.privacy': 'Sirri',
    'settings.account': 'Asusun',
    'settings.language': 'Harshe',
    'settings.languageDesc': 'Zaɓi harshen da kake so don amfanin manhaja.',
    'settings.languageSaved': 'An sabunta harshe',
    'common.save': 'Ajiye',
    'common.cancel': 'Soke',
    'common.close': 'Rufe',
    'common.loading': 'Ana lodawa...',
    'common.public': 'Jama\'a',
    'common.neighborhood': 'Unguwa',
    'common.ward': 'Ward',
  },
  yo: {
    'feed.yourHuud': 'Àdúgbò Rẹ',
    'feed.streetRadar': 'Radar Ọ̀nà',
    'feed.followingPlaces': 'Àwọn Ibi Tí O Ń Tẹ̀lé',
    'feed.composerPlaceholder': 'Kí ló ń ṣẹlẹ̀ nílé adúgbò rẹ?',
    'feed.newPost': 'Ìfiránṣẹ́ Tuntun',
    'feed.noPostsTitle': 'Kò sí ìfiránṣẹ́ ní agbègbè rẹ',
    'feed.noPostsSubtitle': 'Jẹ́ ẹni àkọ́kọ́ láti fi nǹkan ránṣẹ́!',
    'feed.failedToLoad': 'Kò lè ṣe ìgbékalẹ̀ feed',
    'feed.retry': 'Tun gbìyànjú',
    'feed.retrying': 'A ń tun gbìyànjú…',
    'feed.filterByType': 'Ṣàyẹ̀wò nípasẹ̀ irú',
    'feed.filterByDept': 'Ṣàyẹ̀wò nípasẹ̀ ẹ̀ka',
    'feed.allTypes': 'Gbogbo Irú',
    'feed.allDepartments': 'Gbogbo Ẹ̀ka',
    'explore.forYou': 'Fún Ọ',
    'explore.trending': 'Ohun tó ń trend',
    'explore.news': 'Ìròyìn',
    'contentType.post': 'Ìfiránṣẹ́',
    'contentType.fyi': 'FYI',
    'contentType.gossip': 'Local News',
    'contentType.help_request': 'Ìbéèrè Ìrànwọ́',
    'contentType.job': 'Iṣẹ́',
    'contentType.event': 'Àjọ',
    'contentType.marketplace': 'Ọjà',
    'contentType.emergency': 'Pàjáwìrì',
    'createPost.title': 'Ṣẹ̀dá Ìfiránṣẹ́',
    'createPost.postType': 'Irú Ìfiránṣẹ́',
    'createPost.language': 'Èdè',
    'createPost.category': 'Ẹ̀ka (Kì í ṣe dandan)',
    'createPost.visibility': 'Ìfihàn',
    'createPost.posting': 'A ń fi ránṣẹ́...',
    'createPost.post': 'Fi Ránṣẹ́',
    'createPost.postShared': 'A ti pín ìfiránṣẹ́!',
    'createPost.willAppear': 'Yóò hàn ní orí feed rẹ.',
    'createPost.nigeriaOnly': 'Ìfiranṣẹ́ wà fún àwọn tó wà ní Nàìjíríà nìkan.',
    'createPost.canInteract': 'O ṣì lè fẹ́ràn, sọ̀rọ̀, fi pamọ́, àti pín ìfiránṣẹ́.',
    'createPost.hashtagHint': 'Lo #hashtags fún tags (àpẹẹrẹ, #safety #event)',
    'settings.title': 'Ètò',
    'settings.notifications': 'Ìfitónilétí',
    'settings.privacy': 'Ìpamọ́',
    'settings.account': 'Àkọọ́lẹ̀',
    'settings.language': 'Èdè',
    'settings.languageDesc': 'Yan èdè tí o fẹ́ràn fún àwọn ohun èlò app.',
    'settings.languageSaved': 'A ti ṣe àtúnṣe èdè',
    'common.save': 'Fi Pamọ́',
    'common.cancel': 'Fagilee',
    'common.close': 'Pa',
    'common.loading': 'Ń gbé kalẹ̀...',
    'common.public': 'Gbogbo ènìyàn',
    'common.neighborhood': 'Àdúgbò',
    'common.ward': 'Ward',
  },
  ig: {
    'feed.yourHuud': 'Obodo Gị',
    'feed.streetRadar': 'Radar Okporo',
    'feed.followingPlaces': 'Ebe Ị Na-eso',
    'feed.composerPlaceholder': 'Gịnị na-eme na obodo gị?',
    'feed.newPost': 'Post Ọhụrụ',
    'feed.noPostsTitle': 'Ọ nweghị post dị na mpaghara gị',
    'feed.noPostsSubtitle': 'Bụrụ onye mbụ zipụtara ihe!',
    'feed.failedToLoad': 'Enweghi ike ibuga feed',
    'feed.retry': 'Nwalee ọzọ',
    'feed.retrying': 'Ana anwale ọzọ…',
    'feed.filterByType': 'Hazie site na ụdị',
    'feed.filterByDept': 'Hazie site na ngalaba',
    'feed.allTypes': 'Ụdị Niile',
    'feed.allDepartments': 'Ngalaba Niile',
    'explore.forYou': 'Maka Gị',
    'explore.trending': 'Ihe na-ekwu',
    'explore.news': 'Akụkọ',
    'contentType.post': 'Post',
    'contentType.fyi': 'FYI',
    'contentType.gossip': 'Local News',
    'contentType.help_request': 'Arịrịọ Enyemaka',
    'contentType.job': 'Ọrụ',
    'contentType.event': 'Mmemme',
    'contentType.marketplace': 'Ahịa',
    'contentType.emergency': 'Mberede',
    'createPost.title': 'Mepụta Post',
    'createPost.postType': 'Ụdị Post',
    'createPost.language': 'Asụsụ',
    'createPost.category': 'Ngalaba (Ọ bụghị nkwado)',
    'createPost.visibility': 'Ọhụhụ',
    'createPost.posting': 'Ana-ezipụ...',
    'createPost.post': 'Zipụ',
    'createPost.postShared': 'Ekesara post!',
    'createPost.willAppear': 'Ọ ga-apụta n\'elu feed gị.',
    'createPost.nigeriaOnly': 'Ịzipụta post dị maka ndị nọ na Nigeria naanị.',
    'createPost.canInteract': 'Ị ka nwere ike ịmasị, kọwa okwu, chekwaa, ma kekọrịta post.',
    'createPost.hashtagHint': 'Jiri #hashtags maka tags (dị ka, #safety #event)',
    'settings.title': 'Ntọala',
    'settings.notifications': 'Ọkwa',
    'settings.privacy': 'Nzuzo',
    'settings.account': 'Akaụntụ',
    'settings.language': 'Asụsụ',
    'settings.languageDesc': 'Họrọ asụsụ ị chọrọ maka ngwa ahụ.',
    'settings.languageSaved': 'Emelitela asụsụ',
    'common.save': 'Chekwaa',
    'common.cancel': 'Kagbuo',
    'common.close': 'Mechie',
    'common.loading': 'Na-ebugo...',
    'common.public': 'Ọha',
    'common.neighborhood': 'Obodo',
    'common.ward': 'Ward',
  },
  pcm: {
    'feed.yourHuud': 'Your Area',
    'feed.streetRadar': 'Street Radar',
    'feed.followingPlaces': 'Places Wey You Dey Follow',
    'feed.composerPlaceholder': 'Wetin dey happen for your area?',
    'feed.newPost': 'New Post',
    'feed.noPostsTitle': 'No post dey for your area',
    'feed.noPostsSubtitle': 'Be the first person wey go post something!',
    'feed.failedToLoad': 'E no fit load feed',
    'feed.retry': 'Try again',
    'feed.retrying': 'Dey try again…',
    'feed.filterByType': 'Filter by type',
    'feed.filterByDept': 'Filter by department',
    'feed.allTypes': 'All Types',
    'feed.allDepartments': 'All Departments',
    'explore.forYou': 'For You',
    'explore.trending': 'Trending',
    'explore.news': 'News',
    'contentType.post': 'Post',
    'contentType.fyi': 'FYI',
    'contentType.gossip': 'Local News',
    'contentType.help_request': 'Help Request',
    'contentType.job': 'Job',
    'contentType.event': 'Event',
    'contentType.marketplace': 'Market',
    'contentType.emergency': 'Emergency',
    'createPost.title': 'Create Post',
    'createPost.postType': 'Post Type',
    'createPost.language': 'Language',
    'createPost.category': 'Category (E no compulsory)',
    'createPost.visibility': 'Who go see am',
    'createPost.posting': 'Dey post...',
    'createPost.post': 'Post',
    'createPost.postShared': 'E don post!',
    'createPost.willAppear': 'E go show for top of your feed.',
    'createPost.nigeriaOnly': 'Only people wey dey Nigeria fit post.',
    'createPost.canInteract': 'You fit still like, comment, save, and share post.',
    'createPost.hashtagHint': 'Use #hashtags for tags (e.g., #safety #event)',
    'settings.title': 'Settings',
    'settings.notifications': 'Notifications',
    'settings.privacy': 'Privacy',
    'settings.account': 'Account',
    'settings.language': 'Language',
    'settings.languageDesc': 'Choose the language wey you want for app.',
    'settings.languageSaved': 'Language don update',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.loading': 'Dey load...',
    'common.public': 'Everybody',
    'common.neighborhood': 'Neighborhood',
    'common.ward': 'Ward',
  },
};

const LANGUAGE_NAMES: Record<AppLanguage, string> = {
  en: 'English',
  ha: 'Hausa',
  yo: 'Yorùbá',
  ig: 'Igbo',
  pcm: 'Pidgin',
};

interface I18nContextValue {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string) => string;
  languageNames: Record<AppLanguage, string>;
  availableLanguages: AppLanguage[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'neyborhuud_language';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as AppLanguage | null;
    if (stored && dictionaries[stored]) {
      setLanguageState(stored);
    } else {
      // Check user settings from auth data
      const userData = localStorage.getItem('neyborhuud_user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.settings?.language && dictionaries[user.settings.language as AppLanguage]) {
            setLanguageState(user.settings.language as AppLanguage);
          }
        } catch {}
      }
    }
  }, []);

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    // Also update the user settings in localStorage
    try {
      const userData = localStorage.getItem('neyborhuud_user');
      if (userData) {
        const user = JSON.parse(userData);
        user.settings = { ...user.settings, language: lang };
        localStorage.setItem('neyborhuud_user', JSON.stringify(user));
      }
    } catch {}
  }, []);

  const t = useCallback(
    (key: string): string => {
      return dictionaries[language]?.[key] ?? dictionaries.en[key] ?? key;
    },
    [language],
  );

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languageNames: LANGUAGE_NAMES,
        availableLanguages: ['en', 'ha', 'yo', 'ig', 'pcm'],
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback when used outside provider (SSR or tests)
    return {
      language: 'en' as AppLanguage,
      setLanguage: () => {},
      t: (key: string) => dictionaries.en[key] ?? key,
      languageNames: LANGUAGE_NAMES,
      availableLanguages: ['en', 'ha', 'yo', 'ig', 'pcm'] as AppLanguage[],
    };
  }
  return context;
}

