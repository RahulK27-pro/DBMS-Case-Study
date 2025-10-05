import { useState, useEffect } from "react";
import { Search, Clock, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";

interface Trip {
  TripID: number;
  EntryTime: string;
  ExitTime: string | null;
  FareAmount: number;
  CardNumber: string;
  PassengerID: number;
  FirstName: string;
  LastName: string;
  EntryStationID: number;
  EntryStation: string;
  ExitStationID: number | null;
  ExitStation: string | null;
}

export default function Trips() {
  const [searchTerm, setSearchTerm] = useState("");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const data = await api.getTrips();
        setTrips(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch trips:", err);
        setError("Failed to load trips. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  const filteredTrips = trips.filter((t) =>
    t.CardNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${t.FirstName} ${t.LastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'In Progress';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getTripStatus = (exitTime: string | null) => {
    return exitTime ? 'Completed' : 'In Progress';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Trip History</h1>
        <p className="text-muted-foreground">View all passenger trips</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      <Card className="shadow-md">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center justify-between">
            <span>All Trips</span>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by card number or passenger..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Card</TableHead>
                <TableHead>Passenger</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Entry Time</TableHead>
                <TableHead>Exit Time</TableHead>
                <TableHead>Fare</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrips.length > 0 ? (
                filteredTrips.map((trip) => (
                  <TableRow key={trip.TripID}>
                    <TableCell className="font-mono">{trip.CardNumber}</TableCell>
                    <TableCell>
                      <div className="font-medium">{trip.FirstName} {trip.LastName}</div>
                      <div className="text-sm text-muted-foreground">ID: {trip.PassengerID}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{trip.EntryStation || 'Unknown'}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span>{trip.ExitStation || 'In Transit'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDateTime(trip.EntryTime)}</TableCell>
                    <TableCell>{formatDateTime(trip.ExitTime)}</TableCell>
                    <TableCell className="font-semibold">
                      ₹{trip.FareAmount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={trip.ExitTime ? 'default' : 'secondary'}>
                        {getTripStatus(trip.ExitTime)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {loading ? 'Loading trips...' : 'No trips found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
