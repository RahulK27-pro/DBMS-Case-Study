import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
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

interface CardType {
  CardID: number;
  CardNumber: string;
  Status: 'Active' | 'Blocked' | 'Inactive';
  IssueDate: string;
  ExpiryDate: string;
  Balance: number;
  FirstName: string;
  LastName: string;
  TypeName: string;
}

export default function Cards() {
  const [searchTerm, setSearchTerm] = useState("");
  const [cards, setCards] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardType | null>(null);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [cardTypes, setCardTypes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    CardNumber: "",
    Balance: "0",
    PassengerID: "",
    CardTypeID: "",
    Status: "Active",
  });

  const fetchCards = async () => {
    try {
      setLoading(true);
      const data = await api.getCards();
      setCards(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch cards:", err);
      setError("Failed to load cards. Please try again later.");
      toast.error("Failed to load cards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
    fetchPassengers();
    fetchCardTypes();
  }, []);

  const fetchPassengers = async () => {
    try {
      const data = await api.getPassengers();
      setPassengers(data);
    } catch (err) {
      console.error("Failed to fetch passengers:", err);
    }
  };

  const fetchCardTypes = async () => {
    try {
      const data = await api.getCardTypes();
      setCardTypes(data);
    } catch (err) {
      console.error("Failed to fetch card types:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-success text-success-foreground";
      case "Blocked":
        return "bg-destructive text-destructive-foreground";
      case "Inactive":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredCards = cards.filter(
    (card) =>
      card.CardNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${card.FirstName} ${card.LastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (card?: CardType) => {
    if (card) {
      setEditingCard(card);
      setFormData({
        CardNumber: card.CardNumber,
        Balance: card.Balance.toString(),
        PassengerID: "", // Read-only for edit
        CardTypeID: "", // Read-only for edit
        Status: card.Status,
      });
    } else {
      setEditingCard(null);
      setFormData({
        CardNumber: "",
        Balance: "0",
        PassengerID: "",
        CardTypeID: "",
        Status: "Active",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCard(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for create mode
    if (!editingCard) {
      if (!formData.CardNumber.trim()) {
        toast.error("Card Number is required");
        return;
      }
      if (!formData.PassengerID) {
        toast.error("Please select a passenger");
        return;
      }
      if (!formData.CardTypeID) {
        toast.error("Please select a card type");
        return;
      }
    }
    
    try {
      if (editingCard) {
        // Update only Balance and Status
        await api.updateCard(editingCard.CardID, {
          Balance: parseFloat(formData.Balance),
          Status: formData.Status,
        });
        toast.success("Card updated successfully");
      } else {
        await api.createCard({
          CardNumber: formData.CardNumber,
          Balance: parseFloat(formData.Balance),
          PassengerID: parseInt(formData.PassengerID),
          CardTypeID: parseInt(formData.CardTypeID),
          Status: formData.Status,
        });
        toast.success("Card created successfully");
      }
      handleCloseDialog();
      fetchCards();
    } catch (error: any) {
      console.error("Error saving card:", error);
      toast.error(error.message || "Failed to save card");
    }
  };

  const handleEdit = (card: CardType) => {
    handleOpenDialog(card);
  };

  const handleDelete = async (cardId: number) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      try {
        await api.deleteCard(cardId);
        toast.success('Card deleted successfully');
        fetchCards();
      } catch (error) {
        console.error('Error deleting card:', error);
        toast.error('Failed to delete card');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Card Management</h1>
          <p className="text-muted-foreground">Manage transport cards</p>
        </div>
        <Button 
          className="bg-gradient-accent shadow-glow"
          onClick={() => handleOpenDialog()}
        >
          <Plus className="w-4 h-4 mr-2" />
          Issue New Card
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="relative w-80">
              <Input
                type="search"
                placeholder="Search cards or passengers..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <p>{error}</p>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCards.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No cards found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Card Number</TableHead>
                      <TableHead>Passenger</TableHead>
                      <TableHead>Card Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCards.map((card) => (
                      <TableRow key={card.CardID}>
                        <TableCell className="font-medium">{card.CardNumber}</TableCell>
                        <TableCell>{`${card.FirstName} ${card.LastName}`}</TableCell>
                        <TableCell>{card.TypeName}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(card.Status)}>
                            {card.Status}
                          </Badge>
                        </TableCell>
                        <TableCell>${card.Balance.toFixed(2)}</TableCell>
                        <TableCell>{new Date(card.ExpiryDate).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(card)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(card.CardID)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCard ? "Edit Card" : "Issue New Card"}</DialogTitle>
            <DialogDescription>
              {editingCard ? "Update card balance and status" : "Enter card details to issue a new transport card"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {editingCard ? (
                // Edit mode: Show read-only fields and editable fields
                <>
                  <div className="space-y-2">
                    <Label>Card Number</Label>
                    <Input value={formData.CardNumber} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="Balance">Balance *</Label>
                    <Input
                      id="Balance"
                      type="number"
                      step="0.01"
                      value={formData.Balance}
                      onChange={(e) => setFormData({ ...formData, Balance: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="Status">Status *</Label>
                    <Select value={formData.Status} onValueChange={(value) => setFormData({ ...formData, Status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                // Create mode: Show all fields
                <>
                  <div className="space-y-2">
                    <Label htmlFor="CardNumber">Card Number *</Label>
                    <Input
                      id="CardNumber"
                      value={formData.CardNumber}
                      onChange={(e) => setFormData({ ...formData, CardNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="PassengerID">Passenger *</Label>
                    <Select value={formData.PassengerID} onValueChange={(value) => setFormData({ ...formData, PassengerID: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select passenger" />
                      </SelectTrigger>
                      <SelectContent>
                        {passengers.map((p) => (
                          <SelectItem key={p.PassengerID} value={p.PassengerID.toString()}>
                            {p.FirstName} {p.LastName} ({p.Email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="CardTypeID">Card Type *</Label>
                    <Select value={formData.CardTypeID} onValueChange={(value) => setFormData({ ...formData, CardTypeID: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select card type" />
                      </SelectTrigger>
                      <SelectContent>
                        {cardTypes.map((ct) => (
                          <SelectItem key={ct.CardTypeID} value={ct.CardTypeID.toString()}>
                            {ct.TypeName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="Balance">Initial Balance</Label>
                    <Input
                      id="Balance"
                      type="number"
                      step="0.01"
                      value={formData.Balance}
                      onChange={(e) => setFormData({ ...formData, Balance: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">{editingCard ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
