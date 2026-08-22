import Stripe from "stripe";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";

const createCheckoutSession = async (userId: string) => {
  const transactionResult = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
      include: {
        subscription: true,
      },
    });

    // old subscriber
    let stripeCustomerId = user.subscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      // new subscriber
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });

      stripeCustomerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: config.stripe_product_price_id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      success_url: `${config.app_url}/premium?success=true`,
      cancel_url: `${config.app_url}/payment?success=false`,
      metadata: { userId: user.id },
    });

    return session.url;
  });

  return {
    paymentUrl: transactionResult,
  };
};

const handleWebhook = async (payload: Buffer, signature: string) => {
  const endpointSecret = config.stripe_webhook_secret;
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    endpointSecret,
  );

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      //Occurs when a Checkout Session has been successfully completed.
      // event.data.object
      await handleCheckoutCompleted(event.data.object);

      break;
    case "customer.subscription.updated":
      //Occurs whenever a subscription changes (e.g., switching from one plan to another, or changing the status from trial to active).

      break;
    case "customer.subscription.deleted":
      //Occurs whenever a customer’s subscription ends

      break;
    default:
      // Unexpected event type
      console.log(`No event matched Unhandled event type ${event.type}.`);
      break;
  }
};

const getPeriodEnd = (payload: Stripe.Subscription) => {
  const currentPeriodEndInMilliSeconds =
    payload.items.data[0]?.current_period_end!;

  const currentPeriodEnd = new Date(currentPeriodEndInMilliSeconds * 1000);
  return currentPeriodEnd;
};

const handleCheckoutCompleted = async (session: Stripe.Checkout.Session) => {
  // console.log(event.data.object);

  const userId = session.metadata?.userId;
  const stripeCustomerId = session.customer as string;
  const stripeSubscriptionId = session.subscription as string;

  if (!userId || !stripeSubscriptionId || !stripeCustomerId) {
    throw new Error("Webhook failed");
  }

  const stripeSubscription =
    await stripe.subscriptions.retrieve(stripeSubscriptionId);
  // console.log("sub-info", stripeSubscription.items.data[0]);

  // const currentPeriodEndInMilliSeconds =
  //   stripeSubscription.items.data[0]?.current_period_end!;

  // const currentPeriodEnd = new Date(currentPeriodEndInMilliSeconds * 1000);
  // console.log(currentPeriodEnd);

  const currentPeriodEnd = getPeriodEnd(stripeSubscription);

  await prisma.subscription.upsert({
    where: {
      userId,
    },
    create: {
      userId,
      stripeCustomerId,
      stripeSubscriptionId,
      status: "ACTIVE",
      currentPeriodEnd,
    },
    update: {
      stripeCustomerId,
      stripeSubscriptionId,
      status: "ACTIVE",
      currentPeriodEnd,
    },
  });
};

export const subscriptionServices = {
  createCheckoutSession,
  handleWebhook,
};
