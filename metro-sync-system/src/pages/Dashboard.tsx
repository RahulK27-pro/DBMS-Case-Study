import { Users, CreditCard, DollarSign, Route } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  // TODO: Fetch from API
  const stats = {
    totalPassengers: 0,
    activeCards: 0,
    totalBalance: "₹0",
    totalTrips: 0,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Monitor your transport system at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Passengers"
          value={stats.totalPassengers}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Active Cards"
          value={stats.activeCards}
          icon={CreditCard}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Total Balance"
          value={stats.totalBalance}
          icon={DollarSign}
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Total Trips"
          value={stats.totalTrips}
          icon={Route}
          trend={{ value: 23, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              No recent activity
            </div>
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
                <span className="font-bold text-foreground">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Blocked Cards</span>
                <span className="font-bold text-destructive">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Stations</span>
                <span className="font-bold text-foreground">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Average Fare</span>
                <span className="font-bold text-foreground">₹0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
