import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPassenger, setEditingPassenger] = useState<Passenger | null>(null);
  const [formData, setFormData] = useState({
    FirstName: "",
    LastName: "",
    Email: "",
    PhoneNumber: "",
  });

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

  useEffect(() => {
    fetchPassengers();
  }, []);

  const handleOpenDialog = (passenger?: Passenger) => {
    if (passenger) {
      setEditingPassenger(passenger);
      setFormData({
        FirstName: passenger.FirstName,
        LastName: passenger.LastName,
        Email: passenger.Email,
        PhoneNumber: passenger.PhoneNumber,
      });
    } else {
      setEditingPassenger(null);
      setFormData({
        FirstName: "",
        LastName: "",
        Email: "",
        PhoneNumber: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPassenger(null);
    setFormData({
      FirstName: "",
      LastName: "",
      Email: "",
      PhoneNumber: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPassenger) {
        await api.updatePassenger(editingPassenger.PassengerID, formData);
        toast.success("Passenger updated successfully");
      } else {
        await api.createPassenger(formData);
        toast.success("Passenger created successfully");
      }
      handleCloseDialog();
      fetchPassengers();
    } catch (error: any) {
      console.error("Error saving passenger:", error);
      toast.error(error.message || "Failed to save passenger");
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this passenger?")) {
      try {
        await api.deletePassenger(id);
        toast.success("Passenger deleted successfully");
        fetchPassengers();
      } catch (error) {
        console.error("Error deleting passenger:", error);
        toast.error("Failed to delete passenger");
      }
    }
  };

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
        <Button className="bg-gradient-accent shadow-glow" onClick={() => handleOpenDialog()}>
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
                    <Button variant="ghost" size="sm" className="mr-2" onClick={() => handleOpenDialog(passenger)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(passenger.PassengerID)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPassenger ? "Edit Passenger" : "Add New Passenger"}</DialogTitle>
            <DialogDescription>
              {editingPassenger ? "Update passenger information" : "Enter passenger details to register"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="FirstName">First Name *</Label>
                <Input
                  id="FirstName"
                  value={formData.FirstName}
                  onChange={(e) => setFormData({ ...formData, FirstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="LastName">Last Name *</Label>
                <Input
                  id="LastName"
                  value={formData.LastName}
                  onChange={(e) => setFormData({ ...formData, LastName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="Email">Email *</Label>
                <Input
                  id="Email"
                  type="email"
                  value={formData.Email}
                  onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="PhoneNumber">Phone Number</Label>
                <Input
                  id="PhoneNumber"
                  value={formData.PhoneNumber}
                  onChange={(e) => setFormData({ ...formData, PhoneNumber: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingPassenger ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
