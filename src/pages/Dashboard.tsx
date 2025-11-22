import { useState, useEffect } from "react";
import { Users, CreditCard, DollarSign, Route, TrendingUp, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/api";

interface DashboardStats {
  totalPassengers: number;
  activeCards: number;
  blockedCards: number;
  totalBalance: number;
  totalTrips: number;
  activeTrips: number;
  totalStations: number;
  averageFare: number;
  totalTransactions: number;
  totalRevenue: number;
  recentTransactions: Array<{
    TransactionID: number;
    Amount: number;
    TransactionDate: string;
    TransactionType: string;
    CardNumber: string;
    FirstName: string;
    LastName: string;
  }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-destructive">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Monitor your transport system at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Passengers"
          value={stats?.totalPassengers || 0}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Active Cards"
          value={stats?.activeCards || 0}
          icon={CreditCard}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Total Balance"
          value={`₹${(stats?.totalBalance || 0).toFixed(2)}`}
          icon={DollarSign}
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Total Trips"
          value={stats?.totalTrips || 0}
          icon={Route}
          trend={{ value: 23, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {stats.recentTransactions.map((txn) => (
                  <div key={txn.TransactionID} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {txn.FirstName} {txn.LastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Card: {txn.CardNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={txn.TransactionType === "Recharge" ? "default" : "secondary"}>
                        {txn.TransactionType}
                      </Badge>
                      <p className="font-bold text-sm mt-1">₹{txn.Amount.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                No recent transactions
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Active Trips</span>
                <span className="font-bold text-foreground">{stats?.activeTrips || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Blocked Cards</span>
                <span className="font-bold text-destructive">{stats?.blockedCards || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Stations</span>
                <span className="font-bold text-foreground">{stats?.totalStations || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Average Fare</span>
                <span className="font-bold text-foreground">₹{(stats?.averageFare || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Total Revenue
                </span>
                <span className="font-bold text-success">₹{(stats?.totalRevenue || 0).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
