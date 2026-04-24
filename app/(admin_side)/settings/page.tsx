"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import { User, Globe, ChevronRight, Search } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import Modal, { ModalFooter } from '@/components/admin/Modal';
import { useLocale } from '@/contexts/LocaleContext';
import {
    getLanguageLabel,
} from '@/lib/i18n';

import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const router = useRouter();
    const { preferences, setPreferences, addNotification } = useNotifications();
    const { locale, saveLocale, t, availableLanguages } = useLocale();

    const [isLocaleModalOpen, setIsLocaleModalOpen] = useState(false);
    const [language, setLanguage] = useState<string>(locale.language);
    const [region, setRegion] = useState<string>(locale.region);
    const [languageSearch, setLanguageSearch] = useState('');
    const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
    const [regionSearch, setRegionSearch] = useState('');
    const [regionOptions, setRegionOptions] = useState<Array<{ code: string; label: string }>>([]);
    const [isSavingLocale, setIsSavingLocale] = useState(false);
    const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
    const languageInputRef = useRef<HTMLInputElement | null>(null);

    const getRegionLabel = (code: string) => regionOptions.find((item) => item.code === code)?.label ?? code;
    const languageDisplayOptions = useMemo(() => availableLanguages.map((item) => {
        const label = item.nativeName ? `${item.name} • ${item.nativeName} (${item.code.toUpperCase()})` : `${item.name} (${item.code.toUpperCase()})`;
        const searchTerms = [
            item.code,
            item.name,
            item.nativeName,
            label,
            ...(item.aliases ?? []),
        ].filter((term): term is string => typeof term === 'string' && term.trim().length > 0);

        return {
            code: item.code,
            name: item.name,
            nativeName: item.nativeName,
            label,
            searchTerms,
        };
    }), [availableLanguages]);

    const rankLanguage = (query: string, option: { code: string; name: string; nativeName?: string; searchTerms: string[] }) => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) {
            return 0;
        }

        const code = option.code.toLowerCase();
        const name = option.name.toLowerCase();
        const nativeName = option.nativeName?.toLowerCase() ?? '';
        const aliases = option.searchTerms.map((term) => term.toLowerCase());

        if (code === normalizedQuery || name === normalizedQuery || nativeName === normalizedQuery || aliases.some((term) => term === normalizedQuery)) {
            return 1000;
        }

        if (code.startsWith(normalizedQuery)) {
            return 850;
        }

        if (name.startsWith(normalizedQuery) || nativeName.startsWith(normalizedQuery) || aliases.some((term) => term.startsWith(normalizedQuery))) {
            return 700;
        }

        const containsInName = name.includes(normalizedQuery) || nativeName.includes(normalizedQuery) || aliases.some((term) => term.includes(normalizedQuery));
        if (containsInName) {
            return 500;
        }

        return -1;
    };

    const filteredLanguageOptions = useMemo(() => {
        const query = languageSearch.trim();
        const selectedOption = languageDisplayOptions.find((option) => option.code === language);

        const prioritizeSelected = (options: typeof languageDisplayOptions) => {
            if (!selectedOption) {
                return options;
            }

            return [selectedOption, ...options.filter((option) => option.code !== selectedOption.code)];
        };

        if (!query) {
            return prioritizeSelected(languageDisplayOptions).slice(0, 8);
        }

        const ranked = languageDisplayOptions
            .map((option) => ({ option, score: rankLanguage(query, option) }))
            .filter((entry) => entry.score >= 0)
            .sort((left, right) => {
                if (right.score !== left.score) {
                    return right.score - left.score;
                }
                return left.option.name.localeCompare(right.option.name);
            })
            .map((entry) => entry.option);

        if (!ranked.length) {
            return prioritizeSelected(languageDisplayOptions).slice(0, 8);
        }

        return prioritizeSelected(ranked).slice(0, 8);
    }, [languageDisplayOptions, languageSearch, language]);

    const currentSelection = `${getLanguageLabel(locale.language, availableLanguages)} • ${getRegionLabel(locale.region)}`;

    const settingsSections = [
        {
            id: 'account',
            title: t('Account Settings'),
            description: t('Manage your account details and preferences'),
            icon: User,
            color: 'from-blue-500 to-indigo-600',
        },


        {
            id: 'language',
            title: t('Language & Region'),
            description: t('Set your preferred language and region'),
            icon: Globe,
            color: 'from-cyan-500 to-blue-500',
        },
    ];

    const openLanguageModal = () => {
        setLanguage(locale.language);
        setRegion(locale.region);
        const languageMatch = languageDisplayOptions.find((item) => item.code === locale.language);
        const regionMatch = regionOptions.find((item) => item.code === locale.region);
        setLanguageSearch(languageMatch?.label ?? locale.language);
        setRegionSearch(regionMatch?.label ?? locale.region);
        setIsLanguageDropdownOpen(false);
        setIsLocaleModalOpen(true);
    };

    const selectLanguage = useCallback((code: string) => {
        const match = languageDisplayOptions.find((item) => item.code === code);
        if (!match) {
            return;
        }

        setLanguage(match.code);
        setLanguageSearch(match.label);
        setIsLanguageDropdownOpen(false);
    }, [languageDisplayOptions]);

    const handleSaveLocale = async () => {
        setIsSavingLocale(true);
        const ok = await saveLocale({ language, region });
        setIsSavingLocale(false);

        if (ok) {
            addNotification({
                type: 'success',
                title: t('Language & Region'),
                message: t('Language preference saved successfully.'),
            });
            setIsLocaleModalOpen(false);
            return;
        }

        addNotification({
            type: 'alert',
            title: t('Language & Region'),
            message: t('Unable to save language preference.'),
        });
    };

    const loadRegions = useCallback(async () => {
        try {
            const response = await fetch('/api/regions', { cache: 'no-store' });
            const payload = await response.json();
            if (response.ok && Array.isArray(payload?.data)) {
                setRegionOptions(payload.data);
            }
        } catch {
        }
    }, []);

    const handleLanguageSearchChange = (value: string) => {
        setLanguageSearch(value);
        setIsLanguageDropdownOpen(true);
        const codeMatch = value.match(/\(([A-Za-z]{2,8})\)\s*$/);
        if (codeMatch?.[1]) {
            setLanguage(codeMatch[1].toLowerCase());
            return;
        }
        const normalized = value.trim().toLowerCase();
        const match = languageDisplayOptions.find(
            (item) =>
                item.label.toLowerCase() === normalized
                || item.name.toLowerCase() === normalized
                || (item.nativeName?.toLowerCase() ?? '') === normalized
                || item.code.toLowerCase() === normalized
                || item.searchTerms.some((term) => term.toLowerCase() === normalized)
        );
        if (match) {
            setLanguage(match.code);
        }
    };

    const handleRegionSearchChange = (value: string) => {
        setRegionSearch(value);
        const normalized = value.trim().toLowerCase();
        const codeMatch = value.match(/\(([A-Za-z]{2,3})\)\s*$/);
        if (codeMatch?.[1]) {
            setRegion(codeMatch[1].toUpperCase());
            return;
        }
        const match = regionOptions.find(
            (item) => item.label.toLowerCase() === normalized || item.code.toLowerCase() === normalized
        );
        if (match) {
            setRegion(match.code);
        }
    };

    useEffect(() => {
        loadRegions();
    }, [loadRegions]);

    return (
        <>
            <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
                <Header />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar activePage="settings" />

                <main className="flex-1 lg:ml-20 overflow-y-auto p-8">
                    <div className="space-y-6 max-w-4xl mx-auto">

                        {/* Header Section */}
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {t('Settings')}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                {t('Manage your account settings and preferences')}
                            </p>
                        </div>

                        {/* Settings Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {settingsSections.map((section) => {
                                const IconComponent = section.icon;
                                return (
                                    <div
                                        key={section.id}
                                        onClick={() => {
                                            if (section.id === 'account') {
                                                router.push('/profile');
                                                return;
                                            }
                                            if (section.id === 'language') {
                                                openLanguageModal();
                                            }
                                        }}
                                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105 hover:-translate-y-1"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${section.color} flex items-center justify-center text-white`}>
                                                    <IconComponent size={22} />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">{section.title}</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{section.description}</p>
                                                    {section.id === 'language' && (
                                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{currentSelection}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight size={20} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Notification Preferences */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300 hover:shadow-lg">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                                <h2 className="font-semibold text-gray-900 dark:text-white">{t('Notification Preferences')}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('Choose what notifications you receive')}</p>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                <div className="p-5 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">{t('Email Notifications')}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('Receive notifications via email')}</p>
                                    </div>
                                    <button
                                        onClick={() => setPreferences(prev => ({ ...prev, email: !prev.email }))}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${preferences.email ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                                    >
                                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${preferences.email ? 'translate-x-6' : ''}`}></span>
                                    </button>
                                </div>
                                <div className="p-5 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">{t('Push Notifications')}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('Receive push notifications in browser')}</p>
                                    </div>
                                    <button
                                        onClick={() => setPreferences(prev => ({ ...prev, push: !prev.push }))}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${preferences.push ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                                    >
                                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${preferences.push ? 'translate-x-6' : ''}`}></span>
                                    </button>
                                </div>

                                <div className="p-5 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">{t('Event Updates')}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('Get notified about event changes')}</p>
                                    </div>
                                    <button
                                        onClick={() => setPreferences(prev => ({ ...prev, updates: !prev.updates }))}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${preferences.updates ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                                    >
                                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${preferences.updates ? 'translate-x-6' : ''}`}></span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm transition-all duration-300 hover:shadow-lg">
                            <div className="p-6 border-b border-red-100 dark:border-red-900/30">
                                <h2 className="font-semibold text-red-600 dark:text-red-400">{t('Danger Zone')}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('Irreversible and destructive actions')}</p>
                            </div>
                            <div className="p-5 flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">{t('Delete Account')}</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('Permanently delete your account and all data')}</p>
                                </div>
                                <button
                                    onClick={() => setIsDeleteAccountModalOpen(true)}
                                    className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                >
                                    {t('Delete Account')}
                                </button>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
            </div>

            <Modal
                isOpen={isDeleteAccountModalOpen}
                onClose={() => setIsDeleteAccountModalOpen(false)}
                title={t('Delete Account')}
                subtitle={t('This action is irreversible.')}
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        {t('Deleting your account will permanently remove your profile and associated data. This cannot be undone.')}
                    </p>
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 p-3 text-sm text-red-700 dark:text-red-300">
                        {t('You are about to perform an irreversible action.')}
                    </div>
                </div>

                <ModalFooter
                    onCancel={() => setIsDeleteAccountModalOpen(false)}
                    cancelText={t('Cancel')}
                    onSave={() => setIsDeleteAccountModalOpen(false)}
                    saveText={t('Delete Account')}
                    submitType="button"
                    isDanger
                />
            </Modal>

            <Modal
                isOpen={isLocaleModalOpen}
                onClose={() => setIsLocaleModalOpen(false)}
                title={t('Language & Region')}
                subtitle={t('Choose your preferred language and region for this account.')}
                size="md"
            >
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            {t('Language')}
                        </label>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                ref={languageInputRef}
                                type="text"
                                value={languageSearch}
                                onChange={(event) => handleLanguageSearchChange(event.target.value)}
                                onFocus={() => setIsLanguageDropdownOpen(true)}
                                onBlur={() => {
                                    window.setTimeout(() => {
                                        if (document.activeElement !== languageInputRef.current) {
                                            setIsLanguageDropdownOpen(false);
                                        }
                                    }, 120);
                                }}
                                placeholder={t('Search language')}
                                autoComplete="off"
                                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                            />
                            {isLanguageDropdownOpen && (
                                <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg">
                                    {filteredLanguageOptions.length > 0 ? (
                                        filteredLanguageOptions.map((lang) => (
                                            <button
                                                key={lang.code}
                                                type="button"
                                                onMouseDown={(event) => {
                                                    event.preventDefault();
                                                    selectLanguage(lang.code);
                                                }}
                                                className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${lang.code === language ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                            >
                                                <span className="font-medium">{lang.name}</span>
                                                {lang.nativeName && <span className="ml-2 text-gray-500 dark:text-gray-400">{lang.nativeName}</span>}
                                                <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">{lang.code.toUpperCase()}</span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400">{t('No languages found')}</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            {t('Region')}
                        </label>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                list="region-options"
                                value={regionSearch}
                                onChange={(event) => handleRegionSearchChange(event.target.value)}
                                placeholder={t('Search country')}
                                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                            />
                        </div>
                        <datalist id="region-options">
                            {regionOptions.map((regionOption) => (
                                <option key={regionOption.code} value={`${regionOption.label} (${regionOption.code})`} />
                            ))}
                        </datalist>
                    </div>

                    <div className="rounded-xl bg-gray-50 dark:bg-gray-700/70 border border-gray-200 dark:border-gray-600 px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium text-gray-800 dark:text-gray-100">{t('Current selection')}:</span>{' '}
                        {getLanguageLabel(language, availableLanguages)} • {getRegionLabel(region)}
                    </div>
                </div>

                <ModalFooter
                    onCancel={() => setIsLocaleModalOpen(false)}
                    cancelText={t('Cancel')}
                    onSave={handleSaveLocale}
                    submitType="button"
                    saveText={t('Save Changes')}
                    isSubmitting={isSavingLocale}
                />
            </Modal>
        </>
    );
}
