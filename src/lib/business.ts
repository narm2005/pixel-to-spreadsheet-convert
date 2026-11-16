// Details shown on the legal and contact pages. Payment gateways (e.g. Razorpay) check that these are present.
// Fill in the empty values before applying for payments; empty ones are simply not shown.
export const BUSINESS = {
  brand: "SlickReceipts",
  website: "slickreceipts.com",
  legalName: "", // e.g. "SlickReceipts (proprietor: Full Name)"
  address: "", // registered business address
  phone: "", // e.g. "+91 98765 43210"
  supportEmail: "support@slickreceipts.com",
  grievanceOfficer: "", // name of the person who handles complaints and data requests
  grievanceEmail: "support@slickreceipts.com",
  jurisdictionCity: "", // courts for disputes, e.g. "Chennai, Tamil Nadu"
  lastUpdated: "16 November 2026",
};

export const operatorName = () => BUSINESS.legalName || BUSINESS.brand;
