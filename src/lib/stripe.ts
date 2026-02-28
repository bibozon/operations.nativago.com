import Stripe from "stripe";
import { getEnv } from "./env";

const STRIPE_SECRET_KEY = getEnv("STRIPE_SECRET_KEY", "");

export function getStripe(): Stripe | null {
  if (!STRIPE_SECRET_KEY) return null;
  return new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2022-11-15"
  });
}
