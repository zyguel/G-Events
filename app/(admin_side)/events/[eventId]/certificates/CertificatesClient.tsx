"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import EventsSidebar from '@/components/admin/EventsSidebar';
import { Award, Upload, Download, Send, Clock, Eye, Users, Check, X, Calendar, Trash2, RefreshCw, Type, Palette, Edit2, Plus, FileText, GripHorizontal, AlertCircle } from 'lucide-react';
import Modal from '@/components/admin/Modal';
import TimeInput from '@/components/admin/TimeInput';
import DateInput from '@/components/admin/DateInput';
import jsPDF from 'jspdf';
import { EventSummary } from '@/lib/api';

// Toast notification component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColor = type === 'success' ? 'from-emerald-500 to-green-600' : type === 'error' ? 'from-red-500 to-rose-600' : 'from-blue-500 to-indigo-600';
    const Icon = type === 'success' ? Check : type === 'error' ? X : Award;

    return (
        <div className={`fixed bottom-6 right-6 z-50 bg-gradient-to-r ${bgColor} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up`}>
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Icon size={18} />
            </div>
            <span className="font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 hover:bg-white/20 rounded-lg p-1 transition-colors">
                <X size={16} />
            </button>
        </div>
    );
};

// Certificate interface
interface TextBox {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    placeholder: string;
    fontSize: number;
    fontFamily: string;
}

interface Certificate {
    id: string;
    name: string;
    templateType: 'upload' | 'generate';
    fontFamily: string;
    fontSize: number;
    pdfData?: string;
    textBoxes: TextBox[];
    createdAt: Date;
    updatedAt: Date;
    status: 'active' | 'draft';
}

interface CertificateSend {
    id: string;
    certificateId: string;
    certificateName: string;
    recipientCount: number;
    sentAt: Date;
    status: 'sent' | 'scheduled' | 'draft';
    scheduledFor?: Date;
}

// Checkbox component
const Checkbox = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
    <div
        onClick={onChange}
        className="flex items-center gap-3 cursor-pointer group py-1.5 select-none"
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(); } }}
    >
        <div className={`w-5 h-5 border-2 rounded-md transition-all duration-200 flex items-center justify-center ${checked
            ? 'bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] border-transparent shadow-md'
            : 'border-gray-300 dark:border-gray-600 group-hover:border-[#3D518C] group-hover:shadow-sm'}`}>
            {checked && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
            )}
        </div>
        <span className={`text-sm transition-colors duration-200 ${checked ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'}`}>{label}</span>
    </div>
);

// Radio button component
const RadioButton = ({ label, checked, onChange, icon: Icon }: { label: string; checked: boolean; onChange: () => void; icon?: React.ElementType }) => (
    <div
        onClick={onChange}
        className={`flex items-center gap-3 cursor-pointer group p-3 rounded-xl transition-all duration-200 select-none ${checked
            ? 'bg-gradient-to-r from-[#3D518C]/10 to-[#5C6BC0]/10 border border-[#3D518C]/30'
            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'}`}
        role="radio"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(); } }}
    >
        <div className={`w-5 h-5 border-2 rounded-full transition-all duration-200 flex items-center justify-center ${checked ? 'border-[#3D518C]' : 'border-gray-300 dark:border-gray-600 group-hover:border-[#3D518C]'}`}>
            {checked && <div className="w-2.5 h-2.5 bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] rounded-full" />}
        </div>
        {Icon && <Icon size={16} className={`${checked ? 'text-[#3D518C]' : 'text-gray-400'} transition-colors duration-200`} />}
        <span className={`text-sm transition-colors duration-200 ${checked ? 'text-[#3D518C] dark:text-[#7986CB] font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{label}</span>
    </div>
);

// Draggable Text Box Component
const DraggableTextBox = ({
    textBox,
    isSelected,
    onSelect,
    onDragStart,
    onDragEnd,
    onDelete,
    scale = 1
}: {
    textBox: TextBox;
    isSelected: boolean;
    onSelect: () => void;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onDelete: () => void;
    scale?: number;
}) => {
    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={onSelect}
            className={`absolute cursor-move transition-all duration-200 ${isSelected ? 'ring-2 ring-[#3D518C] shadow-lg' : 'ring-1 ring-gray-300 dark:ring-gray-600 hover:ring-[#3D518C]'}`}
            style={{
                left: `${textBox.x * scale}px`,
                top: `${textBox.y * scale}px`,
                width: `${textBox.width * scale}px`,
                height: `${textBox.height * scale}px`,
                backgroundColor: isSelected ? 'rgba(61, 81, 140, 0.1)' : 'rgba(255, 255, 255, 0.8)',
                borderRadius: '4px',
                padding: '4px',
                zIndex: isSelected ? 50 : 10,
            }}
        >
            <div className="flex items-center justify-between h-full">
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                        {textBox.placeholder}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        {textBox.fontSize}px
                    </p>
                </div>
                {isSelected && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="ml-1 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                        <X size={12} />
                    </button>
                )}
            </div>
        </div>
    );
};

interface CertificatesClientProps {
    event: EventSummary;
}

export default function CertificatesClient({ event }: CertificatesClientProps) {
    const [activeTab, setActiveTab] = useState<'templates' | 'send' | 'history'>('templates');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Template states
    const [templateName, setTemplateName] = useState('');
    const [templateType, setTemplateType] = useState<'upload' | 'generate'>('generate');
    const [fontFamily, setFontFamily] = useState('Arial');
    const [fontSize, setFontSize] = useState(24);
    const [selectedTemplate, setSelectedTemplate] = useState<Certificate | null>(null);
    const [editingTemplate, setEditingTemplate] = useState<Certificate | null>(null);
    const [templateToDelete, setTemplateToDelete] = useState<Certificate | null>(null);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfPreview, setPdfPreview] = useState<string>('');
    const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
    const [selectedTextBox, setSelectedTextBox] = useState<string | null>(null);
    const [draggedTextBox, setDraggedTextBox] = useState<string | null>(null);
    const [newTextBoxPlaceholder, setNewTextBoxPlaceholder] = useState('');
    const pdfCanvasRef = useRef<HTMLDivElement>(null);
    const [pdfDimensions, setPdfDimensions] = useState({ width: 800, height: 600 });

    // Send states
    const [sendMode, setSendMode] = useState<'immediate' | 'scheduled'>('immediate');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [selectedCertificateForSend, setSelectedCertificateForSend] = useState<Certificate | null>(null);
    const [sendOption, setSendOption] = useState<'preview' | 'attendees'>('preview');
    const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'docx'>('pdf');

    // Filter states
    const [attendeeFilters, setAttendeeFilters] = useState({
        selectAll: false,
        confirmed: false,
        attended: false,
    });

    // Mock certificates storage
    const [certificates, setCertificates] = useState<Certificate[]>([
        {
            id: 'cert-001',
            name: 'Participation Certificate',
            templateType: 'generate',
            fontFamily: 'Arial',
            fontSize: 24,
            textBoxes: [],
            createdAt: new Date(Date.now() - 86400000),
            updatedAt: new Date(Date.now() - 86400000),
            status: 'active'
        },
        {
            id: 'cert-002',
            name: 'Speaker Certificate',
            templateType: 'upload',
            fontFamily: 'Georgia',
            fontSize: 28,
            textBoxes: [
                { id: 'tb-1', x: 100, y: 150, width: 300, height: 40, placeholder: 'Attendee Name', fontSize: 28, fontFamily: 'Georgia' },
                { id: 'tb-2', x: 100, y: 250, width: 400, height: 30, placeholder: 'Event Name', fontSize: 20, fontFamily: 'Georgia' }
            ],
            createdAt: new Date(Date.now() - 86400000 * 2),
            updatedAt: new Date(Date.now() - 86400000 * 2),
            status: 'active'
        }
    ]);

    // Sent certificates list
    const [sentCertificates, setSentCertificates] = useState<CertificateSend[]>([
        {
            id: 'send-001',
            certificateId: 'cert-001',
            certificateName: 'Participation Certificate',
            recipientCount: 150,
            sentAt: new Date(Date.now() - 86400000),
            status: 'sent'
        }
    ]);

    const getAttendeesCount = () => {
        let count = 0;
        if (attendeeFilters.selectAll) return 200;
        if (attendeeFilters.confirmed) count += 150;
        if (attendeeFilters.attended) count += 120;
        return count || 200;
    };

    const handleAttendeeSelectAll = () => {
        const newValue = !attendeeFilters.selectAll;
        setAttendeeFilters({
            selectAll: newValue,
            confirmed: newValue,
            attended: newValue,
        });
    };

    // PDF Upload Handler
    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setToast({ message: 'Please upload a PDF file', type: 'error' });
            return;
        }

        setPdfFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            setPdfPreview(result);
            setToast({ message: 'PDF uploaded successfully. Now drag text boxes onto the PDF!', type: 'success' });
        };
        reader.readAsDataURL(file);
    };

    // Add Text Box on Canvas
    const handleAddTextBoxToCanvas = () => {
        if (!newTextBoxPlaceholder.trim()) {
            setToast({ message: 'Please enter a placeholder name', type: 'error' });
            return;
        }

        const textBox: TextBox = {
            id: `tb-${Date.now()}`,
            x: 50,
            y: 50 + textBoxes.length * 60,
            width: 300,
            height: 40,
            placeholder: newTextBoxPlaceholder,
            fontSize: fontSize,
            fontFamily: fontFamily
        };

        setTextBoxes([...textBoxes, textBox]);
        setNewTextBoxPlaceholder('');
        setToast({ message: 'Text box added. Drag it to position on the PDF!', type: 'success' });
    };

    // Handle Drag Start
    const handleDragStart = (e: React.DragEvent, textBoxId: string) => {
        setDraggedTextBox(textBoxId);
        e.dataTransfer.effectAllowed = 'move';
    };

    // Handle Drag End
    const handleDragEnd = (e: React.DragEvent, textBoxId: string) => {
        if (!pdfCanvasRef.current) return;

        const rect = pdfCanvasRef.current.getBoundingClientRect();
        const x = Math.max(0, e.clientX - rect.left);
        const y = Math.max(0, e.clientY - rect.top);

        setTextBoxes(textBoxes.map(tb =>
            tb.id === textBoxId
                ? { ...tb, x: Math.round(x), y: Math.round(y) }
                : tb
        ));

        setDraggedTextBox(null);
        setToast({ message: 'Text box positioned', type: 'info' });
    };

    // Delete Text Box
    const handleDeleteTextBox = (id: string) => {
        setTextBoxes(textBoxes.filter(tb => tb.id !== id));
        setSelectedTextBox(null);
        setToast({ message: 'Text box removed', type: 'info' });
    };

    // Update Text Box Properties
    const handleUpdateTextBox = (id: string, updates: Partial<TextBox>) => {
        setTextBoxes(textBoxes.map(tb => tb.id === id ? { ...tb, ...updates } : tb));
    };

    // Create/Update Certificate
    const handleSaveTemplate = async () => {
        if (!templateName.trim()) {
            setToast({ message: 'Please enter a template name', type: 'error' });
            return;
        }

        if (templateType === 'upload' && !pdfPreview && !editingTemplate) {
            setToast({ message: 'Please upload a PDF file', type: 'error' });
            return;
        }

        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (editingTemplate) {
            // Update existing
            const updated: Certificate = {
                ...editingTemplate,
                name: templateName,
                fontFamily,
                fontSize,
                textBoxes,
                updatedAt: new Date(),
                pdfData: pdfPreview || editingTemplate.pdfData
            };

            setCertificates(certificates.map(c => c.id === editingTemplate.id ? updated : c));
            setToast({ message: 'Certificate template updated successfully!', type: 'success' });
            setEditingTemplate(null);
        } else {
            // Create new
            const newCertificate: Certificate = {
                id: `cert-${Date.now()}`,
                name: templateName,
                templateType,
                fontFamily,
                fontSize,
                pdfData: pdfPreview,
                textBoxes,
                createdAt: new Date(),
                updatedAt: new Date(),
                status: 'active'
            };

            setCertificates([newCertificate, ...certificates]);
            setToast({ message: 'Certificate template created successfully!', type: 'success' });
        }

        // Reset form
        setTemplateName('');
        setTemplateType('generate');
        setFontFamily('Arial');
        setFontSize(24);
        setPdfFile(null);
        setPdfPreview('');
        setTextBoxes([]);
        setNewTextBoxPlaceholder('');
        setIsLoading(false);
    };

    // Edit Template
    const handleEditTemplate = (cert: Certificate) => {
        setEditingTemplate(cert);
        setTemplateName(cert.name);
        setTemplateType(cert.templateType);
        setFontFamily(cert.fontFamily);
        setFontSize(cert.fontSize);
        setPdfPreview(cert.pdfData || '');
        setTextBoxes(cert.textBoxes);
        setActiveTab('templates');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Delete Template
    const handleDeleteTemplate = (id: string) => {
        const cert = certificates.find(c => c.id === id);
        if (cert) {
            setTemplateToDelete(cert);
        }
    };

    const confirmDeleteTemplate = () => {
        if (templateToDelete) {
            setCertificates(certificates.filter(c => c.id !== templateToDelete.id));
            setToast({ message: 'Certificate template deleted', type: 'info' });
            setTemplateToDelete(null);
        }
    };

    // Download Certificate
    const handleDownloadCertificate = (cert: Certificate) => {
        if (downloadFormat === 'pdf') {
            if (cert.pdfData) {
                const link = document.createElement('a');
                link.href = cert.pdfData;
                link.download = `${cert.name.replace(/\s+/g, '_')}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                // Generate PDF for generated templates
                const doc = new jsPDF();
                doc.setFontSize(cert.fontSize);
                doc.setFont(cert.fontFamily);
                doc.text('Certificate of Achievement', 105, 100, { align: 'center' });
                doc.setFontSize(16);
                doc.text(cert.name, 105, 150, { align: 'center' });
                doc.save(`${cert.name.replace(/\s+/g, '_')}.pdf`);
            }
            setToast({ message: `Certificate downloaded as PDF`, type: 'success' });
        } else {
            // Simulate DOCX download
            const docContent = `Certificate: ${cert.name}\n\nTemplate Type: ${cert.templateType}\nFont: ${cert.fontFamily} ${cert.fontSize}px\n\nText Boxes: ${cert.textBoxes.length}\n\n${cert.textBoxes.map(tb => `- ${tb.placeholder} (${tb.fontSize}px)`).join('\n')}`;
            const blob = new Blob([docContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${cert.name.replace(/\s+/g, '_')}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setToast({ message: `Certificate downloaded as DOCX`, type: 'success' });
        }
    };

    // Send Certificates
    const validateSend = () => {
        if (!selectedCertificateForSend) {
            setToast({ message: 'Please select a certificate template', type: 'error' });
            return false;
        }
        if (sendMode === 'scheduled' && (!scheduledDate || !scheduledTime)) {
            setToast({ message: 'Please select a date and time for scheduling', type: 'error' });
            return false;
        }
        return true;
    };

    const handleSendCertificates = async () => {
        if (!validateSend()) return;

        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1500));

        const newSend: CertificateSend = {
            id: `send-${Date.now()}`,
            certificateId: selectedCertificateForSend!.id,
            certificateName: selectedCertificateForSend!.name,
            recipientCount: getAttendeesCount(),
            sentAt: new Date(),
            status: sendMode === 'scheduled' ? 'scheduled' : 'sent',
            scheduledFor: sendMode === 'scheduled' ? new Date(`${scheduledDate}T${scheduledTime}`) : undefined
        };

        setSentCertificates([newSend, ...sentCertificates]);

        if (sendOption === 'preview') {
            setToast({ message: 'Preview certificate sent to your email!', type: 'success' });
        } else if (sendMode === 'scheduled') {
            setToast({ message: `Certificates scheduled for ${new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}`, type: 'success' });
        } else {
            setToast({ message: `Certificates sent to ${getAttendeesCount()} attendees!`, type: 'success' });
        }

        // Reset form
        setSelectedCertificateForSend(null);
        setSendMode('immediate');
        setScheduledDate('');
        setScheduledTime('');
        setIsLoading(false);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
            <Header />

            {/* Toast Notification */}
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            <style jsx global>{`
                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Navigation Sidebar */}
                <Sidebar activePage="events" disableExpand={true} />

                {/* Event Specific Sidebar */}
                <div className="ml-20 hidden lg:block h-full flex-shrink-0">
                    <EventsSidebar event={event} activePage="certificates" />
                </div>

                {/* Main Content Area */}
                <main className="flex-1 ml-20 lg:ml-0 overflow-y-auto scrollbar-hide p-8">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* Page Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-[#3D518C] to-[#5C6BC0] rounded-2xl flex items-center justify-center shadow-lg">
                                    <Award className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        Certificates
                                    </h1>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                        Create and send certificates to your attendees
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <Users size={18} className="text-[#3D518C]" />
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                    <span className="font-semibold text-[#3D518C]">{getAttendeesCount()}</span> attendees
                                </span>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-1.5 shadow-sm border border-gray-200 dark:border-gray-700 inline-flex">
                            <button
                                onClick={() => setActiveTab('templates')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'templates'
                                    ? 'bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                Templates
                            </button>
                            <button
                                onClick={() => setActiveTab('send')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === 'send'
                                    ? 'bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                Send Certificates
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === 'history'
                                    ? 'bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white shadow-md'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                History
                                {sentCertificates.length > 0 && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'history' ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                        {sentCertificates.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {activeTab === 'templates' ? (
                            <div className="space-y-6">
                                {/* Create/Edit Template Section */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                                    <div className="p-6 border-b border-[#3D518C]/10 bg-gradient-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                                <Palette className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-semibold text-gray-900 dark:text-[#C7D5DC]">
                                                    {editingTemplate ? 'Edit Certificate Template' : 'Create Certificate Template'}
                                                </h2>
                                                <p className="text-xs text-gray-500 dark:text-[#C7D5DC]/70">
                                                    {editingTemplate ? 'Update your certificate template' : 'Design a new certificate template'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        {/* Template Name */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Template Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                placeholder="e.g., Participation Certificate"
                                                value={templateName}
                                                onChange={(e) => setTemplateName(e.target.value)}
                                                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3D518C] focus:border-transparent transition-all duration-200"
                                            />
                                        </div>

                                        {/* Template Type */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Template Type</label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <RadioButton
                                                    label="Generate Template"
                                                    checked={templateType === 'generate'}
                                                    onChange={() => { setTemplateType('generate'); setPdfPreview(''); setTextBoxes([]); }}
                                                    icon={Type}
                                                />
                                                <RadioButton
                                                    label="Upload PDF Template"
                                                    checked={templateType === 'upload'}
                                                    onChange={() => setTemplateType('upload')}
                                                    icon={Upload}
                                                />
                                            </div>
                                        </div>

                                        {/* PDF Upload */}
                                        {templateType === 'upload' && (
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload PDF <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        onChange={handlePdfUpload}
                                                        className="hidden"
                                                        id="pdf-upload"
                                                    />
                                                    <label
                                                        htmlFor="pdf-upload"
                                                        className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-[#3D518C] hover:bg-[#3D518C]/5 transition-all duration-200"
                                                    >
                                                        <div className="text-center">
                                                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                {pdfFile ? pdfFile.name : 'Click to upload PDF'}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PDF files only</p>
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        )}

                                        {/* Font Settings */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Font Family</label>
                                                <select
                                                    value={fontFamily}
                                                    onChange={(e) => setFontFamily(e.target.value)}
                                                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C] focus:border-transparent transition-all duration-200"
                                                >
                                                    <option value="Arial">Arial</option>
                                                    <option value="Georgia">Georgia</option>
                                                    <option value="Times New Roman">Times New Roman</option>
                                                    <option value="Courier New">Courier New</option>
                                                    <option value="Verdana">Verdana</option>
                                                    <option value="Comic Sans MS">Comic Sans MS</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Font Size: <span className="text-[#3D518C] font-semibold">{fontSize}px</span></label>
                                                <input
                                                    type="range"
                                                    min="12"
                                                    max="48"
                                                    value={fontSize}
                                                    onChange={(e) => setFontSize(Number(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#3D518C]"
                                                />
                                            </div>
                                        </div>

                                        {/* PDF Editor with Drag and Drop */}
                                        {templateType === 'upload' && pdfPreview && (
                                            <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-6">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Add Text Boxes to PDF</h3>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Drag text boxes onto the PDF to position them</p>
                                                </div>

                                                {/* Add Text Box Form */}
                                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-3">
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="e.g., Attendee Name"
                                                            value={newTextBoxPlaceholder}
                                                            onChange={(e) => setNewTextBoxPlaceholder(e.target.value)}
                                                            className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3D518C]"
                                                        />
                                                        <button
                                                            onClick={handleAddTextBoxToCanvas}
                                                            className="px-4 py-2 bg-[#3D518C] text-white text-sm font-medium rounded-lg hover:bg-[#3D518C]/90 transition-colors flex items-center gap-2"
                                                        >
                                                            <Plus size={16} />
                                                            Add
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* PDF Canvas with Draggable Text Boxes */}
                                                <div
                                                    ref={pdfCanvasRef}
                                                    className="relative w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-gray-300 dark:border-gray-600 overflow-auto flex items-center justify-center p-4"
                                                    style={{
                                                        minHeight: '600px'
                                                    }}
                                                >
                                                    {pdfPreview ? (
                                                        <div className="relative bg-white rounded-lg shadow-2xl overflow-hidden" style={{ width: '600px', height: '750px', maxWidth: '100%' }}>
                                                            {/* PDF Display using iframe */}
                                                            <iframe
                                                                src={pdfPreview}
                                                                className="w-full h-full border-0"
                                                                title="PDF Preview"
                                                                style={{ pointerEvents: 'none' }}
                                                            />

                                                            {/* Text Boxes Overlay */}
                                                            {textBoxes.map((tb) => (
                                                                <DraggableTextBox
                                                                    key={tb.id}
                                                                    textBox={tb}
                                                                    isSelected={selectedTextBox === tb.id}
                                                                    onSelect={() => setSelectedTextBox(tb.id)}
                                                                    onDragStart={(e) => handleDragStart(e, tb.id)}
                                                                    onDragEnd={(e) => handleDragEnd(e, tb.id)}
                                                                    onDelete={() => handleDeleteTextBox(tb.id)}
                                                                />
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center">
                                                            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">No PDF uploaded yet</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Upload a PDF file above to get started</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Text Box Properties Editor */}
                                                {selectedTextBox && (
                                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 space-y-3 animate-slide-up">
                                                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">Edit Text Box Properties</h4>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                            <div>
                                                                <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">X</label>
                                                                <input
                                                                    type="number"
                                                                    value={textBoxes.find(tb => tb.id === selectedTextBox)?.x || 0}
                                                                    onChange={(e) => handleUpdateTextBox(selectedTextBox, { x: Number(e.target.value) })}
                                                                    className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Y</label>
                                                                <input
                                                                    type="number"
                                                                    value={textBoxes.find(tb => tb.id === selectedTextBox)?.y || 0}
                                                                    onChange={(e) => handleUpdateTextBox(selectedTextBox, { y: Number(e.target.value) })}
                                                                    className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Width</label>
                                                                <input
                                                                    type="number"
                                                                    value={textBoxes.find(tb => tb.id === selectedTextBox)?.width || 0}
                                                                    onChange={(e) => handleUpdateTextBox(selectedTextBox, { width: Number(e.target.value) })}
                                                                    className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Height</label>
                                                                <input
                                                                    type="number"
                                                                    value={textBoxes.find(tb => tb.id === selectedTextBox)?.height || 0}
                                                                    onChange={(e) => handleUpdateTextBox(selectedTextBox, { height: Number(e.target.value) })}
                                                                    className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Text Boxes List */}
                                                {textBoxes.length > 0 && (
                                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-2">
                                                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Text Boxes ({textBoxes.length})</p>
                                                        <div className="space-y-2">
                                                            {textBoxes.map((tb) => (
                                                                <div
                                                                    key={tb.id}
                                                                    onClick={() => setSelectedTextBox(tb.id)}
                                                                    className={`p-2 rounded-lg border cursor-pointer transition-all ${selectedTextBox === tb.id
                                                                        ? 'border-[#3D518C] bg-[#3D518C]/10'
                                                                        : 'border-gray-200 dark:border-gray-600 hover:border-[#3D518C]/50'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                            <GripHorizontal size={14} className="text-gray-400 flex-shrink-0" />
                                                                            <div className="min-w-0">
                                                                                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{tb.placeholder}</p>
                                                                                <p className="text-[10px] text-gray-500 dark:text-gray-400">({tb.x}, {tb.y}) • {tb.width}x{tb.height}</p>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDeleteTextBox(tb.id);
                                                                            }}
                                                                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors flex-shrink-0"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Preview for Generated Templates */}
                                        {templateType === 'generate' && (
                                            <div className="mt-6 p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-xl border border-amber-200 dark:border-gray-600">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Preview</p>
                                                <div className="text-center py-12 border-2 border-dashed border-amber-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                                                    <p style={{ fontFamily, fontSize: `${fontSize}px` }} className="text-gray-700 dark:text-gray-300 font-bold">
                                                        Certificate of Achievement
                                                    </p>
                                                    <p style={{ fontFamily, fontSize: `${fontSize - 8}px` }} className="text-gray-500 dark:text-gray-400 mt-4">
                                                        {templateName || 'Your Certificate Name'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                                        <button
                                            onClick={() => {
                                                setTemplateName('');
                                                setTemplateType('generate');
                                                setFontFamily('Arial');
                                                setFontSize(24);
                                                setPdfFile(null);
                                                setPdfPreview('');
                                                setTextBoxes([]);
                                                setNewTextBoxPlaceholder('');
                                                setEditingTemplate(null);
                                            }}
                                            className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                                        >
                                            Reset
                                        </button>
                                        <button
                                            onClick={handleSaveTemplate}
                                            disabled={isLoading}
                                            className="px-6 py-2.5 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white text-sm font-medium rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <RefreshCw size={16} className="animate-spin" />
                                                    {editingTemplate ? 'Updating...' : 'Creating...'}
                                                </>
                                            ) : (
                                                <>
                                                    <Award size={16} />
                                                    {editingTemplate ? 'Update Template' : 'Create Template'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Templates List */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Templates ({certificates.length})</h3>
                                    {certificates.length === 0 ? (
                                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-sm">
                                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <Award className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No templates yet</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Create your first certificate template above</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {certificates.map((cert) => (
                                                <div key={cert.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
                                                    <div className="space-y-3">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{cert.name}</h3>
                                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex-shrink-0">
                                                                        {cert.status}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {cert.templateType === 'upload' ? 'PDF Template' : 'Generated Template'} • {cert.fontFamily} {cert.fontSize}px
                                                                </p>
                                                                {cert.textBoxes.length > 0 && (
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                        {cert.textBoxes.length} text box{cert.textBoxes.length !== 1 ? 'es' : ''}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                                            <button
                                                                onClick={() => setSelectedTemplate(cert)}
                                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-[#3D518C] hover:bg-[#3D518C]/10 rounded-lg transition-colors text-sm font-medium"
                                                                title="Preview"
                                                            >
                                                                <Eye size={14} />
                                                                Preview
                                                            </button>
                                                            <button
                                                                onClick={() => handleEditTemplate(cert)}
                                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-sm font-medium"
                                                                title="Edit"
                                                            >
                                                                <Edit2 size={14} />
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteTemplate(cert.id)}
                                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={14} />
                                                                Delete
                                                            </button>
                                                        </div>

                                                        {/* Download Options */}
                                                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                                            <button
                                                                onClick={() => {
                                                                    setDownloadFormat('pdf');
                                                                    handleDownloadCertificate(cert);
                                                                }}
                                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors text-sm font-medium"
                                                                title="Download as PDF"
                                                            >
                                                                <Download size={14} />
                                                                PDF
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setDownloadFormat('docx');
                                                                    handleDownloadCertificate(cert);
                                                                }}
                                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors text-sm font-medium"
                                                                title="Download as DOCX"
                                                            >
                                                                <FileText size={14} />
                                                                DOCX
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : activeTab === 'send' ? (
                            <div className="space-y-6">
                                {/* Select Certificate */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                                    <div className="p-6 border-b border-[#3D518C]/10 bg-gradient-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                                                <Award className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-semibold text-gray-900 dark:text-[#C7D5DC]">
                                                    Select Certificate
                                                </h2>
                                                <p className="text-xs text-gray-500 dark:text-[#C7D5DC]/70">Choose which certificate to send</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-3">
                                        {certificates.length === 0 ? (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">No templates available. Create one first.</p>
                                        ) : (
                                            certificates.map((cert) => (
                                                <div
                                                    key={cert.id}
                                                    onClick={() => setSelectedCertificateForSend(cert)}
                                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${selectedCertificateForSend?.id === cert.id
                                                        ? 'border-[#3D518C] bg-[#3D518C]/5'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-[#3D518C]/50'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">{cert.name}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{cert.fontFamily} • {cert.fontSize}px</p>
                                                        </div>
                                                        <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${selectedCertificateForSend?.id === cert.id ? 'border-[#3D518C] bg-[#3D518C]' : 'border-gray-300 dark:border-gray-600'}`}>
                                                            {selectedCertificateForSend?.id === cert.id && <Check size={12} className="text-white" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Attendee Filters */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                                    <div className="p-6 border-b border-[#3D518C]/10 bg-gradient-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                                                <Users className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-semibold text-gray-900 dark:text-[#C7D5DC]">
                                                    Select Recipients
                                                </h2>
                                                <p className="text-xs text-gray-500 dark:text-[#C7D5DC]/70">Choose who should receive certificates</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-3">
                                        <Checkbox label="Select All Attendees" checked={attendeeFilters.selectAll} onChange={handleAttendeeSelectAll} />
                                        <Checkbox label="Confirmed Attendees" checked={attendeeFilters.confirmed} onChange={() => setAttendeeFilters(prev => ({ ...prev, confirmed: !prev.confirmed, selectAll: false }))} />
                                        <Checkbox label="Attended Event" checked={attendeeFilters.attended} onChange={() => setAttendeeFilters(prev => ({ ...prev, attended: !prev.attended, selectAll: false }))} />
                                    </div>
                                </div>

                                {/* Send Options */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 hover:shadow-md">
                                    <div className="p-6 rounded-t-2xl border-b border-[#3D518C]/10 bg-gradient-to-r from-[#3D518C]/5 to-[#3D518C]/10 dark:from-[#3D518C]/20 dark:to-[#3D518C]/10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                                                <Send className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-semibold text-gray-900 dark:text-[#C7D5DC]">
                                                    Send Options
                                                </h2>
                                                <p className="text-xs text-gray-500 dark:text-[#C7D5DC]/70">Choose when and how to send</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Send Mode */}
                                            <div className="space-y-3">
                                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    Sending Mode
                                                </h3>
                                                <div className="space-y-2">
                                                    <RadioButton label="Send Immediately" checked={sendMode === 'immediate'} onChange={() => setSendMode('immediate')} icon={Send} />
                                                    <RadioButton label="Schedule Send" checked={sendMode === 'scheduled'} onChange={() => setSendMode('scheduled')} icon={Clock} />
                                                </div>

                                                {sendMode === 'scheduled' && (
                                                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-3 animate-slide-up">
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Date</label>
                                                                <DateInput
                                                                    value={scheduledDate ? new Date(scheduledDate) : null}
                                                                    onChange={(date) => setScheduledDate(date ? date.toISOString().split('T')[0] : '')}
                                                                    placeholder="Select date"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Time</label>
                                                                <TimeInput
                                                                    value={scheduledTime}
                                                                    onChange={setScheduledTime}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Delivery Mode */}
                                            <div className="space-y-3">
                                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    Delivery Mode
                                                </h3>
                                                <div className="space-y-2">
                                                    <RadioButton label="Send Preview to My Email" checked={sendOption === 'preview'} onChange={() => setSendOption('preview')} icon={Eye} />
                                                    <RadioButton label="Send to All Recipients" checked={sendOption === 'attendees'} onChange={() => setSendOption('attendees')} icon={Users} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <p>
                                            Ready to send to <span className="font-semibold text-[#3D518C]">{getAttendeesCount()}</span> recipients
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleSendCertificates}
                                        disabled={isLoading || !selectedCertificateForSend}
                                        className="px-6 py-2.5 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white text-sm font-medium rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <>
                                                <RefreshCw size={16} className="animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={16} />
                                                {sendOption === 'preview' ? 'Send Preview' : 'Send Certificates'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* History Tab */
                            <div className="space-y-4">
                                {sentCertificates.length === 0 ? (
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-sm">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Award className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No certificates sent yet</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Start by sending your first certificate batch</p>
                                        <button
                                            onClick={() => setActiveTab('send')}
                                            className="px-6 py-2.5 bg-gradient-to-r from-[#3D518C] to-[#5C6BC0] text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all duration-200"
                                        >
                                            Send Certificates
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {sentCertificates.map((send) => (
                                            <div key={send.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="font-semibold text-gray-900 dark:text-white">{send.certificateName}</h3>
                                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${send.status === 'sent' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                                                                {send.status === 'sent' ? 'Sent' : 'Scheduled'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                                            <span className="flex items-center gap-1">
                                                                <Users size={12} />
                                                                {send.recipientCount} recipients
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={12} />
                                                                {send.status === 'scheduled' && send.scheduledFor
                                                                    ? `Scheduled for ${formatDate(send.scheduledFor)}`
                                                                    : formatDate(send.sentAt)
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setDownloadFormat('pdf');
                                                                const cert = certificates.find(c => c.id === send.certificateId);
                                                                if (cert) handleDownloadCertificate(cert);
                                                            }}
                                                            className="p-2 text-[#3D518C] hover:bg-[#3D518C]/10 rounded-lg transition-colors"
                                                            title="Download"
                                                        >
                                                            <Download size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </main>
            </div>

            {/* Certificate Preview Modal */}
            <Modal
                isOpen={!!selectedTemplate}
                onClose={() => setSelectedTemplate(null)}
                title={selectedTemplate?.name || 'Certificate Preview'}
                size="lg"
            >
                <div className="space-y-6">
                    {selectedTemplate?.templateType === 'upload' && selectedTemplate?.pdfData ? (
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
                            <iframe
                                src={selectedTemplate.pdfData}
                                className="w-full h-96"
                                title="PDF Preview"
                            />
                        </div>
                    ) : (
                        <div className="p-8 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-xl border-2 border-dashed border-amber-300 dark:border-gray-600">
                            <div className="text-center space-y-4">
                                <p style={{ fontFamily: selectedTemplate?.fontFamily, fontSize: `${selectedTemplate?.fontSize}px` }} className="text-gray-700 dark:text-gray-300 font-bold">
                                    Certificate of Achievement
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {selectedTemplate?.name}
                                </p>
                                {selectedTemplate?.textBoxes && selectedTemplate.textBoxes.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-amber-200 dark:border-gray-600">
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Text Boxes:</p>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {selectedTemplate.textBoxes.map(tb => (
                                                <span key={tb.id} className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs text-gray-700 dark:text-gray-300 border border-amber-200 dark:border-gray-600">
                                                    {tb.placeholder}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex justify-end gap-3">
                        <button
                            onClick={() => setSelectedTemplate(null)}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Template Confirmation Modal */}
            <Modal
                isOpen={!!templateToDelete}
                onClose={() => setTemplateToDelete(null)}
                title="Delete Template?"
                size="sm"
            >
                <div className="space-y-6">
                    <p className="text-gray-600 dark:text-gray-300">
                        Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">"{templateToDelete?.name}"</span>?
                        This action cannot be undone.
                    </p>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => setTemplateToDelete(null)}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDeleteTemplate}
                            className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
