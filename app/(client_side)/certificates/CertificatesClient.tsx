"use client";

import React, { useState } from 'react';
import { Award, Download, ExternalLink, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Certificate {
    id: number;
    recipient_name: string;
    recipient_email: string;
    issued_at: string | null;
    access_token: string;
    status: string;
    Event: {
        title: string | null;
        event_start_at: string | null;
    } | null;
    CertificateTemplate: {
        name: string | null;
    } | null;
}

interface CertificatesClientProps {
    certificates: Certificate[];
    userEmail: string;
}

export default function CertificatesClient({ certificates, userEmail }: CertificatesClientProps) {
    const [filter, setFilter] = useState<'all' | 'issued' | 'queued'>('all');

    const filteredCertificates = certificates.filter(cert => {
        if (filter === 'all') return true;
        if (filter === 'issued') return cert.status === 'issued' || cert.status === 'sent';
        return cert.status === filter;
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'issued':
            case 'sent':
                return <CheckCircle size={16} className="text-emerald-500" />;
            case 'queued':
                return <Clock size={16} className="text-amber-500" />;
            case 'failed':
                return <AlertCircle size={16} className="text-red-500" />;
            default:
                return null;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'issued':
                return 'Issued';
            case 'sent':
                return 'Sent';
            case 'queued':
                return 'Processing';
            case 'failed':
                return 'Failed';
            default:
                return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'issued':
            case 'sent':
                return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
            case 'queued':
                return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
            case 'failed':
                return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
            default:
                return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
        }
    };

    return (
        <main className="flex-1 overflow-y-auto w-full">
            <div className="max-w-6xl mx-auto px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-24 md:p-12 md:pb-12 lg:p-16">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] rounded-2xl flex items-center justify-center shadow-lg">
                            <Award className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                My Certificates
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                View and download your event certificates
                            </p>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                filter === 'all'
                                    ? 'bg-[#3D518C] text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            All ({certificates.length})
                        </button>
                        <button
                            onClick={() => setFilter('issued')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                filter === 'issued'
                                    ? 'bg-[#3D518C] text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            Issued ({certificates.filter(c => c.status === 'issued' || c.status === 'sent').length})
                        </button>
                        <button
                            onClick={() => setFilter('queued')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                filter === 'queued'
                                    ? 'bg-[#3D518C] text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            Processing ({certificates.filter(c => c.status === 'queued').length})
                        </button>
                    </div>
                </div>

                {/* Certificates Grid */}
                {filteredCertificates.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <Award size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No certificates found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {filter === 'all' 
                                ? "You haven't been issued any certificates yet."
                                : `No certificates with status "${filter}" found.`
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCertificates.map((certificate) => (
                            <div
                                key={certificate.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
                            >
                                {/* Certificate Header */}
                                <div className="bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">
                                                {certificate.CertificateTemplate?.name || 'Certificate'}
                                            </h3>
                                            <p className="text-sm text-white/80 line-clamp-1">
                                                {certificate.Event?.title || 'Event'}
                                            </p>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(certificate.status)}`}>
                                            {getStatusIcon(certificate.status)}
                                            {getStatusText(certificate.status)}
                                        </div>
                                    </div>
                                </div>

                                {/* Certificate Body */}
                                <div className="p-6 space-y-4">
                                    {/* Recipient Name */}
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            Issued to
                                        </p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {certificate.recipient_name}
                                        </p>
                                    </div>

                                    {/* Issue Date */}
                                    {certificate.issued_at && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <Calendar size={14} />
                                            <span>
                                                {new Date(certificate.issued_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    )}

                                    {/* Event Date */}
                                    {certificate.Event?.event_start_at && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                            <Calendar size={14} />
                                            <span>
                                                Event: {new Date(certificate.Event.event_start_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                                        <Link
                                            href={`/certificates/${certificate.access_token}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#3D518C] hover:bg-[#5C6BC0] text-white text-sm font-medium rounded-xl transition-colors"
                                        >
                                            <ExternalLink size={14} />
                                            View
                                        </Link>
                                        {(certificate.status === 'issued' || certificate.status === 'sent') && (
                                            <Link
                                                href={`/api/certificates/${certificate.access_token}/download`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-colors"
                                            >
                                                <Download size={14} />
                                                Download
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
