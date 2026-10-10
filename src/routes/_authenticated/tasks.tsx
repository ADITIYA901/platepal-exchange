import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, MapPin, Package, Truck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { DonationMap } from "@/components/donation-map";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({ meta: [{ title: "Pickup Tasks — FoodLoop" }] }),
  component: TasksPage,
});

const TIMELINE = ["Posted", "Accepted", "Assigned", "Collected", "Delivered"];

function stepIndex(taskStatus: string, hasVolunteer: boolean) {
  if (taskStatus === "delivered") return 4;
  if (taskStatus === "collected") return 3;
  return hasVolunteer ? 2 : 1;
}

function TasksPage() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const tasks = useQuery({
    queryKey: ["tasks", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pickup_tasks")
        .select("*, donation:donations(*), ngo:profiles!pickup_tasks_ngo_id_fkey(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const open = (tasks.data ?? []).filter((t) => !t.volunteer_id);
  const mine = (tasks.data ?? []).filter((t) => t.volunteer_id === userId && t.status !== "delivered");
  const done = (tasks.data ?? []).filter((t) => t.volunteer_id === userId && t.status === "delivered");

  async function claim(id: string) {
    const { data, error } = await supabase
      .from("pickup_tasks")
      .update({ volunteer_id: userId })
      .eq("id", id)
      .is("volunteer_id", null)
      .select();
    if (error) toast.error(error.message);
    else if (!data?.length) toast.error("Another volunteer already took this task.");
    else toast.success("Task accepted!");
    void queryClient.invalidateQueries();
  }

  async function advance(task: (typeof mine)[number]) {
    const next = task.status === "assigned" ? "collected" : "delivered";
    const patch =
      next === "collected"
        ? { status: next as "collected", collected_at: new Date().toISOString() }
        : { status: next as "delivered", delivered_at: new Date().toISOString() };
    const { error } = await supabase.from("pickup_tasks").update(patch).eq("id", task.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase
      .from("donations")
      .update({ status: next === "collected" ? "picked_up" : "delivered" })
      .eq("id", task.donation_id);
    if (task.donation) {
      await supabase.from("notifications").insert({
        user_id: task.donation.donor_id,
        title: next === "collected" ? "Food collected" : "Delivery confirmed",
        body: `“${task.donation.title}” was ${next}.`,
      });
    }
    toast.success(next === "collected" ? "Marked as collected" : "Delivery confirmed — impact updated!");
    void queryClient.invalidateQueries();
  }

  function TaskCard({ task, action }: { task: (typeof mine)[number]; action?: React.ReactNode }) {
    const d = task.donation;
    const idx = stepIndex(task.status, !!task.volunteer_id);
    return (
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">{d?.title}</h3>
              <p className="text-xs text-muted-foreground">{d?.quantity_kg} kg · {d?.category}</p>
            </div>
            <Badge variant="secondary">{task.status}</Badge>
          </div>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex items-start gap-2"><Package className="mt-0.5 h-4 w-4 text-primary" /><div><div className="text-xs text-muted-foreground">Pickup</div>{d?.address}</div></div>
            <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-primary" /><div><div className="text-xs text-muted-foreground">Deliver to</div>{task.ngo?.org_name ?? task.ngo?.full_name} — {task.ngo?.address}</div></div>
          </div>
          {task.notes && <p className="mt-2 text-xs text-muted-foreground">Note: {task.notes}</p>}
          <div className="mt-4 flex items-center gap-1">
            {TIMELINE.map((s, i) => (
              <div key={s} className="flex flex-1 flex-col items-center">
                <div className={`h-2 w-full rounded-full ${i <= idx ? "bg-primary" : "bg-muted"}`} />
                <span className={`mt-1 text-[10px] ${i <= idx ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
              </div>
            ))}
          </div>
          {action && <div className="mt-4">{action}</div>}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">Volunteer dashboard</h1>
        <p className="text-muted-foreground">Pick up surplus food and deliver it to partner NGOs.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="p-4"><div className="text-2xl font-bold">{open.length}</div><div className="text-xs text-muted-foreground">Open tasks</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-2xl font-bold">{mine.length}</div><div className="text-xs text-muted-foreground">In progress</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-2xl font-bold">{done.length}</div><div className="text-xs text-muted-foreground">Completed</div></CardContent></Card>
        </div>

        <div className="mt-6">
          <DonationMap
            donations={(tasks.data ?? []).map((t) => t.donation).filter((d): d is NonNullable<typeof d> => !!d)}
            ngos={(tasks.data ?? []).map((t) => t.ngo).filter((n): n is NonNullable<typeof n> => !!n)}
            height="320px"
          />
          <p className="mt-1 text-xs text-muted-foreground">Markers show pickup points; green circles show NGO drop-offs. Locations are static — not live GPS tracking.</p>
        </div>

        <Tabs defaultValue="mine" className="mt-8">
          <TabsList>
            <TabsTrigger value="mine">My tasks</TabsTrigger>
            <TabsTrigger value="open">Available</TabsTrigger>
            <TabsTrigger value="done">Completed</TabsTrigger>
          </TabsList>
          <TabsContent value="mine" className="mt-4 space-y-4">
            {mine.length === 0 && <p className="text-muted-foreground">No active tasks. Check the Available tab.</p>}
            {mine.map((t) => (
              <TaskCard key={t.id} task={t} action={
                <Button size="sm" onClick={() => advance(t)}>
                  {t.status === "assigned" ? <><Truck className="mr-1 h-3 w-3" /> Confirm pickup</> : <><CheckCircle2 className="mr-1 h-3 w-3" /> Confirm delivery</>}
                </Button>
              } />
            ))}
          </TabsContent>
          <TabsContent value="open" className="mt-4 space-y-4">
            {open.length === 0 && <p className="text-muted-foreground">No open pickup tasks right now.</p>}
            {open.map((t) => (
              <TaskCard key={t.id} task={t} action={<Button size="sm" onClick={() => claim(t.id)}>Accept task</Button>} />
            ))}
          </TabsContent>
          <TabsContent value="done" className="mt-4 space-y-4">
            {done.length === 0 && <p className="text-muted-foreground">No completed deliveries yet.</p>}
            {done.map((t) => <TaskCard key={t.id} task={t} />)}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
