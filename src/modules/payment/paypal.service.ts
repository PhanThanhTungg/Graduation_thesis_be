import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import fetch, { RequestInit } from 'node-fetch';
import { EnvService } from 'src/shared/env/env.service';

interface CreatePaypalOrderParams {
  amount: number;
  currency: string;
  description: string;
  invoiceId: string;
  returnUrl: string;
  cancelUrl: string;
}

@Injectable()
export class PaypalService {
  private readonly logger = new Logger(PaypalService.name);

  constructor(private readonly envService: EnvService) {}

  private async request<T>(url: string, options: RequestInit): Promise<T> {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`PayPal API error ${response.status}: ${errorBody}`);
      throw new InternalServerErrorException(
        'Failed to communicate with PayPal',
      );
    }
    return (await response.json()) as T;
  }

  private async getAccessToken(): Promise<string> {
    const clientId = this.envService.get('PAYPAL_CLIENTID');
    const secret = this.envService.get('PAYPAL_SECRET');
    const baseUrl = this.envService.get('PAYPAL_BASEURL');
    const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');

    const body = new URLSearchParams({ grant_type: 'client_credentials' });

    const response = await this.request<{ access_token: string }>(
      `${baseUrl}/v1/oauth2/token`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      },
    );

    return response.access_token;
  }

  async createOrder(params: CreatePaypalOrderParams) {
    const baseUrl = this.envService.get('PAYPAL_BASEURL');
    const token = await this.getAccessToken();
    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: params.invoiceId,
          description: params.description,
          amount: {
            currency_code: params.currency,
            value: params.amount.toFixed(2),
          },
          invoice_id: params.invoiceId,
        },
      ],
      application_context: {
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    };

    return this.request<any>(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  async captureOrder(paypalOrderId: string) {
    const baseUrl = this.envService.get('PAYPAL_BASEURL');
    const token = await this.getAccessToken();

    return this.request<any>(
      `${baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );
  }

  async createPayout(email: string, amount: number, note?: string) {
    const baseUrl = this.envService.get('PAYPAL_BASEURL');
    const token = await this.getAccessToken();

    const payoutId = `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const payload = {
      sender_batch_header: {
        sender_batch_id: payoutId,
        email_subject: 'Withdrawal from Aikabis',
        email_message: note || 'Your withdrawal request has been processed',
      },
      items: [
        {
          recipient_type: 'EMAIL',
          amount: {
            value: amount.toFixed(2),
            currency: 'USD',
          },
          receiver: email,
          note: note || 'Withdrawal from Aikabis',
          sender_item_id: payoutId,
        },
      ],
    };

    return this.request<any>(`${baseUrl}/v1/payments/payouts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }
}
