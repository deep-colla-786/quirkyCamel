// Text of the information pages (/shipping, /refunds, /privacy, /terms, /contact).
// Written from how the store actually works (STORE_POLICY, checkout, delivery); review
// with the business owner before launch. A section is { heading, body: [paragraph |
// { list: [...] }] }.
import { STORE_POLICY, MAX_QTY } from './products.js';
import { BUSINESS } from './business.js';

const UPDATED = '26 October 2026';
const supportEmail = BUSINESS.email;
const officerName = BUSINESS.grievanceOfficer.name ? `, ${BUSINESS.grievanceOfficer.name},` : '';

export const POLICIES = {
  shipping: {
    title: 'Shipping policy',
    description: 'How and when Quirky Camel orders are dispatched and delivered across India.',
    updated: UPDATED,
    sections: [
      {
        heading: 'Where we deliver',
        body: ['We deliver to addresses across India. Enter your PIN code on any product page for a typical delivery time.']
      },
      {
        heading: 'Delivery time and cost',
        body: [
          {
            list: [
              `${STORE_POLICY.dispatch}.`,
              `Delivery usually takes ${STORE_POLICY.deliveryEstimate}.`,
              STORE_POLICY.freeShipping ? 'Shipping is free on every order.' : 'Shipping charges are shown at checkout.'
            ]
          },
          'Remote areas, public holidays and courier delays can add a day or two. We’ll keep you posted if anything changes.'
        ]
      },
      {
        heading: 'Tracking your order',
        body: [
          'Once your order is paid, it’s booked with our courier partner. You can follow it from your account under Orders → Track order: the courier, tracking number (AWB), every scan, and the expected delivery date.'
        ]
      },
      {
        heading: 'Delivery problems',
        body: [
          `If your parcel is delayed, marked delivered but not received, or arrives damaged, write to ${supportEmail} with your order number. Damaged or missing items are covered by our refund policy.`
        ]
      }
    ]
  },

  refunds: {
    title: 'Returns, refunds and cancellations',
    description: 'What to do if your Quirky Camel order arrives damaged, and how cancellations and refunds work.',
    updated: UPDATED,
    sections: [
      {
        heading: 'Returns',
        body: [STORE_POLICY.returns]
      },
      {
        heading: 'Damaged or missing items',
        body: [
          {
            list: [
              'Write to us within 48 hours of delivery.',
              'Include your order number and a photo of the parcel and the item.',
              'We’ll send a replacement at no cost, or refund the item if a replacement isn’t possible.'
            ]
          }
        ]
      },
      {
        heading: 'Cancelling an order',
        body: [
          `You can cancel free of charge until your order is dispatched: write to ${supportEmail} with your order number. Once it has been handed to the courier it can’t be cancelled.`
        ]
      },
      {
        heading: 'Refunds',
        body: [
          'Approved refunds go back to the original payment method through Razorpay, usually within 5–7 business days after we confirm them. Your bank may take a little longer to show it.'
        ]
      }
    ]
  },

  privacy: {
    title: 'Privacy policy',
    description: 'What personal data Quirky Camel collects, why, who it is shared with, and your rights under the DPDP Act 2023.',
    updated: UPDATED,
    sections: [
      {
        heading: 'What we collect',
        body: [
          {
            list: [
              'Account details: your name, email, phone number and a password (stored only as a one-way hash).',
              'Delivery details: your address, city, state and PIN code, and any gift note.',
              'Orders: what you bought, the amount, and payment and delivery status. We never see or store your card or UPI details; Razorpay handles payments.',
              'Your cart and saved items, so they’re there when you log in on another device.',
              'Security records: when you log in or out, from which IP address and browser, so we can spot misuse of your account.'
            ]
          }
        ]
      },
      {
        heading: 'Why we use it',
        body: [
          'To create your account, take payment, deliver your order, send your invoice and delivery updates, answer your questions, and keep accounts secure. We don’t sell your data and don’t send marketing email unless you ask for it.'
        ]
      },
      {
        heading: 'Who we share it with',
        body: [
          {
            list: [
              'Razorpay, to process payments.',
              'Shiprocket and its courier partners, to deliver your order (name, phone and address).',
              'Our email provider, to send invoices and account emails.'
            ]
          },
          'Each of them only receives what they need for that job.'
        ]
      },
      {
        heading: 'Cookies',
        body: [
          'We use a single login cookie to keep you signed in, and your browser’s own storage to remember your cart and saved items between visits. We don’t use advertising or tracking cookies.'
        ]
      },
      {
        heading: 'How long we keep it',
        body: [
          'Your account data is kept until you delete your account. Order and invoice records are kept for 8 years because tax law requires it. Security records are kept for up to 12 months.'
        ]
      },
      {
        heading: 'Your rights',
        body: [
          `Under the Digital Personal Data Protection Act 2023 you can ask to see, correct or delete your personal data, and withdraw consent. You can delete your account yourself from Account → Delete account, or write to ${supportEmail}.`
        ]
      },
      {
        heading: 'Grievance officer',
        body: [
          `For any privacy concern, contact our grievance officer${officerName} at ${BUSINESS.grievanceOfficer.email}. We acknowledge within 48 hours and resolve within 30 days.`
        ]
      }
    ]
  },

  terms: {
    title: 'Terms of use',
    description: 'The terms for using the Quirky Camel website and buying from it.',
    updated: UPDATED,
    sections: [
      {
        heading: 'Using this site',
        body: [
          'By using this website or placing an order you agree to these terms. If you don’t agree, please don’t use the site.'
        ]
      },
      {
        heading: 'Orders and prices',
        body: [
          {
            list: [
              'Prices are in Indian rupees and include all taxes.',
              `You can buy up to ${MAX_QTY} of each product per order.`,
              'An order is confirmed once payment succeeds; you’ll get an invoice by email.',
              'If a price was shown wrongly or an item turns out to be unavailable, we’ll contact you and refund in full if you don’t want to continue.'
            ]
          }
        ]
      },
      {
        heading: 'Your account',
        body: [
          'Keep your password private. You’re responsible for orders placed from your account. Tell us straight away if you think someone else has used it.'
        ]
      },
      {
        heading: 'Products',
        body: [
          'Our fragrances are attar (perfume oil) for external use only. Do a patch test before first use, keep them away from eyes and children, and stop using them if irritation occurs.'
        ]
      },
      {
        heading: 'Shipping, returns and privacy',
        body: ['Delivery, returns and refunds, and how we handle your data are covered by our shipping, refund and privacy policies.']
      },
      {
        heading: 'Liability and law',
        body: [
          'Our liability for any order is limited to the amount you paid for it. These terms are governed by the laws of India, and disputes fall under the courts where we are registered.'
        ]
      }
    ]
  },

  contact: {
    title: 'Contact us',
    description: 'How to reach Quirky Camel about an order, a delivery or your account.',
    updated: UPDATED,
    sections: [
      {
        heading: 'Questions about an order',
        body: [
          'Have your order number ready (it starts with QC-, and is on your invoice and in Account → Orders). Delivery status is always up to date on the order’s tracking page.'
        ]
      }
    ]
  }
};
