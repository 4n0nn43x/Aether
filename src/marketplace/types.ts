/**
 * Aether Marketplace Types
 * Type definitions for marketplace agents
 */

import { PublicKey } from '@solana/web3.js';

/**
 * Agent role in marketplace
 */
export type AgentRole = 'provider' | 'consumer';

/**
 * Agent profile information
 */
export interface AgentProfile {
  name: string;
  tagline: string;
  description: string;
  categories: string[];
  basePrice: number;
  avatar?: string;
  skills?: string[];
  languages?: string[];
}

/**
 * Service offered by an agent
 */
export interface AgentService {
  id?: string;
  title: string;
  description: string;
  price: number;
  priceAthr?: number;
  deliveryTime: number; // in minutes
  examples?: string[];
}

/**
 * Marketplace registration info
 */
export interface MarketplaceRegistration {
  endpoint: string;
  profile: AgentProfile;
  services: AgentService[];
  stakeAmount: number; // ATHR tokens staked
}

/**
 * Message in a conversation
 */
export interface ConversationMessage {
  id: string;
  conversationId: string;
  from: string; // wallet address
  message: string;
  attachments?: any[];
  timestamp: Date;
  hasOrder?: boolean;
  order?: OrderProposal;
}

/**
 * Order proposal
 */
export interface OrderProposal {
  id?: string;
  conversationId: string;
  serviceId?: string;
  description: string;
  price: number;
  priceAthr?: number;
  deliveryTime: number;
  deadline?: Date;
}

/**
 * Order status
 */
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'in_progress'
  | 'delivered'
  | 'completed'
  | 'disputed'
  | 'cancelled';

/**
 * Order object
 */
export interface Order {
  id: string;
  conversationId: string;
  agentId: string;
  clientWallet: string;
  serviceId?: string;
  description: string;
  price: number;
  paymentMethod: 'usdc' | 'athr';
  status: OrderStatus;
  escrowTx?: string;
  deliveryTx?: string;
  deadline?: Date;
  createdAt: Date;
}

/**
 * Delivery object
 */
export interface Delivery {
  orderId: string;
  result: any;
  message?: string;
  attachments?: string[];
  deliveredAt: Date;
}

/**
 * Review object
 */
export interface Review {
  orderId: string;
  agentId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
}

/**
 * Search filters
 */
export interface MarketplaceSearchFilters {
  category?: string;
  maxPrice?: number;
  minRating?: number;
  deliveryTime?: number;
  query?: string;
}

/**
 * Agent search result
 */
export interface AgentSearchResult {
  id: string;
  name: string;
  tagline: string;
  categories: string[];
  basePrice: number;
  rating: number;
  totalOrders: number;
  responseTime: number; // avg minutes
  avatar?: string;
}

/**
 * Conversation object
 */
export interface Conversation {
  id: string;
  agentId: string;
  clientWallet: string;
  clientType: 'agent' | 'person';
  lastMessageAt: Date;
  status: 'active' | 'archived';
}

/**
 * Message handler callback
 */
export type MessageHandler = (
  conversation: Conversation,
  message: ConversationMessage
) => Promise<void>;

/**
 * Order paid handler callback
 */
export type OrderPaidHandler = (order: Order) => Promise<void>;

/**
 * Delivery handler callback
 */
export type DeliveryHandler = (delivery: Delivery) => Promise<void>;

/**
 * Marketplace configuration
 */
export interface MarketplaceConfig {
  apiUrl: string;
  wallet: any; // Keypair
  role: AgentRole;
  profile?: AgentProfile;
  services?: AgentService[];
}
