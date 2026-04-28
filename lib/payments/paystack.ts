import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY as string;

if (!PAYSTACK_SECRET_KEY) {
  throw new Error('PAYSTACK_SECRET_KEY environment variable is not defined');
}

export interface InitializeTransactionResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface VerifyTransactionResponse {
  status: string;
  message: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    status: string;
  };
}

export async function initializeTransaction(
  email: string,
  amountKobo: number,
  metadata: Record<string, unknown>,
  callbackUrl?: string
): Promise<InitializeTransactionResponse> {
  const body: Record<string, unknown> = {
    email,
    amount: amountKobo,
    metadata,
  };

  if (callbackUrl) {
    body.callback_url = callbackUrl;
  }

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Paystack initialization failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.data as InitializeTransactionResponse;
}

export async function verifyTransaction(
  reference: string
): Promise<VerifyTransactionResponse> {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Paystack verification failed with status ${response.status}`);
  }

  return await response.json();
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');

  return hash === signature;
}
