import { useState, useEffect } from "react";
import { Search, ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface Transaction {
  TransactionID: number;
  TransactionType: string;
  Amount: number;
  TransactionDate: string;
  CardNumber: string;
  PassengerName: string;
  PassengerID: number;
}

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const data = await api.getTransactions();
        setTransactions(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
        setError("Failed to load transactions. Please try again later.");
        toast.error("Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredTransactions = transactions.filter((t) =>
    t.CardNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.PassengerName.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Transaction History</h1>
        <p className="text-muted-foreground">View all card transactions</p>
      </div>

      <Card className="shadow-md">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle>All Transactions</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by card or passenger..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? 'No matching transactions found' : 'No transactions available'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Card Number</TableHead>
                  <TableHead>Passenger</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date & Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.TransactionID} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{transaction.TransactionID}</TableCell>
                    <TableCell>
                      <Badge className={transaction.Amount > 0 ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"}>
                        <div className="flex items-center gap-1">
                          {transaction.Amount > 0 ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          {transaction.TransactionType}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{transaction.CardNumber}</TableCell>
                    <TableCell>{transaction.PassengerName}</TableCell>
                    <TableCell className={`font-bold ${transaction.Amount > 0 ? 'text-success' : 'text-primary'}`}>
                      {transaction.Amount > 0 ? '+' : ''}₹{Math.abs(transaction.Amount).toFixed(2)}
                    </TableCell>
                    <TableCell>{formatDate(transaction.TransactionDate)}</TableCell>
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
