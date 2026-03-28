"use client";


import React, { useEffect, useRef, useState } from 'react';
import { Award, Upload, Download, X, RefreshCw, Mail } from 'lucide-react';
import { EventSummary } from '@/lib/types';

interface CertificateTemplate {
    id: string;
    name: string;
    backgroundImage: string;
    nameX: number;
    nameY: number;
    fontSize: number;
    fontColor: string;
    createdAt: Date;
}

interface CertificateRecipient {
    registrationId: number | null;
    name: string;
    email: string;
}

interface CertificatesClientProps {
    event: EventSummary;
}

export default function CertificatesClient({ event }: CertificatesClientProps) {
    const [certificates, setCertificates] = useState<CertificateTemplate[]>([]);
    const [recipients, setRecipients] = useState<CertificateRecipient[]>([]);
    const [templateName, setTemplateName] = useState('');
    const [backgroundImage, setBackgroundImage] = useState<string>('');
    const [nameX, setNameX] = useState(150);
    const [nameY, setNameY] = useState(150);
    const [fontSize, setFontSize] = useState(28);
    const [fontColor, setFontColor] = useState('#000000');
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const previewRef = useRef<HTMLDivElement>(null);
    const [selectedCert, setSelectedCert] = useState<CertificateTemplate | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(!event.id.startsWith('evt-'));
    const [toast, setToast] = useState<string>('');

    const showToast = (message: string) => {
        setToast(message);
        setTimeout(() => setToast(''), 3000);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            setBackgroundImage(result);
            showToast('Image uploaded! Drag to position.');
        };
        reader.readAsDataURL(file);
    };

    const handleNameMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!previewRef.current) return;
        const rect = previewRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left - nameX,
            y: e.clientY - rect.top - nameY,
        });
        setIsDragging(true);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging || !previewRef.current) return;
        const rect = previewRef.current.getBoundingClientRect();
        let newX = e.clientX - rect.left - dragOffset.x;
        let newY = e.clientY - rect.top - dragOffset.y;
        newX = Math.max(0, Math.min(newX, rect.width - 100));
        newY = Math.max(0, Math.min(newY, rect.height - 30));
        setNameX(Math.round(newX));
        setNameY(Math.round(newY));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const loadData = async () => {
        if (event.id.startsWith('evt-')) {
            setIsInitialLoading(false);
            return;
        }
        try {
            setIsInitialLoading(true);
            const [templatesRes, recipientsRes] = await Promise.all([
                fetch(`/api/events/${event.id}/certificates/templates`),
                fetch(`/api/events/${event.id}/certificates/recipients`),
            ]);

            const templatesJson = await templatesRes.json().catch(() => ({}));
            const recipientsJson = await recipientsRes.json().catch(() => ({}));

            if (!templatesRes.ok || !templatesJson?.success) {
                throw new Error(templatesJson?.error || `Failed loading templates (${templatesRes.status})`);
            }
            if (!recipientsRes.ok || !recipientsJson?.success) {
                throw new Error(recipientsJson?.error || `Failed loading recipients (${recipientsRes.status})`);
            }

            const mappedTemplates: CertificateTemplate[] = (templatesJson.data || []).map((row: any) => ({
                id: String(row.id),
                name: row.name,
                backgroundImage: row.background_image,
                nameX: row.name_x,
                nameY: row.name_y,
                fontSize: row.font_size,
                fontColor: row.font_color,
                createdAt: new Date(row.created_at),
            }));

            setCertificates(mappedTemplates);
            setRecipients(recipientsJson.data || []);
        } catch (e) {
            console.error("Failed loading certificate data:", e);
            showToast(e instanceof Error ? e.message : "Failed loading certificate data");
        } finally {
            setIsInitialLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event.id]);

    const createCertificate = async () => {
        if (!templateName.trim()) {
            showToast('Enter template name');
            return;
        }
        if (!backgroundImage) {
            showToast('Upload background');
            return;
        }

        if (event.id.startsWith('evt-')) {
            setCertificates([...certificates, {
                id: `cert-${Date.now()}`,
                name: templateName,
                backgroundImage,
                nameX,
                nameY,
                fontSize,
                fontColor,
                createdAt: new Date(),
            }]);
            setTemplateName('');
            setBackgroundImage('');
            setNameX(150);
            setNameY(150);
            showToast('Template created (local draft event).');
            return;
        }

        try {
            setIsLoading(true);
            const res = await fetch(`/api/events/${event.id}/certificates/templates`, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: templateName,
                    backgroundImage,
                    nameX,
                    nameY,
                    fontSize,
                    fontColor,
                }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json?.success) {
                throw new Error(json?.error || `Failed creating template (${res.status})`);
            }
            setTemplateName('');
            setBackgroundImage('');
            setNameX(150);
            setNameY(150);
            showToast('Template created!');
            await loadData();
        } catch (e) {
            console.error("Create template error:", e);
            showToast(e instanceof Error ? e.message : "Error creating template");
        } finally {
            setIsLoading(false);
        }
    };

    const issueCertificates = async (queueEmail: boolean) => {
        if (!selectedCert) {
            showToast('Select template');
            return;
        }
        if (recipients.length === 0 && !event.id.startsWith('evt-')) {
            showToast('No eligible recipients for certificates');
            return;
        }

        setIsLoading(true);
        try {
            if (event.id.startsWith('evt-')) {
                showToast(queueEmail ? 'Queued certificate emails (simulated).' : 'Certificates issued (simulated).');
                return;
            }

            const recipientIds = recipients
                .map((r) => r.registrationId)
                .filter((id): id is number => typeof id === "number");

            const res = await fetch(`/api/events/${event.id}/certificates/issue`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    templateId: Number(selectedCert.id),
                    recipientIds,
                    queueEmail,
                }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json?.success) {
                throw new Error(json?.error || `Failed issuing certificates (${res.status})`);
            }

            if (queueEmail) {
                const sent = json?.emailProcessing?.sent ?? 0;
                const failed = json?.emailProcessing?.failed ?? 0;
                showToast(`Issued ${json?.issuedCount ?? 0}. Email sent: ${sent}, failed: ${failed}.`);
            } else {
                showToast(`Issued ${json?.issuedCount ?? 0} certificates.`);
            }
        } catch (error) {
            showToast('Error issuing certificates');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteCertificate = async (id: string) => {
        if (event.id.startsWith('evt-')) {
            setCertificates(certificates.filter(c => c.id !== id));
            if (selectedCert?.id === id) setSelectedCert(null);
            showToast('Deleted');
            return;
        }

        try {
            const res = await fetch(`/api/events/${event.id}/certificates/templates/${id}`, {
                method: "DELETE",
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json?.success) {
                throw new Error(json?.error || `Failed deleting template (${res.status})`);
            }
            if (selectedCert?.id === id) setSelectedCert(null);
            showToast('Template deleted');
            await loadData();
        } catch (e) {
            console.error("Delete template error:", e);
            showToast(e instanceof Error ? e.message : "Failed deleting template");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] rounded-xl flex items-center justify-center">
                        <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Certificates</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{recipients.length} eligible recipients</p>
                    </div>
                </div>

                {toast && (
                    <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50">
                        {toast}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-lg font-semibold mb-4">1. Upload Background</h2>
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
                            <label htmlFor="image-upload" className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#3D518C] hover:bg-[#3D518C]/5">
                                <Upload className="w-8 h-8 text-gray-400 mr-2" />
                                <span>{backgroundImage ? '✓ Image uploaded' : 'Upload image'}</span>
                            </label>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                            <h2 className="text-lg font-semibold">2. Configure</h2>
                            <input type="text" placeholder="Template name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-[#3D518C]" />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Font Size: {fontSize}px</label>
                                    <input type="range" min="12" max="72" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full" />
                                </div>
                                <div>
                                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Color</label>
                                    <input type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="w-full h-10 rounded" />
                                </div>
                            </div>
                            <button onClick={createCertificate} disabled={!templateName || !backgroundImage} className="w-full px-4 py-3 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white rounded-lg disabled:opacity-50 font-medium flex items-center justify-center gap-2">
                                <Award size={16} />
                                Create Template
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-lg font-semibold mb-4">3. Preview</h2>
                            <div ref={previewRef} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} className="relative w-full bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-300" style={{ aspectRatio: '3/4', minHeight: '300px' }}>
                                {backgroundImage ? (
                                    <>
                                        <img src={backgroundImage} alt="background" className="w-full h-full object-cover" />
                                        <div onMouseDown={handleNameMouseDown} className={`absolute px-3 py-2 bg-white/90 border-2 border-dashed border-[#3D518C] rounded cursor-move select-none ${isDragging ? 'ring-2 ring-[#3D518C]' : 'hover:ring-2 hover:ring-[#3D518C]/50'}`} style={{ left: `${nameX}px`, top: `${nameY}px`, fontSize: `${fontSize}px`, color: fontColor, fontWeight: 'bold' }}>
                                            Attendee Name
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Upload image</div>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">X: {nameX}, Y: {nameY}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Templates ({certificates.length})</h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => issueCertificates(false)}
                                disabled={!selectedCert || isLoading || certificates.length === 0 || isInitialLoading}
                                className="px-4 py-2 bg-emerald-500 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 font-medium hover:bg-emerald-600"
                            >
                                {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                                Issue ({recipients.length})
                            </button>
                            <button
                                onClick={() => issueCertificates(true)}
                                disabled={!selectedCert || isLoading || certificates.length === 0 || isInitialLoading}
                                className="px-4 py-2 bg-[#3D518C] text-white rounded-lg disabled:opacity-50 flex items-center gap-2 font-medium hover:bg-[#324373]"
                            >
                                <Mail size={16} />
                                Issue + Email
                            </button>
                        </div>
                    </div>

                    {isInitialLoading ? (
                        <div className="text-center py-12 text-gray-500">Loading certificate data...</div>
                    ) : certificates.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>Create a template above</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {certificates.map((cert) => (
                                <div key={cert.id} onClick={() => setSelectedCert(cert)} className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedCert?.id === cert.id ? 'border-[#3D518C] bg-[#3D518C]/10' : 'border-gray-200 dark:border-gray-600 hover:border-[#3D518C]/50'}`}>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{cert.name}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{cert.fontSize}px • {cert.fontColor}</p>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); deleteCertificate(cert.id); }} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                                            <X size={16} />
                                        </button>
                                    </div>
                                    {selectedCert?.id === cert.id && (
                                        <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Position: X: {cert.nameX}, Y: {cert.nameY}</p>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); issueCertificates(false); }}
                                                className="w-full px-3 py-2 bg-[#3D518C] text-white text-xs font-medium rounded hover:bg-[#3D518C]/90"
                                            >
                                                Issue Certificates
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
