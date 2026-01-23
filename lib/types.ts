
export interface EventData {
    id: string;
    name: string;
    date: string;
    status: "Ongoing" | "Completed";
    stats: {
        totalEvents: number;
        registrations: number;
        revenue: number;
        satisfaction: number;
        expenses: number;
        netProfit: number;
    };
    comments: Comment[];
    trends: {
        registrations: {
            allTime: number[];
            last30Days: number[];
            last7Days: number[];
        };
        attendance: {
            checkedIn: number;
            noShow: number;
            waitlisted: number;
        };
    };
    revenueBreakdown: { name: string; value: number; percentage: number }[];
    recentTransactions: { id: string; user: string; type: string; amount: number; date: string; status: string }[];
    topEvents?: { id: string; name: string; registrations: number; revenue: number; satisfaction: number; attendance: number }[];
}

export interface Comment {
    user: string;
    rating: number;
    text: string;
    time: string;
    eventName?: string;
}
