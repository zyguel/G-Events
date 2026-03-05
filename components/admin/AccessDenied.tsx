"use client";

import { ShieldOff } from "lucide-react";

interface AccessDeniedProps {
    message?: string;
}

export default function AccessDenied({
    message = "You don't have permission to access this page.",
}: AccessDeniedProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4 text-center px-4">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-full p-6">
                <ShieldOff className="w-12 h-12 text-red-500" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    Access Denied
                </h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm">{message}</p>
            </div>
        </div>
    );
}
