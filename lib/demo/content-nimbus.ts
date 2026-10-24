import type { DemoAssistantSeed } from "./content";
import { DEMO_NIMBUS_ASSISTANT_ID } from "./constants";

/** Fictional project-management SaaS. All names, emails and URLs are made up (.example is a reserved TLD). */
export const NIMBUS: DemoAssistantSeed = {
  id: DEMO_NIMBUS_ASSISTANT_ID,
  name: "Nimbus Help Bot",
  description:
    "Answers customer questions about Nimbus, a project management app for teams: setup, billing, refunds, accounts, integrations and troubleshooting.",
  tone: "professional",
  brandColor: "#3D6BFF",
  systemPrompt:
    "You are the support assistant for Nimbus, a project management app. Keep answers short and " +
    "step-by-step, name the exact menu path (for example Settings > Billing) when there is one, and " +
    "if the documents do not cover the question, say so and suggest emailing support@nimbus-pm.example.",
  createdDaysAgo: 46,
  preview: {
    brand: "Nimbus",
    headline: "Projects that actually ship.",
    blurb:
      "Boards, timelines and docs for teams that hate status meetings. Plan the sprint, track the work, and keep everyone in the loop.",
    suggestions: [
      "How much is the Team plan?",
      "Can I get a refund on my annual plan?",
      "How do I import my Trello boards?",
    ],
  },
  docs: [
    {
      key: "start",
      name: "Getting Started with Nimbus",
      content: `# Getting Started with Nimbus

Welcome to Nimbus! This guide gets your team from sign-up to your first shipped project.

## 1. Create your workspace
Sign up at nimbus-pm.example with your work email. You'll be asked to name your workspace (most teams use their company name). Every new workspace starts on a **14-day free trial of the Team plan**, no credit card required. When the trial ends you drop to the Free plan unless you add a payment method.

## 2. Invite your teammates
Go to **Settings > Members > Invite** and enter one or more email addresses. Invitations expire after 7 days. You can invite people as **Members** (full access to projects they join) or **Guests** (access to specific projects only). Guests are free: the Team plan includes up to 10 guests per project.

## 3. Create your first project
Click **New project** in the sidebar and pick a template (Sprint Planning, Product Launch, Content Calendar, Bug Tracker) or start blank. Each project can be viewed as a **Board**, **List**, **Timeline** or **Calendar**, and you can switch views at any time without losing data.

## 4. Add and assign tasks
Press **C** anywhere to create a task, or **/** to search. Tasks can have assignees, due dates, priorities, subtasks, checklists and file attachments. Use **@mentions** in comments to notify a teammate.

## 5. Stay in the loop
Your **Inbox** collects mentions, assignments and due-date reminders. Notification preferences live under **Profile > Notifications**, where you can choose instant emails, a daily digest, or in-app only.

## Plan limits at a glance
- **Free:** up to 3 projects and 5 members.
- **Team:** unlimited projects, timelines, guests, 100 MB file uploads.
- **Business:** everything in Team plus SSO, audit log and 250 MB uploads.
`,
    },
    {
      key: "billing",
      name: "Billing and Plans",
      content: `# Billing and Plans

## Pricing
| Plan | Monthly billing | Annual billing |
|---|---|---|
| Free | $0 | $0 |
| Team | $12 per user / month | $10 per user / month |
| Business | $24 per user / month | $20 per user / month |
| Enterprise | Custom | Custom |

Annual billing saves roughly 17% and is charged once per year up front.

## Payment methods
We accept Visa, Mastercard, American Express and PayPal. Business and Enterprise customers paying annually can request invoicing with bank transfer (net 30) by contacting billing@nimbus-pm.example.

## Where to find invoices
Workspace owners and billing admins can download every invoice as a PDF from **Settings > Billing > Invoices**. To add your company name, address or VAT ID to future invoices, edit **Settings > Billing > Billing details**. Past invoices can be reissued with new details on request.

## Adding and removing seats
Adding a member mid-cycle is **prorated**: you're charged only for the remaining days of the current billing period. Removing a member gives you a credit that is applied to your next renewal; it is not refunded to your card.

## Failed payments
If a payment fails, we retry the card on day 1, day 3 and day 7. You keep full access during this 7-day grace period. After the final retry fails, the workspace becomes **read-only** until a working payment method is added under **Settings > Billing > Payment method**. No data is ever deleted because of a failed payment.

## Changing plans
Upgrades take effect immediately and are prorated. Downgrades take effect at the end of the current billing period.
`,
    },
    {
      key: "refunds",
      name: "Refunds and Cancellations",
      content: `# Refunds and Cancellations

## How to cancel
Workspace owners can cancel at any time from **Settings > Billing > Cancel plan**. After cancelling you keep paid features until the end of the period you've already paid for, then the workspace moves to the Free plan. Your projects and tasks are never deleted when you cancel; anything over the Free plan limits becomes read-only.

## Refund policy
- **Monthly plans:** payments are non-refundable, except for your **first paid charge**, which can be refunded in full if you ask within **7 days**.
- **Annual plans:** you can get a **full refund within 30 days** of purchase or renewal. After 30 days, annual plans are not refundable, but you keep access until the end of the year you paid for.
- **Seat credits** from removed members are applied to your next invoice and are not paid out as refunds.

## Requesting a refund
Cancel the plan first, then email billing@nimbus-pm.example from the workspace owner's address with your workspace name and the invoice number. Approved refunds go back to the original payment method within **5 to 10 business days**, depending on your bank.

## Pausing instead of cancelling
Seasonal teams can pause a paid workspace once per year for up to 3 months. While paused you aren't billed and the workspace is read-only. Ask support to set up a pause.
`,
    },
    {
      key: "account",
      name: "Account and Security",
      content: `# Account and Security

## Resetting your password
Click **Forgot password?** on the sign-in page and enter your email. The reset link is valid for **60 minutes**. If your workspace uses single sign-on (SSO), you can't reset your password in Nimbus; sign in with the **Continue with SSO** button and contact your IT admin instead.

## Two-factor authentication (2FA)
Turn on 2FA under **Profile > Security > Two-factor authentication**. Nimbus supports authenticator apps (Google Authenticator, 1Password, Authy). Save your 10 backup codes somewhere safe. Owners on the Business plan can require 2FA for everyone in **Settings > Security**.

## Changing your email address
Go to **Profile > Account > Email**. We send a confirmation link to the new address, and the change only applies after you click it. Your old address receives a notice so you'll know if someone else tried to change it.

## Single sign-on (SSO)
SAML SSO with Okta, Azure AD, Google Workspace and OneLogin is available on the **Business** and **Enterprise** plans. Set it up in **Settings > Security > SSO**.

## Transferring ownership
Only the workspace owner can transfer ownership: **Settings > Members**, open the member's menu and choose **Make owner**. The previous owner becomes an admin.

## Deleting your account
To delete your personal account, go to **Profile > Account > Delete account**. If you own a workspace with other members, transfer ownership first. Deleted accounts and workspaces are permanently erased after a **30-day** recovery window.
`,
    },
    {
      key: "integrations",
      name: "Integrations and Data Export",
      content: `# Integrations and Data Export

## Built-in integrations
Connect apps from **Settings > Integrations**:
- **Slack:** get task notifications in channels and create tasks with the /nimbus command.
- **GitHub and GitLab:** link pull requests to tasks; merging a PR can move a task to Done automatically.
- **Google Calendar and Outlook:** show task due dates on your calendar (two-way sync on Business).
- **Zapier:** connect Nimbus to 5,000+ other apps without code.

## Importing from other tools
Use **Settings > Import** to bring in data from **Trello, Asana, Jira** or any **CSV** file. Imports keep task titles, descriptions, assignees (matched by email), due dates, labels and comments. Attachments over 100 MB are skipped. Large imports can take up to 30 minutes; you'll get an email when it's done.

## Exporting your data
Owners and admins can export everything from **Settings > Data > Export** as CSV (per project) or a full JSON archive including comments and attachments. Exports are available on every plan, including Free.

## API
The REST API is available on Team plans and above. Create a personal token under **Profile > API tokens**. The rate limit is **100 requests per minute** per token; requests over the limit get HTTP 429. Full reference: developers.nimbus-pm.example.
`,
    },
    {
      key: "troubleshooting",
      name: "Troubleshooting",
      content: `# Troubleshooting

## I'm not receiving notification emails
1. Check **Profile > Notifications**: you may be on "Daily digest" or "In-app only".
2. Look in your spam or promotions folder and add notifications@nimbus-pm.example to your contacts.
3. Ask your IT team to allowlist our sending domain if your company filters email.

## The Slack integration stopped posting
Slack disconnects the integration when the person who installed it leaves the workspace or changes their Slack password. Reconnect it from **Settings > Integrations > Slack > Reconnect**.

## Changes aren't syncing / the app looks out of date
- Check our status page at status.nimbus-pm.example for incidents.
- In the desktop app, use **Help > Clear cache and restart**.
- In the browser, do a hard refresh (Ctrl+Shift+R or Cmd+Shift+R).
Nimbus supports the latest two versions of Chrome, Edge, Firefox and Safari.

## File upload fails
Uploads are limited to **100 MB on Team** and **250 MB on Business**. On the Free plan the limit is 10 MB. If a smaller file still fails, try another browser or check whether a VPN or proxy is blocking uploads.

## I can't sign in
Use **Forgot password?** to reset your password. If your workspace uses SSO, use **Continue with SSO** instead; password sign-in is disabled for SSO users. After 10 failed attempts the account is locked for 15 minutes.

## Still stuck?
Email support@nimbus-pm.example with your workspace name and a screenshot. Team plans get a reply within one business day; Business plans within 4 hours.
`,
    },
  ],
  conversations: [
    {
      channel: "WIDGET",
      daysAgo: 0,
      hoursAgo: 3,
      resolved: true,
      rating: 5,
      turns: [
        {
          q: "How much does the Team plan cost?",
          a: "The Team plan is $12 per user per month on monthly billing, or $10 per user per month if you pay annually, which saves about 17% [1]. New workspaces also get a 14-day free trial of Team with no credit card required [2].",
          cites: ["billing", "start"],
        },
        {
          q: "If I add someone halfway through the month, do I pay for the full month?",
          a: "No. Adding a member mid-cycle is prorated, so you're only charged for the days left in the current billing period [1].",
          cites: ["billing"],
        },
      ],
    },
    {
      channel: "WIDGET",
      daysAgo: 1,
      hoursAgo: 5,
      resolved: true,
      rating: 5,
      turns: [
        {
          q: "I paid for the annual plan 2 weeks ago but we're switching tools. Can I get a refund?",
          a: "Yes. Annual plans can be refunded in full within 30 days of purchase or renewal, so at two weeks you're covered [1].\n\nHere's how:\n1. Cancel the plan from Settings > Billing > Cancel plan.\n2. Email billing@nimbus-pm.example from the workspace owner's address with your workspace name and invoice number.\n\nThe refund goes back to your original payment method within 5 to 10 business days [1].",
          cites: ["refunds"],
        },
      ],
    },
    {
      channel: "PLAYGROUND",
      daysAgo: 2,
      hoursAgo: 8,
      resolved: true,
      turns: [
        {
          q: "Can we import our boards from Trello?",
          a: "Yes. Go to Settings > Import and choose Trello [1]. The import keeps task titles, descriptions, assignees (matched by email), due dates, labels and comments. Attachments over 100 MB are skipped, and large imports can take up to 30 minutes; you'll get an email when it's finished [1].",
          cites: ["integrations"],
        },
      ],
    },
    {
      channel: "WIDGET",
      daysAgo: 3,
      hoursAgo: 4,
      resolved: true,
      rating: 4,
      turns: [
        {
          q: "where do i download invoices",
          a: "Workspace owners and billing admins can download every invoice as a PDF from Settings > Billing > Invoices [1].",
          cites: ["billing"],
        },
        {
          q: "can i add our VAT number to them",
          a: "Yes. Add your company name, address or VAT ID under Settings > Billing > Billing details, and it will appear on future invoices. If you need past invoices updated, they can be reissued with the new details on request [1].",
          cites: ["billing"],
        },
      ],
    },
    {
      channel: "WIDGET",
      daysAgo: 5,
      hoursAgo: 6,
      resolved: true,
      rating: 5,
      turns: [
        {
          q: "I'm not getting any email notifications anymore",
          a: "Let's check a few things [1]:\n1. Open Profile > Notifications. You may be set to \"Daily digest\" or \"In-app only\".\n2. Look in your spam or promotions folder and add notifications@nimbus-pm.example to your contacts.\n3. If your company filters email, ask IT to allowlist our sending domain.\n\nIf none of these help, email support@nimbus-pm.example with your workspace name and we'll dig in [1].",
          cites: ["troubleshooting"],
        },
      ],
    },
    {
      channel: "WIDGET",
      daysAgo: 6,
      hoursAgo: 9,
      resolved: true,
      turns: [
        {
          q: "Our card got declined, will we lose our projects?",
          a: "No, you won't lose any data. When a payment fails we retry the card on day 1, day 3 and day 7, and you keep full access during that 7-day grace period [1]. If the last retry also fails, the workspace becomes read-only until you add a working card under Settings > Billing > Payment method. Nothing is ever deleted because of a failed payment [1].",
          cites: ["billing"],
        },
      ],
    },
    {
      channel: "PLAYGROUND",
      daysAgo: 8,
      hoursAgo: 3,
      resolved: true,
      turns: [
        {
          q: "How do I turn on two-factor authentication?",
          a: "Go to Profile > Security > Two-factor authentication and scan the QR code with an authenticator app such as Google Authenticator, 1Password or Authy [1]. Save your 10 backup codes somewhere safe. If you're on the Business plan, owners can also require 2FA for everyone under Settings > Security [1].",
          cites: ["account"],
        },
      ],
    },
    {
      channel: "WIDGET",
      daysAgo: 9,
      hoursAgo: 7,
      resolved: false,
      turns: [
        {
          q: "Do you have an on-premise version we can host ourselves?",
          a: "I couldn't find anything about a self-hosted or on-premise version in our documentation, so I don't want to guess. Please email support@nimbus-pm.example and the team can tell you what's possible, especially if you're considering the Enterprise plan.",
          cites: [],
        },
      ],
    },
    {
      channel: "WIDGET",
      daysAgo: 11,
      hoursAgo: 5,
      resolved: true,
      rating: 5,
      turns: [
        {
          q: "Slack notifications stopped working since yesterday",
          a: "This usually happens when the person who installed the Slack integration left your Slack workspace or changed their Slack password, which makes Slack disconnect it [1]. To fix it, go to Settings > Integrations > Slack > Reconnect [1].",
          cites: ["troubleshooting"],
        },
        {
          q: "Can it also create tasks from Slack?",
          a: "Yes. Once connected, you can create tasks right from Slack with the /nimbus command, and task notifications can post to the channels you choose [1].",
          cites: ["integrations"],
        },
      ],
    },
    {
      channel: "WIDGET",
      daysAgo: 13,
      hoursAgo: 10,
      resolved: true,
      turns: [
        {
          q: "Do guests count as paid seats?",
          a: "No, guests are free. Guests only get access to the specific projects you share with them, and the Team plan includes up to 10 guests per project [1]. You can invite someone as a guest from Settings > Members > Invite [1].",
          cites: ["start"],
        },
      ],
    },
    {
      channel: "PLAYGROUND",
      daysAgo: 15,
      hoursAgo: 4,
      resolved: true,
      turns: [
        {
          q: "What's the API rate limit?",
          a: "The REST API allows 100 requests per minute per token; anything over the limit gets an HTTP 429 response [1]. The API is available on Team plans and above, and you can create a personal token under Profile > API tokens [1].",
          cites: ["integrations"],
        },
      ],
    },
    {
      channel: "WIDGET",
      daysAgo: 17,
      hoursAgo: 6,
      resolved: true,
      rating: 4,
      turns: [
        {
          q: "I forgot my password and the reset link says expired",
          a: "Reset links are only valid for 60 minutes, so request a fresh one with \"Forgot password?\" on the sign-in page and use it right away [1]. One thing to check: if your workspace uses single sign-on, password reset won't work. Use the \"Continue with SSO\" button instead and contact your IT admin if you're still locked out [1].",
          cites: ["account"],
        },
        {
          q: "It says my account is locked now",
          a: "After 10 failed sign-in attempts the account is locked for 15 minutes as a safety measure [1]. Wait 15 minutes, then sign in with the new password from a fresh reset link.",
          cites: ["troubleshooting"],
        },
      ],
    },
    {
      channel: "WIDGET",
      daysAgo: 20,
      hoursAgo: 8,
      resolved: true,
      turns: [
        {
          q: "If we cancel, do we lose all our tasks?",
          a: "No. Cancelling never deletes your projects or tasks [1]. You keep paid features until the end of the period you've already paid for, then the workspace moves to the Free plan. Anything over the Free plan limits (3 projects, 5 members) becomes read-only rather than being removed [1][2].",
          cites: ["refunds", "start"],
        },
      ],
    },
    {
      channel: "WIDGET",
      daysAgo: 23,
      hoursAgo: 5,
      resolved: true,
      rating: 5,
      turns: [
        {
          q: "Is SSO with Okta supported?",
          a: "Yes. SAML SSO with Okta, Azure AD, Google Workspace and OneLogin is available on the Business and Enterprise plans. You can set it up under Settings > Security > SSO [1].",
          cites: ["account"],
        },
      ],
    },
    {
      channel: "PLAYGROUND",
      daysAgo: 27,
      hoursAgo: 9,
      resolved: true,
      turns: [
        {
          q: "How big can file attachments be?",
          a: "It depends on your plan: 10 MB on Free, 100 MB on Team and 250 MB on Business [1]. If a file under the limit still fails, try another browser or check whether a VPN or proxy is blocking the upload [1].",
          cites: ["troubleshooting"],
        },
      ],
    },
  ],
};
