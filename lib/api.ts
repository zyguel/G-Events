import { EventData } from "./types";

// Event summary type for listing
interface EventSummary {
    id: string;
    name: string;
    date: string;
    status: "Ongoing" | "Completed";
}

// Mock data for all events
const eventsData: Record<string, EventData> = {
    "devfest-2025": {
        id: "devfest-2025",
        name: "DevFest Cebu 2025",
        date: "July 22, 2025",
        status: "Ongoing",

        stats: {
            totalEvents: 24,
            registrations: 2856,
            revenue: 128450,
            satisfaction: 4.7,
            expenses: 45000,
            netProfit: 83450,
        },

        comments: [
            { user: "Juan D.", rating: 5, text: "Best tech event I've attended! Great speakers and networking.", time: "2 hours ago" },
            { user: "Maria S.", rating: 4, text: "Really informative sessions. Would love more hands-on workshops.", time: "1 day ago" },
            { user: "Carlo R.", rating: 5, text: "The venue was perfect and food was amazing!", time: "3 days ago" },
        ],

        trends: {
            registrations: { allTime: [120, 180, 250, 320, 480, 580, 720, 850, 950, 1100, 1250, 1400], last30Days: [350, 420, 380, 450], last7Days: [65, 82, 74, 91, 88, 102, 95] },
            attendance: { checkedIn: 72, noShow: 18, waitlisted: 10 },
        },

        revenueBreakdown: [
            { name: "General Admission", value: 85600, percentage: 65 },
            { name: "VIP All-Access", value: 35000, percentage: 28 },
            { name: "Student Discount", value: 7850, percentage: 7 },
        ],

        recentTransactions: [
            { id: "TXN-8842", user: "Jose Rizal", type: "VIP All-Access", amount: 2500, date: "Just now", status: "Success" },
            { id: "TXN-8841", user: "Maria Clara", type: "General Admission", amount: 1500, date: "5 mins ago", status: "Success" },
            { id: "TXN-8840", user: "Juan Luna", type: "Student Discount", amount: 750, date: "15 mins ago", status: "Pending" },
            { id: "TXN-8839", user: "Andres B.", type: "General Admission", amount: 1500, date: "1 hour ago", status: "Success" },
            { id: "TXN-8838", user: "Gabriela S.", type: "VIP All-Access", amount: 2500, date: "3 hours ago", status: "Failed" },
        ],
    },

    "wtm-2025": {
        id: "wtm-2025",
        name: "Women Techmakers 2025",
        date: "March 8, 2025",
        status: "Completed",

        stats: {
            totalEvents: 12,
            registrations: 1450,
            revenue: 72500,
            satisfaction: 4.9,
            expenses: 28000,
            netProfit: 44500,
        },

        comments: [
            { user: "Ana Reyes", rating: 5, text: "Empowering and inspiring! Met so many amazing women in tech.", time: "1 week ago" },
            { user: "Sofia Cruz", rating: 5, text: "The mentorship sessions were incredibly valuable.", time: "2 weeks ago" },
        ],

        trends: {
            registrations: { allTime: [80, 120, 180, 220, 280, 350, 420, 500, 580, 650, 720, 800], last30Days: [180, 220, 250, 300], last7Days: [42, 55, 48, 62, 58, 70, 65] },
            attendance: { checkedIn: 85, noShow: 10, waitlisted: 5 },
        },

        revenueBreakdown: [
            { name: "General Admission", value: 45000, percentage: 62 },
            { name: "VIP Experience", value: 22000, percentage: 30 },
            { name: "Early Bird", value: 5500, percentage: 8 },
        ],

        recentTransactions: [
            { id: "TXN-4421", user: "Ana Reyes", type: "VIP Experience", amount: 2000, date: "Just now", status: "Success" },
            { id: "TXN-4420", user: "Sofia Cruz", type: "General Admission", amount: 1200, date: "10 mins ago", status: "Success" },
            { id: "TXN-4419", user: "Mia Torres", type: "Early Bird", amount: 800, date: "25 mins ago", status: "Success" },
            { id: "TXN-4418", user: "Grace Kim", type: "General Admission", amount: 1200, date: "2 hours ago", status: "Pending" },
        ],
    },

    "io-extended-2025": {
        id: "io-extended-2025",
        name: "Google I/O Extended 2025",
        date: "May 15, 2025",
        status: "Ongoing",

        stats: {
            totalEvents: 18,
            registrations: 3200,
            revenue: 156000,
            satisfaction: 4.6,
            expenses: 52000,
            netProfit: 104000,
        },

        comments: [
            { user: "Mike Chen", rating: 4, text: "Great insights on the latest Google technologies!", time: "3 hours ago" },
            { user: "Lisa Park", rating: 5, text: "The hands-on codelabs were the highlight for me.", time: "1 day ago" },
            { user: "David Wong", rating: 5, text: "Amazing community vibes and top-notch content.", time: "2 days ago" },
        ],

        trends: {
            registrations: { allTime: [150, 220, 300, 400, 550, 680, 820, 980, 1150, 1350, 1580, 1800], last30Days: [420, 480, 520, 580], last7Days: [75, 92, 85, 105, 98, 115, 110] },
            attendance: { checkedIn: 78, noShow: 15, waitlisted: 7 },
        },

        revenueBreakdown: [
            { name: "General Admission", value: 98000, percentage: 63 },
            { name: "VIP + Swag", value: 45000, percentage: 29 },
            { name: "Student Pass", value: 13000, percentage: 8 },
        ],

        recentTransactions: [
            { id: "TXN-6601", user: "Mike Chen", type: "VIP + Swag", amount: 3000, date: "Just now", status: "Success" },
            { id: "TXN-6600", user: "Lisa Park", type: "General Admission", amount: 1800, date: "8 mins ago", status: "Success" },
            { id: "TXN-6599", user: "David Wong", type: "Student Pass", amount: 900, date: "30 mins ago", status: "Success" },
            { id: "TXN-6598", user: "Emma Davis", type: "General Admission", amount: 1800, date: "1 hour ago", status: "Success" },
            { id: "TXN-6597", user: "James Taylor", type: "VIP + Swag", amount: 3000, date: "2 hours ago", status: "Pending" },
        ],
    },
};

// Get single event data
export async function getEventData(eventId: string): Promise<EventData | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return eventsData[eventId] || null;
}

// Get list of all events
export async function getAllEvents(): Promise<EventSummary[]> {
    await new Promise(resolve => setTimeout(resolve, 50));

    return Object.values(eventsData).map(event => ({
        id: event.id,
        name: event.name,
        date: event.date,
        status: event.status,
    }));
}

// Get aggregated data across all events
export async function getAggregatedData(): Promise<EventData> {
    await new Promise(resolve => setTimeout(resolve, 100));

    const allEvents = Object.values(eventsData);

    // Aggregate stats
    const totalStats = allEvents.reduce((acc, event) => ({
        totalEvents: acc.totalEvents + event.stats.totalEvents,
        registrations: acc.registrations + event.stats.registrations,
        revenue: acc.revenue + event.stats.revenue,
        satisfaction: acc.satisfaction + event.stats.satisfaction,
        expenses: acc.expenses + event.stats.expenses,
        netProfit: acc.netProfit + event.stats.netProfit,
    }), { totalEvents: 0, registrations: 0, revenue: 0, satisfaction: 0, expenses: 0, netProfit: 0 });

    // Average satisfaction
    totalStats.satisfaction = parseFloat((totalStats.satisfaction / allEvents.length).toFixed(1));

    // Aggregate registration trends (average across events)
    const aggregateArray = (arrays: number[][]) => {
        const maxLen = Math.max(...arrays.map(a => a.length));
        return Array.from({ length: maxLen }, (_, i) => {
            const values = arrays.map(a => a[i] || 0);
            return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
        });
    };

    // Combine all comments with event names
    const allComments = allEvents.flatMap(event =>
        event.comments.map(comment => ({
            ...comment,
            eventName: event.name,
        }))
    ).slice(0, 5);

    // Combine revenue breakdowns
    const combinedBreakdown: { name: string; value: number; percentage: number }[] = [];
    allEvents.forEach(event => {
        event.revenueBreakdown.forEach(item => {
            const existing = combinedBreakdown.find(b => b.name === item.name);
            if (existing) {
                existing.value += item.value;
            } else {
                combinedBreakdown.push({ ...item });
            }
        });
    });
    // Recalculate percentages
    const totalRevenue = combinedBreakdown.reduce((sum, item) => sum + item.value, 0);
    combinedBreakdown.forEach(item => {
        item.percentage = Math.round((item.value / totalRevenue) * 100);
    });

    // Combine recent transactions
    const allTransactions = allEvents.flatMap(event => event.recentTransactions).slice(0, 5);

    // Create top events list
    const topEvents = allEvents.map(event => ({
        id: event.id,
        name: event.name,
        registrations: event.stats.registrations,
        revenue: event.stats.revenue,
        satisfaction: event.stats.satisfaction,
        attendance: event.trends.attendance.checkedIn,
    }));

    return {
        id: "all",
        name: "All Events",
        date: "2025",
        status: "Ongoing",
        stats: totalStats,
        comments: allComments,
        trends: {
            registrations: {
                allTime: aggregateArray(allEvents.map(e => e.trends.registrations.allTime)),
                last30Days: aggregateArray(allEvents.map(e => e.trends.registrations.last30Days)),
                last7Days: aggregateArray(allEvents.map(e => e.trends.registrations.last7Days)),
            },
            attendance: {
                checkedIn: Math.round(allEvents.reduce((sum, e) => sum + e.trends.attendance.checkedIn, 0) / allEvents.length),
                noShow: Math.round(allEvents.reduce((sum, e) => sum + e.trends.attendance.noShow, 0) / allEvents.length),
                waitlisted: Math.round(allEvents.reduce((sum, e) => sum + e.trends.attendance.waitlisted, 0) / allEvents.length),
            },
        },
        revenueBreakdown: combinedBreakdown,
        recentTransactions: allTransactions,
        topEvents,
    };
}
