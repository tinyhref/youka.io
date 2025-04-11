export type IntervalType = "monthly" | "annually";

export type Role =
  | "credits"
  | "basic"
  | "standard"
  | "pro"
  | "trial"
  | "none"
  | "payperuse"
  | "trial-expired";

export const RoleLabel: Record<Role, string> = {
  basic: "Basic",
  standard: "Standard",
  pro: "Pro",
  trial: "Trial Version",
  none: "No Active Plan",
  payperuse: "Pay as you go",
  credits: "Pay as you go",
  "trial-expired": "Trial Expired",
};

export const RoleTitle: Record<Role, string> = {
  basic: "Basic Version",
  standard: "Standard Version",
  pro: "Pro Version",
  trial: "Trial Version",
  none: "No Active Plan",
  payperuse: "Pay as you go",
  credits: "Pay as you go",
  "trial-expired": "Trial Expired",
};

export interface PlanExtended {
  role: Role;
}

const basicFeatures = ["Auto Karaoke Generator", "Auto Lyrics Sync"];

const standardFeatures = [
  "Auto Karaoke Generator",
  "Auto Lyrics Sync",
  "Lyrics Sync Editor",
  "Export to mp3/mp4",
  "Create Karaoke from local files",
  "Process 2 karaokes at a time",
];

const proFeatures = [
  "Auto Karaoke Generator",
  "Auto Lyrics Sync",
  "Lyrics Sync Editor",
  "Export to mp3/mp4",
  "Create Karaoke from local files",
  "Process 5 karaokes at a time",
  "Subtitle Designer",
];

export interface Plan {
  id: number;
  role: Role;
  interval: IntervalType;
  slug: string;
  name: string;
  price: number;
  features: string[];
  mostPopular: boolean;
}

export type LemonStatusType =
  | "on_trial"
  | "active"
  | "paused"
  | "past_due"
  | "unpaid"
  | "cancelled"
  | "expired";

export interface FilterOptions {
  user_email?: string;
  product_id?: string;
  subscription_id?: string;
}

export interface CustomerFilter {
  store_id?: number;
  email?: string;
}

export interface LemonOptions {
  token?: string;
}

export interface LemonResponse<T> {
  meta: Meta;
  jsonapi: Jsonapi;
  links: Links;
  data: T;
}

export interface Meta {
  page: Page;
}

export interface Page {
  currentPage: number;
  from: number;
  lastPage: number;
  perPage: number;
  to: number;
  total: number;
}

export interface Jsonapi {
  version: string;
}

export interface Links {
  first: string;
  last: string;
}

export interface LemonObject<T> {
  type: string;
  id: string;
  attributes: T;
  relationships?: Relationships;
  links?: Links;
}

export type SubscriptionsObject = LemonObject<SubscriptionAttributes>[];
export type SubscriptionObject = LemonObject<SubscriptionAttributes>;
export type CustomerObject = LemonObject<CustomerAttributes>;
export type OrderObject = LemonObject<OrderAttributes>;

export interface PauseObject {
  mode: "void" | "free";
  resumes_at?: string;
}

export interface SubscriptionAttributes {
  store_id: number;
  customer_id: number;
  order_id: number;
  order_item_id: number;
  product_id: number;
  variant_id: number;
  product_name: string;
  variant_name: string;
  user_name: string;
  user_email: string;
  status: LemonStatusType;
  status_formatted: string;
  card_brand: string;
  card_last_four: string;
  pause?: PauseObject;
  cancelled: boolean;
  trial_ends_at: string;
  billing_anchor: number;
  urls: Urls;
  renews_at: string;
  ends_at?: string;
  created_at: string;
  updated_at: string;
  test_mode: boolean;
}

export interface Urls {
  update_payment_method: string;
  customer_portal: string;
}

export interface Relationships {
  store?: Store;
  customer?: Customer;
  order?: Order;
  "order-item"?: OrderItem;
  product?: Product;
  variant?: Variant;
  "subscription-invoices"?: SubscriptionInvoices;
}

export interface Store {
  links: Links;
}

export interface Customer {
  links: Links;
}

export interface Order {
  links: Links;
}

export interface OrderItem {
  links: Links;
}

export interface Product {
  links: Links;
}

export interface Variant {
  links: Links;
}

export interface SubscriptionInvoices {
  links: Links;
}

export interface Links {
  related: string;
  self: string;
}

export interface CustomerAttributes {
  store_id: number;
  name: string;
  email: string;
  status: LemonStatusType;
  city: any;
  region: any;
  country: string;
  total_revenue_currency: number;
  mrr: number;
  status_formatted: string;
  country_formatted: string;
  total_revenue_currency_formatted: string;
  mrr_formatted: string;
  created_at: string;
  updated_at: string;
  test_mode: boolean;
}

export interface CustomersData
  extends LemonResponse<LemonObject<CustomerAttributes>[]> {
  type: "customers";
}

const prodPlans: Plan[] = [
  {
    id: 84227,
    name: "Basic",
    role: "basic",
    interval: "monthly",
    slug: "515da369-89be-4c48-9316-5b6ebaddbe48",
    price: 14.99,
    features: basicFeatures,
    mostPopular: false,
  },
  {
    id: 84228,
    name: "Standard",
    role: "standard",
    interval: "monthly",
    slug: "519fe3bb-46b7-4f62-b997-aaeadb8f7e35",
    price: 19.99,
    features: standardFeatures,
    mostPopular: true,
  },
  {
    id: 84230,
    role: "pro",
    name: "Pro",
    interval: "monthly",
    slug: "88c53fb5-577b-43a5-a6c4-b79997e318cc",
    price: 24.99,
    features: proFeatures,
    mostPopular: false,
  },
  {
    id: 84231,
    role: "basic",
    interval: "annually",
    name: "Basic",
    slug: "f35f8532-e566-4723-b1a7-f4f01cac46b8",
    price: 143.88,
    features: basicFeatures,
    mostPopular: false,
  },
  {
    id: 84232,
    role: "standard",
    name: "Standard",
    interval: "annually",
    slug: "da20b45e-2e11-4001-a538-1014b637c44c",
    price: 191.88,
    features: standardFeatures,
    mostPopular: true,
  },
  {
    id: 84233,
    role: "pro",
    name: "Pro",
    interval: "annually",
    slug: "2a4a2133-1ec8-4037-8525-2823ce869b17",
    price: 239.88,
    features: proFeatures,
    mostPopular: false,
  },
];
const devPlans: Plan[] = [
  {
    id: 83997,
    role: "basic",
    name: "Basic",
    interval: "monthly",
    slug: "d6fa1f58-7648-47b4-ab9c-101de202d54d",
    price: 14.99,
    features: basicFeatures,
    mostPopular: false,
  },
  {
    id: 83996,
    role: "standard",
    name: "Standard",
    interval: "monthly",
    slug: "6a43c25a-56aa-4f0c-9c68-7f38b139ec51",
    price: 19.99,
    features: standardFeatures,
    mostPopular: true,
  },
  {
    id: 83995,
    role: "pro",
    name: "Pro",
    interval: "monthly",
    slug: "7f26ec86-062a-4452-a7e5-dcd303a2614a",
    price: 24.99,
    features: proFeatures,
    mostPopular: false,
  },
  {
    id: 83999,
    role: "basic",
    interval: "annually",
    name: "Basic",
    slug: "5f46df69-656f-434d-a4e8-9cd653d37df8",
    price: 143.88,
    features: basicFeatures,
    mostPopular: false,
  },
  {
    id: 84000,
    role: "standard",
    name: "Standard",
    interval: "annually",
    slug: "5348d30d-1ec1-48ec-b9b1-954b3b4a6318",
    price: 191.88,
    features: standardFeatures,
    mostPopular: true,
  },
  {
    id: 83998,
    role: "pro",
    name: "Pro",
    interval: "annually",
    slug: "9040e0bc-d501-4d9c-aeca-3bb090330370",
    price: 239.88,
    features: proFeatures,
    mostPopular: false,
  },
];

export const LemonPlans =
  process.env.NODE_ENV === "production" ? prodPlans : devPlans;
export const LemonProductId =
  process.env.NODE_ENV === "production" ? 80644 : 80458;

export const LemonMonthlyPlans: Plan[] = LemonPlans.filter(
  (plan) => plan.interval === "monthly"
);
export const LemonAnnuallyPlans: Plan[] = LemonPlans.filter(
  (plan) => plan.interval === "annually"
);

export interface OrderAttributes {
  store_id: number;
  customer_id: number;
  identifier: string;
  order_number: number;
  user_name: string;
  user_email: string;
  currency: string;
  currency_rate: string;
  subtotal: number;
  discount_total: number;
  tax: number;
  total: number;
  subtotal_usd: number;
  discount_total_usd: number;
  tax_usd: number;
  total_usd: number;
  tax_name: string;
  tax_rate: string;
  status: string;
  status_formatted: string;
  refunded: boolean;
  refunded_at: any;
  subtotal_formatted: string;
  discount_total_formatted: string;
  tax_formatted: string;
  total_formatted: string;
  first_order_item: FirstOrderItem;
  urls: {
    receipt: string;
  };
  created_at: string;
  updated_at: string;
}

export interface FirstOrderItem {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number;
  product_name: string;
  variant_name: string;
  price: number;
  created_at: string;
  updated_at: string;
  test_mode: boolean;
}

export type LemonEventType =
  | "Checkout.Success"
  | "PaymentMethodUpdate.Mounted"
  | "PaymentMethodUpdate.Closed"
  | "PaymentMethodUpdate.Updated";

export interface LemonEvent {
  event: LemonEventType;
  data: any;
}

export interface LemonEventCheckoutSuccess {
  event: "Checkout.Success";
  data: OrderObject;
}
