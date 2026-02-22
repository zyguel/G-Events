"use client";

import React, { useState, useRef } from 'react';
import { Award, Upload, Download, X, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import { EventSummary } from '@/lib/types';

interface Certificate {
    id: string;
    name: string;
    backgroundImage: string;
    nameX: number;
    nameY: number;
    fontSize: number;
    fontColor: string;
    createdAt: Date;
}

interface CertificatesClientProps {
    event: EventSummary;
}

export default function CertificatesClient({ event }: CertificatesClientProps) {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [templateName, setTemplateName] = useState('');
    const [backgroundImage, setBackgroundImage] = useState<string>('');
    const [nameX, setNameX] = useState(150);
    const [nameY, setNameY] = useState(150);
    const [fontSize, setFontSize] = useState(28);
    const [fontColor, setFontColor] = useState('#000000');
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const previewRef = useRef<HTMLDivElement>(null);
    const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<string>('');

    const participants = [
        { id: '1', name: 'John Smith', email: 'john@example.com' },
        { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com' },
        { id: '3', name: 'Michael Brown', email: 'michael@example.com' },
        { id: '4', name: 'Emily Davis', email: 'emily@example.com' },
        { id: '5', name: 'Robert Wilson', email: 'robert@example.com' },
    ];

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

    const createCertificate = () => {
        if (!templateName.trim()) {
            showToast('Enter template name');
            return;
        }
        if (!backgroundImage) {
            showToast('Upload background');
            return;
        }
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
        showToast('Template created!');
    };

    const generatePDFs = async () => {
        if (!selectedCert) {
            showToast('Select template');
            return;
        }
        setIsLoading(true);
        try {
            for (const participant of participants) {
                const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [800, 600] });
                const img = new Image();
                img.onload = () => {
                    pdf.addImage(img, 'PNG', 0, 0, 800, 600);
                    pdf.setFont('Arial');
                    pdf.setFontSize(selectedCert.fontSize);
                    pdf.setTextColor(
                        parseInt(selectedCert.fontColor.slice(1, 3), 16),
                        parseInt(selectedCert.fontColor.slice(3, 5), 16),
                        parseInt(selectedCert.fontColor.slice(5, 7), 16)
                    );
                    pdf.text(participant.name, selectedCert.nameX, selectedCert.nameY);
                    pdf.save(`${selectedCert.name}_${participant.name}.pdf`);
                };
                img.src = selectedCert.backgroundImage;
            }
            showToast(`Generated ${participants.length} certificates!`);
        } catch (error) {
            showToast('Error generating');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteCertificate = (id: string) => {
        setCertificates(certificates.filter(c => c.id !== id));
        if (selectedCert?.id === id) setSelectedCert(null);
        showToast('Deleted');
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
                        <p className="text-sm text-gray-500 dark:text-gray-400">{participants.length} attendees</p>
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
                        <button onClick={() => generatePDFs()} disabled={!selectedCert || isLoading || certificates.length === 0} className="px-4 py-2 bg-emerald-500 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 font-medium hover:bg-emerald-600">
                            {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                            Generate ({participants.length})
                        </button>
                    </div>

                    {certificates.length === 0 ? (
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
                                            <button onClick={(e) => { e.stopPropagation(); generatePDFs(); }} className="w-full px-3 py-2 bg-[#3D518C] text-white text-xs font-medium rounded hover:bg-[#3D518C]/90">
                                                Generate & Download
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
