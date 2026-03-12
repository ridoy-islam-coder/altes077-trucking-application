// stripe.utils.ts
import Stripe from "stripe";
import AppError from "../error/AppError";
import httpStatus from "http-status";
import config from "../config";

const stripe = new Stripe(config.stripe.stripe_secret_key as string, {
  apiVersion: "2024-06-20" as any,
});

// Create a new Stripe Customer
const CreateCustomerId = async (email: string): Promise<string> => {
  const customer = await stripe.customers.create({ email });
  if (!customer || !customer.id) {
    throw new AppError(httpStatus.BAD_REQUEST, "Something went wrong, try again later");
  }
  return customer.id;
};

// Check if customer exists, if not create new
const checkCustomerId = async (customerId: string | undefined, email: string): Promise<string> => {
  if (customerId) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (!('deleted' in customer) || !customer.deleted) {
        console.log("✅ Existing customer found:", customer.id);
        return customer.id;
      }
      console.log("❌ Customer ID deleted. Creating new customer...");
    } catch (error: any) {
      if (error.code === 'resource_missing' || error.message.includes('No such customer')) {
        console.log("❌ Customer ID not found. Creating new customer...");
      } else {
        throw error;
      }
    }
  }

  if (!email) {
    throw new AppError(httpStatus.BAD_REQUEST, "Email is required to create a new Stripe customer");
  }
  const newCustomer = await CreateCustomerId(email);
  console.log("✅ New customer created:", newCustomer);
  return newCustomer;
};

// Create ephemeral key (for mobile SDK)
const createEphemeralKey = async (customerId: string) => {
  const key = await stripe.ephemeralKeys.create(
    { customer: customerId },
    { apiVersion: "2024-06-20" }
  );
  return key.secret;
};

// Create Stripe Custom Account (for drivers or businesses)
const CreateStripeAccount = async (
  email: string,
  country: string,
  ip: string,
  brandName: string,
  businessUrl?: string
): Promise<string> => {
  if (!brandName) throw new AppError(httpStatus.BAD_REQUEST, "Brand Name is required");

  const account = await stripe.accounts.create({
    type: "custom",
    country,
    email,
    business_type: "individual",
    individual: {
      first_name: brandName.trim(),
      last_name: brandName.trim(),
    },
    business_profile: {
      url: businessUrl || "https://arkive.com/brands",
      mcc: "5651",
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    tos_acceptance: {
      date: Math.floor(Date.now() / 1000),
      ip,
    },
    metadata: {
      created_from: "https://arkive.com",
    },
  });

  return account.id;
};

// Check if Stripe account is ready for payouts
const IsAccountReady = async (accountId: string) => {
  const account = await stripe.accounts.retrieve(accountId);
  const ready =
    account.charges_enabled &&
    account.payouts_enabled &&
    account.capabilities?.transfers === "active" &&
    (!account.requirements?.currently_due || account.requirements.currently_due.length === 0);

  return {
    ready,
    status: {
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      transfers: account.capabilities?.transfers,
      requirements_due: account.requirements?.currently_due || [],
    },
  };
};

// Create Payout to a connected Stripe account
const CreatePayout = async (amount: number, accountId: string, currency = "usd") => {
  const payout = await stripe.payouts.create(
    { amount: Math.round(amount * 100), currency: currency.toLowerCase() },
    { stripeAccount: accountId }
  );

  if (!payout) throw new AppError(httpStatus.EXPECTATION_FAILED, "Failed withdraw");

  return payout;
};

// Create External Bank Account for a Stripe Account
interface IBankAccount {
  country: string;
  currency: string;
  account_holder_name: string;
  account_holder_type: "individual" | "company";
  routing_number: string;
  account_number: string;
}
const CreateBankToken = async (data: IBankAccount) => {
  const token = await stripe.tokens.create({
    bank_account: {
      country: data.country,
      currency: data.currency,
      account_holder_name: data.account_holder_name,
      account_holder_type: data.account_holder_type,
      routing_number: data.routing_number,
      account_number: data.account_number,
    },
  });
  return token.id;
};

// Export all utils
const StripeUtils = {
  CreateCustomerId,
  checkCustomerId,
  createEphemeralKey,
  CreateStripeAccount,
  IsAccountReady,
  CreatePayout,
  CreateBankToken,
};

export default StripeUtils;