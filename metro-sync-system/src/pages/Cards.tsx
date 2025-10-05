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

  useEffect(() => {
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

    fetchCards();
  }, []);

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

  const handleEdit = (card: CardType) => {
    toast.info(`Edit card ${card.CardNumber} clicked`);
    // TODO: Implement edit functionality
  };

  const handleDelete = async (cardId: number) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      try {
        // TODO: Implement delete API call
        // await api.deleteCard(cardId);
        setCards(cards.filter(card => card.CardID !== cardId));
        toast.success('Card deleted successfully');
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
          onClick={() => toast.info("Feature coming soon")}
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
    </div>
  );
}
