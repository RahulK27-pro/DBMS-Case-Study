import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface Passenger {
  PassengerID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneNumber: string;
  RegistrationDate: string;
}

export default function Passengers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPassengers = async () => {
      try {
        setLoading(true);
        const data = await api.getPassengers();
        setPassengers(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch passengers:", err);
        setError("Failed to load passengers. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPassengers();
  }, []);

  const filteredPassengers = passengers.filter(
    (p) =>
      (p.FirstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (p.LastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (p.Email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-center py-8">Loading passengers...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Passenger Management</h1>
          <p className="text-muted-foreground">Manage registered passengers</p>
        </div>
        <Button className="bg-gradient-accent shadow-glow">
          <Plus className="w-4 h-4 mr-2" />
          Add Passenger
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center justify-between">
            <span>All Passengers</span>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
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
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Registration Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPassengers.map((passenger) => (
                <TableRow key={passenger.PassengerID}>
                  <TableCell className="font-medium">
                    {passenger.FirstName} {passenger.LastName}
                  </TableCell>
                  <TableCell>{passenger.Email}</TableCell>
                  <TableCell>{passenger.PhoneNumber}</TableCell>
                  <TableCell>
                    {new Date(passenger.RegistrationDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="mr-2">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
