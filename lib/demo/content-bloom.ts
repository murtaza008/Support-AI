import type { DemoAssistantSeed } from "./content";
import { DEMO_BLOOM_ASSISTANT_ID } from "./constants";

/** Fictional ecommerce skincare store. All names, emails and URLs are made up (.example is a reserved TLD). */
export const BLOOM: DemoAssistantSeed = {
  id: DEMO_BLOOM_ASSISTANT_ID,
  name: "Bloom & Co Support",
  description:
    "Helps Bloom & Co shoppers with orders, shipping, returns, payments, rewards and finding the right skincare routine.",
  tone: "friendly",
  brandColor: "#C2577A",
  systemPrompt:
    "You are the friendly support assistant for Bloom & Co, an online clean-skincare store. Keep a warm, " +
    "upbeat tone, keep answers short, and never give medical advice: for skin reactions, tell the customer " +
    "to stop using the product and contact hello@bloomandco.example.",
  createdDaysAgo: 41,
  preview: {
    brand: "Bloom & Co",
    headline: "Clean skincare, kind to your skin.",
    blurb:
      "Vegan, cruelty-free formulas made in small batches. Free US shipping over $50 and a 30-day Glow Guarantee on everything.",
    suggestions: [
      "When will my order arrive?",
      "Can I return a moisturizer I already opened?",
      "How do I skip my next Bloom Box?",
    ],
  },
  docs: [
    {
      key: "start",
      name: "Getting Started: Finding Your Routine",
      content: `# Getting Started: Finding Your Routine

Welcome to Bloom & Co! Here's how to find products that suit your skin.

## Take the Routine Quiz
The 2-minute **Routine Quiz** at bloomandco.example/quiz asks about your skin type, concerns and sensitivities, then recommends a morning and evening routine. Your results are saved to your account so you can come back to them.

## Skin types we design for
- **Dry:** look for our Hydrate line (hyaluronic acid, squalane).
- **Oily or combination:** our Balance line (niacinamide, green tea).
- **Sensitive:** our Calm line is **fragrance-free** and dermatologist tested.
- **Mature:** our Renew line (gentle retinal, peptides).

## Our ingredient promise
Every Bloom & Co product is **vegan, cruelty-free** and made without parabens, sulfates or mineral oil. Full ingredient lists (INCI) are on every product page.

## Patch test first
We recommend a patch test for any new product: apply a small amount behind your ear or on your inner arm once a day for 3 days. If you notice redness, itching or burning, stop using it.

## Shelf life
Unopened products last 24 months. Once opened, use within the time shown by the open-jar symbol on the label, usually **12 months** (6 months for vitamin C serums).
`,
    },
    {
      key: "shipping",
      name: "Shipping and Delivery",
      content: `# Shipping and Delivery

## US shipping
| Method | Delivery time | Cost |
|---|---|---|
| Standard | 3 to 5 business days | $5.95, **free on orders over $50** |
| Express | 1 to 2 business days | $12.95 |

Orders placed before **2pm ET, Monday to Friday**, ship the same day. Orders placed after 2pm or on weekends ship the next business day. PO boxes are supported with Standard shipping only.

## International shipping
We ship to **Canada, the UK and Australia**. Delivery takes **7 to 12 business days** and costs a flat $14.95.
- **UK and Australia:** duties and taxes are collected at checkout, so there's nothing to pay on delivery.
- **Canada:** duties and taxes may be charged by the carrier on delivery.

## Tracking your order
You'll get a shipping confirmation email with a tracking link within **24 hours** of your order shipping. Tracking can take 24 to 48 hours to show the first scan. You can also see tracking under **Account > Orders**.

## Lost or late packages
If your package hasn't arrived **10 business days after the estimated delivery date**, contact hello@bloomandco.example with your order number. We'll send a free replacement or a full refund, your choice.

## Damaged items
If something arrives damaged or leaking, email a photo within **7 days** of delivery and we'll send a free replacement. No need to return the damaged item.
`,
    },
    {
      key: "returns",
      name: "Returns and Refunds",
      content: `# Returns and Refunds

## The Glow Guarantee
Not in love with a product? You can return it within **30 days of delivery**, even if it's opened. Opened returns are allowed **once per product per customer**. If a product caused a reaction, stop using it and tell us; reactions are always covered.

## What can't be returned
- Items marked **Final Sale** (discounted more than 40%).
- Gift cards.
- Products returned more than 30 days after delivery.

## How to start a return
1. Go to bloomandco.example/returns and enter your order number and email.
2. Choose the items and the reason.
3. Print the label. **US returns ship free.** International customers pay their own return shipping.

## Refund timing
Refunds are issued to the original payment method within **5 business days** of the return reaching our warehouse. Your bank may take another 3 to 7 business days to show it. Prefer store credit? Choose it in the returns portal and get **an extra 10%** on top of your refund.

## Exchanges
We don't do direct exchanges. Return the item for a refund or store credit and place a new order; store credit is applied instantly when the return is scanned.
`,
    },
    {
      key: "billing",
      name: "Payments, Promo Codes and Bloom Box",
      content: `# Payments, Promo Codes and Bloom Box

## Payment methods
We accept Visa, Mastercard, American Express, Discover, PayPal, Apple Pay and Google Pay. On orders over $50 you can split the cost into **4 interest-free payments** with Shop Pay Installments.

## Promo codes
- Only **one promo code per order**.
- Codes don't apply to gift cards, gift sets or Bloom Box subscriptions unless stated.
- Forgot to add a code? Contact us within **1 hour** of placing the order and we can apply it. After that the order is already being packed.

## Price adjustments
If a product you bought goes on sale within **7 days** of your order, we'll refund the difference. Just email your order number.

## Gift cards
Digital gift cards are delivered by email and **never expire**. They can be combined with a promo code.

## Bloom Box subscription
Bloom Box delivers your favourite products every **4, 8 or 12 weeks** at **15% off**, with free shipping.
- Manage everything under **Account > Subscriptions**.
- You can **skip, pause, swap products or cancel** at any time, up to **3 days before** your next processing date.
- Changes made less than 3 days before the processing date apply to the following box.
`,
    },
    {
      key: "account",
      name: "Account and Bloom Rewards",
      content: `# Account and Bloom Rewards

## Creating an account
You can check out as a guest, but an account lets you track orders, save your Routine Quiz results, manage Bloom Box and earn rewards.

## Resetting your password
Click **Forgot password?** on the sign-in page. The reset email arrives within a few minutes; check spam if you don't see it. The link is valid for 24 hours.

## Changing an order
You can change the shipping address or items on an order within **1 hour** of placing it from **Account > Orders > Edit order**. After that the order is being packed and can't be changed, but you can return items once they arrive.

## Bloom Rewards
- Earn **1 point per $1** spent (shipping and taxes excluded).
- **100 points = $5 off.** Redeem at checkout in steps of 100 points.
- Get **double points** during your birthday month (add your birthday under Account > Profile).
- Points expire after **12 months without a purchase**.
- Returned items have their points removed.

## Deleting your account
Email privacy@bloomandco.example from the address on your account. We'll confirm and delete your data within 30 days. Active Bloom Box subscriptions are cancelled first.
`,
    },
    {
      key: "troubleshooting",
      name: "Troubleshooting Orders",
      content: `# Troubleshooting Orders

## My promo code isn't working
Check that:
- The code hasn't expired and is typed exactly (codes are not case-sensitive, but spaces count).
- Your cart meets the minimum spend, if the code has one.
- You're not combining it with another code: only one code per order.
- Your cart doesn't only contain gift sets, gift cards or a Bloom Box, which are usually excluded.

## My payment was declined
The most common cause is a billing address that doesn't match the one your bank has on file. Double-check the address and ZIP code, or try PayPal, Apple Pay or another card. We never see or store your full card number.

## I didn't get an order confirmation
Confirmation emails arrive within 15 minutes. Check spam and promotions, and look under **Account > Orders**. If you checked out as a guest and still see nothing after an hour, email hello@bloomandco.example with the name and email you used.

## My tracking hasn't updated
It's normal for tracking to take **24 to 48 hours** to show the first scan. If there's been no update for 5 business days, contact us and we'll open a trace with the carrier.

## I had a skin reaction
Stop using the product straight away and rinse with cool water. If the reaction is severe, seek medical advice. Then email hello@bloomandco.example with your order number; reactions are covered by the Glow Guarantee and you'll get a full refund.
`,
    },
  ],
  conversations: [
    {
      channel: "WIDGET",
      daysAgo: 0,
      hoursAgo: 2,
      resolved: true,
      rating: 5,
      turns: [
        {
          q: "Hi! I ordered yesterday at 4pm, when will it ship?",
          a: "Hi there! Orders placed after 2pm ET ship the next business day, so yours should head out today [1]. With Standard shipping it then takes 3 to 5 business days, or 1 to 2 with Express [1]. You'll get a tracking email within 24 hours of it shipping.",
          cites: ["shipping"],
        },
      ],
    },
    {
      channel: "WIDGET",
      daysAgo: 1,
      hoursAgo: 4,
      resolved: true,
      rating: 5,
      turns: [
        {
          q: "I opened the Renew night cream and I don't really like it. Can I still return it?",
          a: "Yes, you can! Our Glow Guarantee lets you return products within 30 days of delivery, even opened ones (once per product) [1].\n\nJust head to bloomandco.example/returns, enter your order number and email, pick the item, and print the free US return label [1]. Your refund lands within 5 business days of the return reaching us.",
          cites: ["returns"],
        },
        {
          q: "Can I get store credit instead?",
          a: "Absolutely, and it's a little sweeter: choose store credit in the returns portal and you'll get an extra 10% on top of your refund [1].",
          cites: ["returns"],
        },
      ],
    },
    {
      channel: "WIDGET",
      daysAgo: 2,
      hoursAgo: 6,
      resolved: true,
      turns: [
        {
          q: "Do you ship to Canada? What about customs?",
          a: "We do! Shipping to Canada takes 7 to 12 business days for a flat $14.95 [1]. Just a heads up: for Canadian orders, duties and taxes may be charged by the carrier on delivery [1].",
          cites: ["shipping"],
        },
      ],
    },
    {
      channel: "PLAYGROUND",
      daysAgo: 4,
      hoursAgo: 3,
      resolved: true,
      turns: [
        {
          q: "What's good for sensitive skin?",
          a: "Our Calm line is made for sensitive skin: it's fragrance-free and dermatologist tested [1]. Like everything we make, it's vegan and cruelty-free.\n\nTwo tips: take the 2-minute Routine Quiz at bloomandco.example/quiz for a personalised routine, and patch test any new product behind your ear or on your inner arm for 3 days first [1].",
          cites: ["start"],
        },
      ],
    },
    {
      channel: "WIDGET",
      daysAgo: 4,
      hoursAgo: 9,
      resolved: true,
      rating: 4,
      turns: [
        {
          q: "my promo code GLOW20 isnt working",
          a: "Sorry about that! A few things to check [1]:\n- The code hasn't expired and has no extra spaces.\n- Your cart meets any minimum spend.\n- It isn't being combined with another code (one per order).\n- Your cart isn't only gift sets, gift cards or a Bloom Box, which are usually excluded.\n\nIf you already placed the order without it, contact us within 1 hour and we can still apply it [2].",
          cites: ["troubleshooting", "billing"],
        },
      ],
    },
    {
      channel: "WIDGET",
      daysAgo: 7,
      hoursAgo: 5,
      resolved: true,
      rating: 5,
      turns: [
        {
          q: "How do I skip my next Bloom Box?",
          a: "Easy! Go to Account > Subscriptions and choose skip [1]. You can skip, pause, swap products or cancel any time up to 3 days before your next processing date. Changes made inside that 3-day window apply to the following box instead [1].",
          cites: ["billing"],
        },
      ],
    },
    {
      channel: "WIDGET",
      daysAgo: 8,
      hoursAgo: 7,
      resolved: true,
      turns: [
        {
          q: "My package says delivered but it's not here",
          a: "I'm sorry, that's frustrating! First, check with neighbours or your building's mail room, as carriers sometimes mark packages delivered a little early. If it still hasn't turned up, email hello@bloomandco.example with your order number [1]. For packages that don't arrive we'll send a free replacement or a full refund, your choice [1].",
          cites: ["shipping"],
        },
      ],
    },
    {
      channel: "WIDGET",
      daysAgo: 10,
      hoursAgo: 4,
      resolved: true,
      rating: 5,
      turns: [
        {
          q: "How do rewards points work?",
          a: "You earn 1 point for every $1 you spend, and every 100 points is worth $5 off at checkout [1]. You also get double points in your birthday month if you add your birthday under Account > Profile. Points expire after 12 months without a purchase [1].",
          cites: ["account"],
        },
      ],
    },
    {
      channel: "PLAYGROUND",
      daysAgo: 12,
      hoursAgo: 6,
      resolved: true,
      turns: [
        {
          q: "I put the wrong address on my order 20 minutes ago!",
          a: "No worries, you're still in time! You can change the address within 1 hour of placing the order from Account > Orders > Edit order [1]. After that the order is being packed and can't be changed.",
          cites: ["account"],
        },
      ],
    },
    {
      channel: "WIDGET",
      daysAgo: 14,
      hoursAgo: 8,
      resolved: true,
      rating: 5,
      turns: [
        {
          q: "The serum broke a bit and leaked in the box",
          a: "Oh no, I'm sorry it arrived like that! Please email a photo to hello@bloomandco.example within 7 days of delivery and we'll send you a free replacement [1]. You don't need to send the damaged item back.",
          cites: ["shipping"],
        },
      ],
    },
    {
      channel: "WIDGET",
      daysAgo: 16,
      hoursAgo: 5,
      resolved: false,
      turns: [
        {
          q: "Are your products safe to use while pregnant?",
          a: "That's a really important question, and it's not something our help docs cover, so I don't want to guess. Every product page lists the full ingredients, which you can share with your doctor or midwife. For anything specific, please email hello@bloomandco.example and our team will help.",
          cites: [],
        },
      ],
    },
    {
      channel: "WIDGET",
      daysAgo: 19,
      hoursAgo: 3,
      resolved: true,
      rating: 4,
      turns: [
        {
          q: "Can I pay in installments?",
          a: "Yes! On orders over $50 you can split the total into 4 interest-free payments with Shop Pay Installments at checkout [1].",
          cites: ["billing"],
        },
        {
          q: "and my card keeps getting declined",
          a: "The most common cause is a billing address that doesn't match what your bank has on file, so double-check the address and ZIP code [1]. You can also try PayPal, Apple Pay or a different card.",
          cites: ["troubleshooting"],
        },
      ],
    },
    {
      channel: "WIDGET",
      daysAgo: 21,
      hoursAgo: 7,
      resolved: true,
      turns: [
        {
          q: "The cleanser I bought last week is now on sale, can I get the difference back?",
          a: "Yes! If something you bought goes on sale within 7 days of your order, we'll refund the difference [1]. Just email your order number to hello@bloomandco.example.",
          cites: ["billing"],
        },
      ],
    },
    {
      channel: "WIDGET",
      daysAgo: 25,
      hoursAgo: 4,
      resolved: true,
      turns: [
        {
          q: "the vitamin c serum made my cheeks red and itchy",
          a: "I'm so sorry! Please stop using it right away and rinse with cool water. If the reaction is severe, please seek medical advice [1].\n\nThen email hello@bloomandco.example with your order number. Reactions are always covered by our Glow Guarantee, so you'll get a full refund [1][2].",
          cites: ["troubleshooting", "returns"],
        },
      ],
    },
    {
      channel: "PLAYGROUND",
      daysAgo: 28,
      hoursAgo: 6,
      resolved: true,
      turns: [
        {
          q: "How long does a moisturizer last once opened?",
          a: "Once opened, most of our products are best used within 12 months, as shown by the open-jar symbol on the label. Vitamin C serums are the exception at 6 months. Unopened products last 24 months [1].",
          cites: ["start"],
        },
      ],
    },
  ],
};
