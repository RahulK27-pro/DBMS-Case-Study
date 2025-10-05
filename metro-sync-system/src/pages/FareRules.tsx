import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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

  useEffect(() => {
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

    fetchFareRules();
  }, []);

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
          onClick={() => toast.info("Add fare rule functionality coming soon")}
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
                          onClick={() => toast.info("Edit functionality coming soon")}
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
    </div>
  );
}
