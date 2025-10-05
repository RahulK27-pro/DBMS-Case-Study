import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
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

interface Station {
  StationID: number;
  StationName: string;
  LineColor: string | null;
}

export default function Stations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        const data = await api.getStations();
        setStations(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch stations:", err);
        setError("Failed to load stations. Please try again later.");
        toast.error("Failed to load stations");
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  const getLineColorClass = (color: string | null) => {
    if (!color) return "bg-gray-500";
    
    const colorMap: Record<string, string> = {
      Blue: "bg-blue-500",
      Red: "bg-red-500",
      Green: "bg-green-500",
      Yellow: "bg-yellow-500",
      Purple: "bg-purple-500",
      Orange: "bg-orange-500",
      Pink: "bg-pink-500",
      Cyan: "bg-cyan-500",
    };
    return colorMap[color] || "bg-gray-500";
  };

  const filteredStations = stations.filter((station) =>
    station.StationName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (stationId: number) => {
    if (window.confirm('Are you sure you want to delete this station?')) {
      try {
        // TODO: Implement delete API call
        // await api.deleteStation(stationId);
        setStations(stations.filter(station => station.StationID !== stationId));
        toast.success('Station deleted successfully');
      } catch (error) {
        console.error('Error deleting station:', error);
        toast.error('Failed to delete station');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Station Management</h1>
          <p className="text-muted-foreground">Manage metro stations and lines</p>
        </div>
        <Button 
          className="bg-gradient-accent shadow-glow"
          onClick={() => toast.info("Add station feature coming soon")}
        >
          <Plus className="w-4 h-4 mr-2" />
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle>All Stations</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search stations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
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
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Station ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Line</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No stations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStations.map((station) => (
                    <TableRow key={station.StationID} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{station.StationID}</TableCell>
                      <TableCell className="font-semibold">{station.StationName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span 
                            className={`w-3 h-3 rounded-full ${getLineColorClass(station.LineColor)}`}
                            aria-label={station.LineColor || 'No line'}
                          ></span>
                          <span>{station.LineColor || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => toast.info(`Edit ${station.StationName} clicked`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDelete(station.StationID)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
