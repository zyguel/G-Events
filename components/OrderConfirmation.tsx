"use client";

import { useState } from "react";
import RichTextEditor from "./RichTextEditor";

interface EmailTemplate {
    subject: string;
    body: string;
}

interface OrderConfirmationData {
    submissionMessage: string;
    submissionEmail: EmailTemplate;
    confirmationEmail: EmailTemplate;
    rejectionEmail: EmailTemplate;
}

export default function OrderConfirmation({ eventId }: { eventId: string }) {
    const [savedStates, setSavedStates] = useState({
        submissionMessage: false,
        submissionEmail: false,
        confirmationEmail: false,
        rejectionEmail: false
    });

    const [data, setData] = useState<OrderConfirmationData>({
        submissionMessage: "",
        submissionEmail: {
            subject: "",
            body: ""
        },
        confirmationEmail: {
            subject: "",
            body: ""
        },
        rejectionEmail: {
            subject: "",
            body: ""
        }
    });

    const handleSaveSubmissionMessage = () => {
        console.log("Saving submission message:", data.submissionMessage);
        // TODO: API call to save
        setSavedStates({ ...savedStates, submissionMessage: true });
        setTimeout(() => setSavedStates({ ...savedStates, submissionMessage: false }), 3000);
    };

    const handleSaveEmail = (type: 'submission' | 'confirmation' | 'rejection') => {
        console.log(`Saving ${type} email:`, data[`${type}Email`]);
        // TODO: API call to save
        const key = `${type}Email` as keyof typeof savedStates;
        setSavedStates({ ...savedStates, [key]: true });
        setTimeout(() => setSavedStates({ ...savedStates, [key]: false }), 3000);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 pb-20 font-sans">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Order Confirmation
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Configure automated email templates for event registration workflows
                </p>
            </div>

            {/* Registration Submission Message */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Registration Submission Message
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        This is the message that will appear once the user has completed submission.
                    </p>
                </div>
                <RichTextEditor
                    content={data.submissionMessage}
                    onChange={(html) => setData({ ...data, submissionMessage: html })}
                    placeholder="Write your confirmation message here..."
                />
                <div className="flex items-center justify-end gap-3 mt-4">
                    {savedStates.submissionMessage && (
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                            ✓ Changes saved
                        </span>
                    )}
                    <button
                        onClick={handleSaveSubmissionMessage}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                    >
                        Save Changes
                    </button>
                </div>
            </section>

            {/* Registration Submission E-mail */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Registration Submission E-mail
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        This is the e-mail sent to the user once they have completed submission.
                    </p>
                </div>
                <input
                    type="text"
                    value={data.submissionEmail.subject}
                    onChange={(e) => setData({ ...data, submissionEmail: { ...data.submissionEmail, subject: e.target.value } })}
                    placeholder="Email Subject"
                    className="w-full px-4 py-2 text-sm rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-gray-100 mb-4"
                />
                <RichTextEditor
                    content={data.submissionEmail.body}
                    onChange={(html) => setData({ ...data, submissionEmail: { ...data.submissionEmail, body: html } })}
                    placeholder="Write your submission email content here..."
                />
                <div className="flex items-center justify-end gap-3 mt-4">
                    {savedStates.submissionEmail && (
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                            ✓ Changes saved
                        </span>
                    )}
                    <button
                        onClick={() => handleSaveEmail('submission')}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                    >
                        Save Changes
                    </button>
                </div>
            </section>

            {/* Registration Confirmation E-mail */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Registration Confirmation E-mail
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        This is the e-mail sent to the user once their registration has been reviewed and confirmed.
                    </p>
                </div>
                <input
                    type="text"
                    value={data.confirmationEmail.subject}
                    onChange={(e) => setData({ ...data, confirmationEmail: { ...data.confirmationEmail, subject: e.target.value } })}
                    placeholder="Email Subject"
                    className="w-full px-4 py-2 text-sm rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-gray-100 mb-4"
                />
                <RichTextEditor
                    content={data.confirmationEmail.body}
                    onChange={(html) => setData({ ...data, confirmationEmail: { ...data.confirmationEmail, body: html } })}
                    placeholder="Write your confirmation email content here..."
                />
                <div className="flex items-center justify-end gap-3 mt-4">
                    {savedStates.confirmationEmail && (
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                            ✓ Changes saved
                        </span>
                    )}
                    <button
                        onClick={() => handleSaveEmail('confirmation')}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                    >
                        Save Changes
                    </button>
                </div>
            </section>

            {/* Registration Rejection E-mail */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        Registration Rejection E-mail
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        This is the e-mail sent to the user once their registration has been rejected.
                    </p>
                </div>
                <input
                    type="text"
                    value={data.rejectionEmail.subject}
                    onChange={(e) => setData({ ...data, rejectionEmail: { ...data.rejectionEmail, subject: e.target.value } })}
                    placeholder="Email Subject"
                    className="w-full px-4 py-2 text-sm rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-gray-100 mb-4"
                />
                <RichTextEditor
                    content={data.rejectionEmail.body}
                    onChange={(html) => setData({ ...data, rejectionEmail: { ...data.rejectionEmail, body: html } })}
                    placeholder="Write your rejection email content here..."
                />
                <div className="flex items-center justify-end gap-3 mt-4">
                    {savedStates.rejectionEmail && (
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                            ✓ Changes saved
                        </span>
                    )}
                    <button
                        onClick={() => handleSaveEmail('rejection')}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                    >
                        Save Changes
                    </button>
                </div>
            </section>
        </div>
    );
}
