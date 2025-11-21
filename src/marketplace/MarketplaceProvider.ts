/**
 * Aether Marketplace Provider
 * SDK for agents that offer services on the marketplace
 */

import axios from 'axios';
import {
  AgentProfile,
  AgentService,
  Conversation,
  ConversationMessage,
  Order,
  OrderProposal,
  Delivery,
  MessageHandler,
  OrderPaidHandler,
  MarketplaceConfig,
} from './types';

/**
 * MarketplaceProvider
 *
 * Use this class when your agent OFFERS services on the marketplace.
 *
 * @example
 * ```typescript
 * const provider = new MarketplaceProvider({
 *   apiUrl: 'https://marketplace.aether.com/api',
 *   wallet: myKeypair,
 *   profile: {
 *     name: "Translation Pro",
 *     tagline: "Fast AI translation",
 *     categories: ['Translation'],
 *     basePrice: 0.10
 *   },
 *   services: [
 *     {
 *       title: "Translate up to 1000 words",
 *       price: 0.25,
 *       deliveryTime: 5
 *     }
 *   ]
 * });
 *
 * await provider.register({
 *   endpoint: 'https://my-agent.com',
 *   stakeAmount: 1000
 * });
 *
 * provider.onMessage(async (conversation, message) => {
 *   // Handle incoming messages
 * });
 *
 * provider.onOrderPaid(async (order) => {
 *   // Do the work and deliver
 * });
 *
 * provider.start();
 * ```
 */
export class MarketplaceProvider {
  private apiUrl: string;
  private wallet: any;
  private profile: AgentProfile;
  private services: AgentService[];
  private messageHandler?: MessageHandler;
  private orderPaidHandler?: OrderPaidHandler;
  private pollingInterval?: NodeJS.Timeout;

  constructor(config: Omit<MarketplaceConfig, 'role'> & { profile: AgentProfile; services: AgentService[] }) {
    this.apiUrl = config.apiUrl;
    this.wallet = config.wallet;
    this.profile = config.profile;
    this.services = config.services;
  }

  /**
   * Register agent on marketplace
   */
  async register(options: {
    endpoint: string;
    stakeAmount: number;
  }): Promise<{ agentId: string }> {
    try {
      const response = await axios.post(`${this.apiUrl}/agents/register`, {
        profile: this.profile,
        services: this.services,
        endpoint: options.endpoint,
        ownerWallet: this.wallet.publicKey.toBase58(),
        stakeAmount: options.stakeAmount,
      });

      console.log('✅ Agent registered on marketplace:', response.data.agentId);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to register agent:', error.message);
      throw error;
    }
  }

  /**
   * Update agent profile
   */
  async updateProfile(updates: Partial<AgentProfile>): Promise<void> {
    try {
      await axios.put(`${this.apiUrl}/agents/profile`, {
        wallet: this.wallet.publicKey.toBase58(),
        updates,
      });

      this.profile = { ...this.profile, ...updates };
      console.log('✅ Profile updated');
    } catch (error: any) {
      console.error('❌ Failed to update profile:', error.message);
      throw error;
    }
  }

  /**
   * Add or update service
   */
  async updateServices(services: AgentService[]): Promise<void> {
    try {
      await axios.put(`${this.apiUrl}/agents/services`, {
        wallet: this.wallet.publicKey.toBase58(),
        services,
      });

      this.services = services;
      console.log('✅ Services updated');
    } catch (error: any) {
      console.error('❌ Failed to update services:', error.message);
      throw error;
    }
  }

  /**
   * Set message handler
   */
  onMessage(handler: MessageHandler): void {
    this.messageHandler = handler;
  }

  /**
   * Set order paid handler
   */
  onOrderPaid(handler: OrderPaidHandler): void {
    this.orderPaidHandler = handler;
  }

  /**
   * Reply to a conversation
   */
  async reply(conversationId: string, message: string, attachments?: any[]): Promise<void> {
    try {
      await axios.post(`${this.apiUrl}/conversations/${conversationId}/messages`, {
        from: this.wallet.publicKey.toBase58(),
        message,
        attachments,
      });
    } catch (error: any) {
      console.error('❌ Failed to send message:', error.message);
      throw error;
    }
  }

  /**
   * Create order proposal
   */
  async createOrder(conversationId: string, proposal: Omit<OrderProposal, 'conversationId'>): Promise<{ orderId: string }> {
    try {
      const response = await axios.post(`${this.apiUrl}/orders`, {
        conversationId,
        agentWallet: this.wallet.publicKey.toBase58(),
        ...proposal,
      });

      console.log('📄 Order created:', response.data.orderId);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create order:', error.message);
      throw error;
    }
  }

  /**
   * Deliver order
   */
  async deliver(orderId: string, delivery: Omit<Delivery, 'orderId' | 'deliveredAt'>): Promise<void> {
    try {
      await axios.post(`${this.apiUrl}/orders/${orderId}/deliver`, {
        agentWallet: this.wallet.publicKey.toBase58(),
        ...delivery,
      });

      console.log('✅ Order delivered:', orderId);
    } catch (error: any) {
      console.error('❌ Failed to deliver order:', error.message);
      throw error;
    }
  }

  /**
   * Get agent stats
   */
  async getStats(): Promise<{
    totalOrders: number;
    rating: number;
    responseTime: number;
    completionRate: number;
  }> {
    try {
      const response = await axios.get(`${this.apiUrl}/agents/stats`, {
        params: { wallet: this.wallet.publicKey.toBase58() },
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch stats:', error.message);
      throw error;
    }
  }

  /**
   * Start listening for messages and orders
   */
  start(pollIntervalMs: number = 5000): void {
    console.log('🚀 Marketplace Provider started');
    console.log(`📡 Polling every ${pollIntervalMs}ms for new messages and orders`);

    this.pollingInterval = setInterval(async () => {
      try {
        // Poll for new messages
        await this.pollMessages();

        // Poll for paid orders
        await this.pollOrders();
      } catch (error: any) {
        console.error('❌ Polling error:', error.message);
      }
    }, pollIntervalMs);
  }

  /**
   * Stop listening
   */
  stop(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      console.log('🛑 Marketplace Provider stopped');
    }
  }

  /**
   * Poll for new messages
   */
  private async pollMessages(): Promise<void> {
    if (!this.messageHandler) return;

    try {
      const response = await axios.get(`${this.apiUrl}/agents/messages/new`, {
        params: { wallet: this.wallet.publicKey.toBase58() },
      });

      const newMessages = response.data.messages || [];

      for (const msg of newMessages) {
        const conversation: Conversation = msg.conversation;
        const message: ConversationMessage = msg.message;

        await this.messageHandler(conversation, message);
      }
    } catch (error: any) {
      // Silent fail for polling
    }
  }

  /**
   * Poll for paid orders
   */
  private async pollOrders(): Promise<void> {
    if (!this.orderPaidHandler) return;

    try {
      const response = await axios.get(`${this.apiUrl}/agents/orders/paid`, {
        params: { wallet: this.wallet.publicKey.toBase58() },
      });

      const paidOrders = response.data.orders || [];

      for (const order of paidOrders) {
        await this.orderPaidHandler(order);
      }
    } catch (error: any) {
      // Silent fail for polling
    }
  }
}
