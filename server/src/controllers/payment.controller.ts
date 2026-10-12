import type { NextFunction, Request, Response } from "express";
import Stripe from "stripe";
import { getEnv } from "../config/env.js";
import { User } from "../models/user.model.js";
import { AppError } from "../utils/app-error.js";
import { sendSuccess } from "../utils/responses.js";

let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe {
  const { STRIPE_SECRET_KEY } = getEnv();
  if (!STRIPE_SECRET_KEY) {
    throw new AppError(503, "PAYMENTS_NOT_CONFIGURED", "Stripe Test Mode is not configured yet.");
  }
  stripeClient ??= new Stripe(STRIPE_SECRET_KEY);
  return stripeClient;
}

export async function createCheckoutSession(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const userId = request.auth!.userId;
    const user = await User.findById(userId);
    if (!user) throw new AppError(401, "INVALID_TOKEN", "The authenticated user no longer exists.");

    const { CLIENT_ORIGIN } = getEnv();
    const session = await getStripeClient().checkout.sessions.create({
      mode: "payment",
      client_reference_id: userId,
      customer_email: user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: 900,
            product_data: {
              name: "TaskMatrix Pro",
              description: "One-time Test Mode upgrade for the Sprint 15 checkout demonstration.",
            },
          },
        },
      ],
      metadata: { userId, product: "taskmatrix-pro" },
      success_url: `${CLIENT_ORIGIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_ORIGIN}/payment-cancelled`,
    });

    if (!session.url) throw new AppError(502, "CHECKOUT_URL_MISSING", "Stripe did not return a checkout URL.");
    sendSuccess(response, 201, { sessionId: session.id, url: session.url });
  } catch (error) {
    if (error instanceof AppError) next(error);
    else next(new AppError(502, "STRIPE_ERROR", "Stripe Checkout could not be started. Please try again."));
  }
}

export async function verifyCheckoutSession(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = request.params.sessionId;
    if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
      throw new AppError(400, "INVALID_CHECKOUT_ID", "The Stripe Checkout session ID is invalid.");
    }
    const session = await getStripeClient().checkout.sessions.retrieve(sessionId);
    if (session.client_reference_id !== request.auth!.userId) {
      throw new AppError(403, "CHECKOUT_FORBIDDEN", "This checkout session belongs to another user.");
    }

    sendSuccess(response, 200, {
      session: {
        id: session.id,
        status: session.status,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email ?? session.customer_email,
      },
    });
  } catch (error) {
    if (error instanceof AppError) next(error);
    else next(new AppError(502, "STRIPE_ERROR", "The Stripe Checkout result could not be verified."));
  }
}
