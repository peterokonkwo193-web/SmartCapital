import { Link } from "react-router-dom";
import { ReceiptText } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { usePaperTrading } from "@/hooks/use-paper-trading";
import { formatCurrency, formatDateTime } from "@/utils/format";

const STATUS_VARIANT = {
  filled: "success",
  open: "warning",
  cancelled: "outline",
} as const;

function RecentOrdersCard() {
  const { orders, loading } = usePaperTrading();
  const recent = orders.slice(0, 6);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Your latest trade execution history.</CardDescription>
        </div>
        <CardAction>
          <Button variant="outline" size="sm" asChild>
            <Link to="/paper-trading">View all</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {!loading && recent.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No trades yet"
            description="Place your first order to see it appear here."
            action={
              <Button asChild size="sm">
                <Link to="/paper-trading">Start Trading</Link>
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.symbol}</TableCell>
                  <TableCell className="capitalize">{order.side}</TableCell>
                  <TableCell className="font-mono">{order.quantity}</TableCell>
                  <TableCell className="font-mono">{formatCurrency(order.price)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[order.status]}>{order.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(order.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export { RecentOrdersCard };
