import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface FareRule {
  FareRuleID: number;
  FareType: string;
  FareAmount: number;
  StartStationID: number;
  StartStationName: string;
  EndStationID: number;
  EndStationName: string;
}

export default function FareRules() {
  const [searchTerm, setSearchTerm] = useState("");
  const [fareRules, setFareRules] = useState<FareRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFareRule, setEditingFareRule] = useState<FareRule | null>(null);
  const [stations, setStations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    StartStationID: "",
    EndStationID: "",
    FareType: "Regular",
    FareAmount: "",
  });

  const fetchFareRules = async () => {
    try {
      setLoading(true);
      const data = await api.getFareRules();
      setFareRules(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch fare rules:", err);
      setError("Failed to load fare rules. Please try again later.");
      toast.error("Failed to load fare rules");
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    try {
      const data = await api.getStations();
      setStations(data);
    } catch (err) {
      console.error("Failed to fetch stations:", err);
    }
  };

  useEffect(() => {
    fetchFareRules();
    fetchStations();
  }, []);

  const handleOpenDialog = (fareRule?: FareRule) => {
    if (fareRule) {
      setEditingFareRule(fareRule);
      setFormData({
        StartStationID: fareRule.StartStationID.toString(),
        EndStationID: fareRule.EndStationID.toString(),
        FareType: fareRule.FareType,
        FareAmount: fareRule.FareAmount.toString(),
      });
    } else {
      setEditingFareRule(null);
      setFormData({
        StartStationID: "",
        EndStationID: "",
        FareType: "Regular",
        FareAmount: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingFareRule(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for create mode
    if (!editingFareRule) {
      if (!formData.StartStationID) {
        toast.error("Please select a start station");
        return;
      }
      if (!formData.EndStationID) {
        toast.error("Please select an end station");
        return;
      }
      if (formData.StartStationID === formData.EndStationID) {
        toast.error("Start and end stations must be different");
        return;
      }
    }
    
    if (!formData.FareType.trim()) {
      toast.error("Fare Type is required");
      return;
    }
    if (!formData.FareAmount || parseFloat(formData.FareAmount) <= 0) {
      toast.error("Fare Amount must be greater than 0");
      return;
    }
    
    try {
      if (editingFareRule) {
        // Update only FareType and FareAmount (stations are immutable)
        await api.updateFareRule(editingFareRule.FareRuleID, {
          FareType: formData.FareType,
          FareAmount: parseFloat(formData.FareAmount),
        });
        toast.success("Fare rule updated successfully");
      } else {
        await api.createFareRule({
          StartStationID: parseInt(formData.StartStationID),
          EndStationID: parseInt(formData.EndStationID),
          FareType: formData.FareType,
          FareAmount: parseFloat(formData.FareAmount),
        });
        toast.success("Fare rule created successfully");
      }
      handleCloseDialog();
      fetchFareRules();
    } catch (error: unknown) {
      console.error("Error saving fare rule:", error);
      toast.error("Failed to save fare rule");
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this fare rule?')) {
      try {
        await api.deleteFareRule(id);
        setFareRules(fareRules.filter(rule => rule.FareRuleID !== id));
        toast.success('Fare rule deleted successfully');
      } catch (error) {
        console.error('Error deleting fare rule:', error);
        toast.error('Failed to delete fare rule');
      }
    }
  };

  const filteredRules = fareRules.filter(
    (rule) =>
      rule.StartStationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.EndStationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.FareType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Fare Rules</h1>
          <p className="text-muted-foreground">Manage fare pricing rules</p>
        </div>
        <Button 
          className="bg-gradient-accent shadow-glow"
          onClick={() => handleOpenDialog()}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Fare Rule
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle>All Fare Rules</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by station or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? 'No matching fare rules found' : 'No fare rules available'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Start Station</TableHead>
                  <TableHead>End Station</TableHead>
                  <TableHead>Fare Type</TableHead>
                  <TableHead>Fare Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.map((rule) => (
                  <TableRow key={rule.FareRuleID} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{rule.StartStationName}</TableCell>
                    <TableCell>{rule.EndStationName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {rule.FareType.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-foreground">
                      ₹{rule.FareAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenDialog(rule)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDelete(rule.FareRuleID)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFareRule ? "Edit Fare Rule" : "Add New Fare Rule"}</DialogTitle>
            <DialogDescription>
              {editingFareRule ? "Update fare pricing details" : "Define fare pricing between two stations"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {editingFareRule ? (
                // Edit mode: Show read-only station fields
                <>
                  <div className="space-y-2">
                    <Label>Start Station</Label>
                    <Input value={stations.find(s => s.StationID.toString() === formData.StartStationID)?.StationName || ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>End Station</Label>
                    <Input value={stations.find(s => s.StationID.toString() === formData.EndStationID)?.StationName || ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="FareType">Fare Type *</Label>
                    <Input
                      id="FareType"
                      value={formData.FareType}
                      onChange={(e) => setFormData({ ...formData, FareType: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="FareAmount">Fare Amount (₹) *</Label>
                    <Input
                      id="FareAmount"
                      type="number"
                      step="0.01"
                      value={formData.FareAmount}
                      onChange={(e) => setFormData({ ...formData, FareAmount: e.target.value })}
                      required
                    />
                  </div>
                </>
              ) : (
                // Create mode: Show all fields
                <>
                  <div className="space-y-2">
                    <Label htmlFor="StartStationID">Start Station *</Label>
                    <Select value={formData.StartStationID} onValueChange={(value) => setFormData({ ...formData, StartStationID: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select start station" />
                      </SelectTrigger>
                      <SelectContent>
                        {stations.map((s) => (
                          <SelectItem key={s.StationID} value={s.StationID.toString()}>
                            {s.StationName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="EndStationID">End Station *</Label>
                    <Select value={formData.EndStationID} onValueChange={(value) => setFormData({ ...formData, EndStationID: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select end station" />
                      </SelectTrigger>
                      <SelectContent>
                        {stations.map((s) => (
                          <SelectItem key={s.StationID} value={s.StationID.toString()}>
                            {s.StationName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="FareType">Fare Type *</Label>
                    <Input
                      id="FareType"
                      value={formData.FareType}
                      onChange={(e) => setFormData({ ...formData, FareType: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="FareAmount">Fare Amount (₹) *</Label>
                    <Input
                      id="FareAmount"
                      type="number"
                      step="0.01"
                      value={formData.FareAmount}
                      onChange={(e) => setFormData({ ...formData, FareAmount: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">{editingFareRule ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
