import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1>Home</h1>
      <Button>Click me</Button>
    </div>
  );
}
