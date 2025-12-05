import Stripe from "stripe";
import { envVars } from "./env";

// Initialize Stripe with your secret key
export const stripe = new Stripe(envVars.STRIPE.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-11-17.clover",
});
