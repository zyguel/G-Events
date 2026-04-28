"use client";

import React from 'react';
import StatCard from '@/components/admin/StatCard';
import DashboardTabs from '@/components/admin/DashboardTabs';
import AnalyticsHeader from '@/components/admin/AnalyticsHeader';

interface AnalyticsPageClientProps {
    data: any;
    demographics: any;
    tickets: any;
    eventId: number;
}

export default function AnalyticsPageClient({ data, demographics, tickets, eventId }: AnalyticsPageClientProps) {
    const [usePeso, setUsePeso] = React.useState(false);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat(usePeso ? 'en-PH' : 'en-US', {
            style: 'currency',
            currency: usePeso ? 'PHP' : 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('en-US').format(value);
    };

    return (
        <div className="h-full p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <AnalyticsHeader
                    events={data.events}
                    currentEventId={data.id}
                    data={{ ...data, demographics }}
                    title={data.name}
                    description={`Performance analytics for ${data.name} • ${data.date ? new Date(data.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}`}
                    usePeso={usePeso}
                    onCurrencyToggle={() => setUsePeso(!usePeso)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Registrations"
                        value={formatNumber(data.stats.registrations)}
                    />
                    <StatCard
                        title="Revenue"
                        value={formatCurrency(data.stats.revenue)}
                    />
                    <StatCard
                        title="Net Profit"
                        value={formatCurrency(data.stats.netProfit)}
                    />
                    <StatCard
                        title="Satisfaction"
                        value={data.stats.satisfaction > 0 ? `${data.stats.satisfaction}/5.0` : 'N/A'}
                    />
                </div>

                <DashboardTabs 
                    data={data} 
                    demographics={demographics} 
                    tickets={tickets}
                    eventId={eventId}
                />
            </div>
        </div>
    );
}
