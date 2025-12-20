export interface LinkItem {
  title: string;
  url: string;
  description?: string;
  icon?: string;
  color?: string;
  category?: string;
}

export interface LinkCategory {
  name: string;
  title: string;
  description?: string;
}

export interface ProfileInfo {
  name: string;
  avatar: string;
  bio: string;
  location: string;
}

export const linkCategories: LinkCategory[] = [
  {
    name: "personal",
    title: "Personal",
  },
  {
    name: "social",
    title: "Social Media",
  },
];

export const links: LinkItem[] = [
  {
    title: "Instagram",
    url: "https://www.instagram.com/alexisbirding/",
    description: "My bird photography Instagram",
    icon: "instagram",
    color: "#FF0069",
    category: "social",
  },
  {
    title: "Bluesky",
    url: "https://bsky.app/profile/alexislours.com",
    description: "Follow me on Bluesky",
    icon: "bluesky",
    color: "#0085ff",
    category: "social",
  },
  {
    title: "Flickr",
    url: "https://www.flickr.com/photos/alexislours/",
    description: "My Flickr photos",
    icon: "flickr",
    color: "#0063DC",
    category: "social",
  },
  {
    title: "Wikimedia Commons",
    url: "https://commons.wikimedia.org/wiki/User:Alexis_Lours",
    description: "My Wikimedia Commons user page",
    icon: "commons",
    color: "#006699",
    category: "social",
  },
  {
    title: "iNaturalist",
    url: "https://www.inaturalist.org/people/alexislours",
    description: "My iNaturalist profile",
    icon: "inaturalist",
    color: "#74AC00",
    category: "social",
  },
  {
    title: "Mail",
    url: "mailto:alexislours@protonmail.com",
    description: "Email me",
    icon: "mail",
    color: "#6366F1",
    category: "personal",
  },
  {
    title: "Portfolio",
    url: "https://alexislours.com",
    description: "My photography portfolio",
    icon: "favicon",
    color: "#000000",
    category: "personal",
  },
  {
    title: "Analog",
    url: "/analog/",
    description: "My film photography collection",
    icon: "film",
    color: "#c9a227",
    category: "personal",
  },
];

export const profileInfo: ProfileInfo = {
  name: "Alexis LOURS",
  avatar: "/favicon.png",
  bio: "I'm a wildlife photographer on my spare time. My goal is to share nature as is, with minimal editing, and simply capture the moment as I saw it.",
  location: "France",
};
