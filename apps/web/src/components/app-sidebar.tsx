import {
	Building2,
	Settings2,
	Command,
	Layers,
} from "lucide-react";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@ino-trips/backend/convex/_generated/api";

const getNavData = (userPrimaryOrg?: any) => {
	const baseItems = [
		{
			title: "All Organizations",
			url: "/organizations",
			icon: Building2,
			iconColor: "text-blue-500",
		},
	];

	if (userPrimaryOrg?.organization?._id) {
		baseItems.push({
			title: "My Organization",
			url: `/organizations/${userPrimaryOrg.organization._id}`,
			icon: Layers,
			iconColor: "text-indigo-500",
		});
	}

	return {
		navMain: [
			{
				title: "Overview",
				url: "#",
				icon: Layers,
				iconColor: "text-indigo-500",
				items: baseItems,
			},
			{
				title: "Settings",
				url: "#",
				icon: Settings2,
				iconColor: "text-gray-500",
				items: [
					{
						title: "Organization Settings",
						url: "/organizations",
						icon: Settings2,
						iconColor: "text-gray-500",
					},
				],
			},
		],
	};
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const router = useRouterState();
	const user = useQuery(api.auth.getCurrentUser);
	const userPrimaryOrg = useQuery(api.organizations.getUserPrimaryOrg);

	const navData = getNavData(userPrimaryOrg);

	return (
		<Sidebar variant="inset" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" render={(props) => <Link to="/organizations" {...props} />}>
							<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
								<Command className="size-4" />
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">
									{userPrimaryOrg?.organization.name || "Organizations"}
								</span>
								{userPrimaryOrg?.isChildOrg && (
									<span className="truncate text-xs text-muted-foreground">
										Child Organization
									</span>
								)}
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				{navData.navMain.map((item) => (
					<SidebarGroup key={item.title}>
						<SidebarGroupLabel>{item.title}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{item.items.map((navItem) => {
									const isActive = router.location.pathname.startsWith(navItem.url);
									return (
										<SidebarMenuItem key={navItem.title}>
											<SidebarMenuButton
												isActive={isActive}
												render={(props) => <Link to={navItem.url} {...props} />}
											>
												<navItem.icon className={`mr-2 ${navItem.iconColor}`} />
												{navItem.title}
											</SidebarMenuButton>
										</SidebarMenuItem>
									);
								})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	);
}

