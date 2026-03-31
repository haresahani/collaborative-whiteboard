export type Collaborator = {
  id: string;
  name: string;
  initials: string;
  role: string;
  status: string;
  accent: string;
  isOnline: boolean;
  avatar?: string;
};

export type ActivityItem = {
  id: string;
  actor: string;
  initials: string;
  accent: string;
  message: string;
  timestamp: string;
};

export const COLLABORATORS: Collaborator[] = [
  {
    id: "you",
    name: "You",
    initials: "You",
    role: "Owner",
    status: "Reviewing board",
    accent: "#5146e5",
    isOnline: true,
  },
  {
    id: "al",
    name: "AL",
    initials: "AL",
    role: "Designer",
    status: "Active now",
    accent: "#9a8f82",
    isOnline: true,
  },
  {
    id: "bt",
    name: "BT",
    initials: "BT",
    role: "PM",
    status: "Active now",
    accent: "#8b796a",
    isOnline: true,
  },
  {
    id: "ms",
    name: "MS",
    initials: "MS",
    role: "Engineer",
    status: "Watching edits",
    accent: "#aa9b8a",
    isOnline: true,
  },
];

export const ACTIVITY_FEED: ActivityItem[] = [
  {
    id: "activity-1",
    actor: "AL",
    initials: "AL",
    accent: "#9a8f82",
    message: "Updated the sprint frame and regrouped notes.",
    timestamp: "3 minutes ago",
  },
  {
    id: "activity-2",
    actor: "BT",
    initials: "BT",
    accent: "#8b796a",
    message: "Repositioned the planning flow for review.",
    timestamp: "12 minutes ago",
  },
  {
    id: "activity-3",
    actor: "MS",
    initials: "MS",
    accent: "#aa9b8a",
    message: "Adjusted connector spacing for the final pass.",
    timestamp: "28 minutes ago",
  },
];
