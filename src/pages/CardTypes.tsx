import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface CardType {
  CardTypeID: number;
  TypeName: string;
  BaseFareMultiplier: number;
  Description: string;
}

export default function CardTypes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [cardTypes, setCardTypes] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCardType, setEditingCardType] = useState<CardType | null>(null);
  const [formData, setFormData] = useState({
    TypeName: "",
    BaseFareMultiplier: "1.0",
    Description: "",
  });

  const fetchCardTypes = async () => {
    try {
      setLoading(true);
      const data = await api.getCardTypes();
      setCardTypes(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch card types:", err);
      setError("Failed to load card types. Please try again later.");
      toast.error("Failed to load card types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCardTypes();
  }, []);

  const handleOpenDialog = (cardType?: CardType) => {
    if (cardType) {
      setEditingCardType(cardType);
      setFormData({
        TypeName: cardType.TypeName,
        BaseFareMultiplier: cardType.BaseFareMultiplier.toString(),
        Description: cardType.Description || "",
      });
    } else {
      setEditingCardType(null);
      setFormData({
        TypeName: "",
        BaseFareMultiplier: "1.0",
        Description: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCardType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        TypeName: formData.TypeName,
        BaseFareMultiplier: parseFloat(formData.BaseFareMultiplier),
        Description: formData.Description,
      };
      if (editingCardType) {
        await api.updateCardType(editingCardType.CardTypeID, payload);
        toast.success("Card type updated successfully");
      } else {
        await api.createCardType(payload);
        toast.success("Card type created successfully");
      }
      handleCloseDialog();
      fetchCardTypes();
    } catch (error: unknown) {
      console.error("Error saving card type:", error);
      toast.error("Failed to save card type");
    }
  };

  const filteredCardTypes = cardTypes.filter((ct) =>
    ct.TypeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (cardTypeId: number) => {
    if (window.confirm('Are you sure you want to delete this card type?')) {
      try {
        await api.deleteCardType(cardTypeId);
        toast.success('Card type deleted successfully');
        fetchCardTypes();
      } catch (error) {
        console.error('Error deleting card type:', error);
        toast.error('Failed to delete card type');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Card Type Management</h1>
          <p className="text-muted-foreground">Manage different card categories</p>
        </div>
        <Button 
          className="bg-gradient-accent shadow-glow"
          onClick={() => handleOpenDialog()}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Card Type
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle>All Card Types</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search card types..."
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
                  <TableHead>Type ID</TableHead>
                  <TableHead>Type Name</TableHead>
                  <TableHead>Fare Multiplier</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCardTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No card types found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCardTypes.map((cardType) => (
                    <TableRow key={cardType.CardTypeID} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{cardType.CardTypeID}</TableCell>
                      <TableCell className="font-semibold">{cardType.TypeName}</TableCell>
                      <TableCell>
                        <span className="font-mono text-accent">{cardType.BaseFareMultiplier}x</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{cardType.Description || '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenDialog(cardType)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDelete(cardType.CardTypeID)}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCardType ? "Edit Card Type" : "Add New Card Type"}</DialogTitle>
            <DialogDescription>
              {editingCardType ? "Update card type information" : "Enter card type details"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="TypeName">Type Name *</Label>
                <Input
                  id="TypeName"
                  value={formData.TypeName}
                  onChange={(e) => setFormData({ ...formData, TypeName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="BaseFareMultiplier">Base Fare Multiplier *</Label>
                <Input
                  id="BaseFareMultiplier"
                  type="number"
                  step="0.1"
                  value={formData.BaseFareMultiplier}
                  onChange={(e) => setFormData({ ...formData, BaseFareMultiplier: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="Description">Description</Label>
                <Textarea
                  id="Description"
                  value={formData.Description}
                  onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCardType ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
