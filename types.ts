
export type Language = 'en' | 'ru' | 'uk';

export interface User {
  id: string;
  peerId?: string; // For Global P2P
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline';
  bio?: string;
  isBot?: boolean;
  wallpaper?: string;
  lang: Language;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderPeerId?: string; // Peer ID of the sender for P2P mapping
  senderName?: string;
  text: string;
  timestamp: number;
  type: 'text' | 'image';
  imageUrl?: string;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  name?: string;
  avatar?: string;
  type: 'private' | 'group';
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
