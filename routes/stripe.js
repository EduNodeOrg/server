const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const auth = require('../middleware/auth');
const User = require('../models/User');

let _stripe = null;
function getStripe() {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  _stripe = Stripe(key);
  return _stripe;
}

// Helper: find/get the user from the JWT payload
async function getUser(req) {
  const userId = req.user && (req.user.id || req.user._id);
  if (!userId) {
    console.warn('[stripe] getUser: missing user id in JWT payload', req.user);
    throw new Error('Invalid token: missing user ID. Please log out and log back in.');
  }
  const user = await User.findById(userId);
  if (!user) {
    console.warn('[stripe] getUser: user not found in DB for id', userId);
    throw new Error('User not found in database. Please log out and log back in.');
  }
  return user;
}

// @desc    Create Stripe Checkout Session for Pro tier
// @route   POST /api/stripe/create-checkout-session
// @access  Private
router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    const user = await getUser(req);

    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!priceId) {
      return res.status(500).json({ error: 'STRIPE_PRO_PRICE_ID not configured' });
    }

    const { successUrl, cancelUrl } = req.body || {};
    const defaultBase = `${req.protocol}://${req.get('host')}`;

    // Ensure we have a Stripe customer for this user
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: user.email || undefined,
        metadata: { userId: user._id.toString() },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${defaultBase}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${defaultBase}/membership/cancel`,
      metadata: { userId: user._id.toString() },
      subscription_data: {
        metadata: { userId: user._id.toString() },
      },
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// @desc    Create Stripe Billing Portal session
// @route   POST /api/stripe/create-portal-session
// @access  Private
router.post('/create-portal-session', auth, async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer for this user' });
    }

    const { returnUrl } = req.body || {};
    const defaultBase = `${req.protocol}://${req.get('host')}`;

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl || `${defaultBase}/membership`,
    });

    res.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating Stripe portal session:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// @desc    Get current subscription status
// @route   GET /api/stripe/subscription-status
// @access  Private
router.get('/subscription-status', auth, async (req, res) => {
  try {
    const user = await getUser(req);

    // If we have a stored subscriptionId, refresh from Stripe for accuracy
    if (user.subscriptionId) {
      try {
        const sub = await getStripe().subscriptions.retrieve(user.subscriptionId);
        user.subscriptionStatus = sub.status;
        user.currentPeriodEnd = new Date(sub.current_period_end * 1000);
        user.subscriptionPlan = sub.status === 'active' || sub.status === 'trialing' ? 'pro' : 'free';
        await user.save();
      } catch (e) {
        console.warn('Could not refresh subscription from Stripe:', e.message);
      }
    }

    res.json({
      status: user.subscriptionStatus || 'none',
      plan: user.subscriptionPlan || 'free',
      currentPeriodEnd: user.currentPeriodEnd || null,
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

// ---------------------------------------------------------------------------
// Webhook handler (mounted in server.js with express.raw BEFORE bodyParser.json)
// ---------------------------------------------------------------------------
async function webhookHandler(req, res) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata && session.metadata.userId;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (userId) {
          const update = {
            stripeCustomerId: customerId,
            subscriptionId: subscriptionId,
            subscriptionStatus: 'active',
            subscriptionPlan: 'pro',
          };
          if (subscriptionId) {
            const sub = await getStripe().subscriptions.retrieve(subscriptionId);
            update.currentPeriodEnd = new Date(sub.current_period_end * 1000);
            update.subscriptionStatus = sub.status;
          }
          await User.findByIdAndUpdate(userId, update);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        if (subscriptionId) {
          const sub = await getStripe().subscriptions.retrieve(subscriptionId);
          const userId = sub.metadata && sub.metadata.userId;
          if (userId) {
            await User.findByIdAndUpdate(userId, {
              subscriptionStatus: sub.status,
              subscriptionPlan: 'pro',
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        if (subscriptionId) {
          const sub = await getStripe().subscriptions.retrieve(subscriptionId);
          const userId = sub.metadata && sub.metadata.userId;
          if (userId) {
            await User.findByIdAndUpdate(userId, {
              subscriptionStatus: 'past_due',
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const userId = sub.metadata && sub.metadata.userId;
        if (userId) {
          await User.findByIdAndUpdate(userId, {
            subscriptionStatus: sub.status,
            subscriptionPlan: sub.status === 'active' || sub.status === 'trialing' ? 'pro' : 'free',
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const userId = sub.metadata && sub.metadata.userId;
        if (userId) {
          await User.findByIdAndUpdate(userId, {
            subscriptionStatus: 'canceled',
            subscriptionPlan: 'free',
          });
        }
        break;
      }

      default:
        // Unhandled event types are acknowledged silently
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Error handling Stripe webhook:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

module.exports = router;
module.exports.webhookHandler = webhookHandler;
