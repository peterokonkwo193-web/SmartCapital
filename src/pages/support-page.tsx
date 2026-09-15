import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LifeBuoy, Mail, MessageCircle, Plus, Search, Ticket } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Spinner } from "@/components/common/spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useSupportTickets } from "@/hooks/use-support-tickets";
import { supportTicketSchema, type SupportTicketInput } from "@/lib/validation";
import { formatDateTime } from "@/utils/format";

const FAQ = [
  { question: "Is this a real trading platform?", answer: "Yes. SmartCapital is a live trading platform where you can buy and sell real financial assets. All orders are executed against real market prices." },
  { question: "Where does market data come from?", answer: "Prices are streamed in real time from Binance WebSocket (crypto) and live market data feeds. All quotes reflect actual current market conditions." },
  { question: "How do I fund my account?", answer: "Go to the Deposits page, choose your preferred payment method (bank transfer, card, or crypto), and submit a deposit request. Our team will confirm it promptly." },
  { question: "Can I lose money trading?", answer: "Yes. Trading real assets involves financial risk. You may lose some or all of the funds you deposit. Only invest what you can afford to lose." },
  { question: "How do I withdraw my profits?", answer: "Contact support to initiate a withdrawal. Withdrawals are processed within 1-3 business days depending on the method." },
  { question: "Is my account data secure?", answer: "Yes — authentication is handled securely. Your financial credentials and account data are encrypted and protected." },
];

const TICKET_STATUS_VARIANT = { open: "warning", in_progress: "accent", pending: "secondary", resolved: "success", closed: "outline" } as const;

function SupportPage() {
  const [query, setQuery] = useState("");
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const { tickets, repliesByTicket, loading } = useSupportTickets();

  useEffect(() => {
    document.title = "Support — SmartCapital";
  }, []);

  const filteredFaq = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ;
    return FAQ.filter((item) => item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="space-y-6">
      <PageHeader title="Support" description="Find answers or reach out — we're here to help." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <div className="relative pt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 mt-1 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search help articles…" className="pl-9" />
            </div>
          </CardHeader>
          <CardContent>
            {filteredFaq.length === 0 ? (
              <EmptyState icon={Search} title="No results" description="Try a different search term, or open a support ticket." />
            ) : (
              <div className="divide-y divide-border">
                {filteredFaq.map((item) => (
                  <div key={item.question} className="py-4 first:pt-0 last:pb-0">
                    <h3 className="text-sm font-semibold text-foreground">{item.question}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="size-4" /> Contact Support
              </CardTitle>
              <CardDescription>Fast and friendly assistance from our team.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus /> Open a Ticket
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Open a Support Ticket</DialogTitle>
                    <DialogDescription>Tell us what's going on and we'll get back to you.</DialogDescription>
                  </DialogHeader>
                  <NewTicketForm onSuccess={() => setTicketDialogOpen(false)} />
                </DialogContent>
              </Dialog>
              <div className="flex items-center gap-2.5 rounded-md border border-border px-3.5 py-3 text-sm text-muted-foreground">
                <Mail className="size-4 shrink-0" />
                support@smartcapital.app
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LifeBuoy className="size-4" /> Response Times
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>General inquiries: within 1 business day</p>
              <p>Account issues: within 4 hours</p>
              <p>Our support team monitors tickets 24/7. Response times vary by priority.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket History</CardTitle>
          <CardDescription>Your previously submitted support requests.</CardDescription>
        </CardHeader>
        <CardContent>
          {!loading && tickets.length === 0 ? (
            <EmptyState icon={Ticket} title="No support tickets" description="Tickets you open will appear here with their status." />
          ) : (
            <div className="divide-y divide-border">
              {tickets.map((ticket) => {
                const replies = repliesByTicket[ticket.id] ?? [];
                return (
                  <div key={ticket.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{ticket.subject}</p>
                        <p className="mt-0.5 line-clamp-2 max-w-lg text-sm text-muted-foreground">{ticket.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {ticket.category} · {formatDateTime(ticket.createdAt)}
                        </p>
                      </div>
                      <Badge variant={TICKET_STATUS_VARIANT[ticket.status]} className="shrink-0 capitalize">
                        {ticket.status}
                      </Badge>
                    </div>

                    {replies.length > 0 && (
                      <div className="mt-3 space-y-2 border-l-2 border-primary/30 pl-3.5">
                        {replies.map((reply) => (
                          <div key={reply.id}>
                            <p className="text-xs font-medium text-foreground">
                              {reply.authorName} <span className="font-normal text-muted-foreground">· {formatDateTime(reply.createdAt)}</span>
                            </p>
                            <p className="text-sm leading-relaxed text-muted-foreground">{reply.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NewTicketForm({ onSuccess }: { onSuccess: () => void }) {
  const { createTicket } = useSupportTickets();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SupportTicketInput>({ resolver: zodResolver(supportTicketSchema), defaultValues: { category: "Account" } });

  async function onSubmit(values: SupportTicketInput) {
    try {
      await createTicket(values);
      toast.success("Support ticket submitted");
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit ticket.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="category">Category</Label>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Account">Account</SelectItem>
                <SelectItem value="Trading">Trading</SelectItem>
                <SelectItem value="Market Data">Market Data</SelectItem>
                <SelectItem value="Billing">Billing</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" aria-invalid={Boolean(errors.subject)} {...register("subject")} />
        {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" rows={5} aria-invalid={Boolean(errors.message)} {...register("message")} />
        {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Spinner className="size-4 text-current" />}
        Submit Ticket
      </Button>
    </form>
  );
}

export default SupportPage;
