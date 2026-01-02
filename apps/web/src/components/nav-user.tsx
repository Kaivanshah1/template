import { useQuery } from "convex/react";
import { api } from "@ino-trips/backend/convex/_generated/api";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { User } from "lucide-react";

export function NavUser() {
	const user = useQuery(api.auth.getCurrentUser);

	if (!user) return null;

	const userInitials = user.name
		?.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2) || "U";

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton size="lg">
					<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
						<User className="size-4" />
					</div>
					<div className="grid flex-1 text-left text-sm leading-tight">
						<span className="truncate font-semibold">{user.name || user.email}</span>
						<span className="truncate text-xs text-muted-foreground">
							{user.email}
						</span>
					</div>
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}

