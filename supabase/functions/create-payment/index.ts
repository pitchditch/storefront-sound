import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CheckoutRequest {
  cartItems: CartItem[];
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  billingAddress?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase client using service role for database operations
  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    console.log("Payment function started");

    // Parse request body
    const requestData: CheckoutRequest = await req.json();
    const { cartItems, customerInfo, shippingAddress, billingAddress } = requestData;

    if (!cartItems || cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    console.log("Processing checkout for:", customerInfo.email, "Items:", cartItems.length);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists in Stripe
    const customers = await stripe.customers.list({ 
      email: customerInfo.email, 
      limit: 1 
    });
    
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing Stripe customer:", customerId);
    } else {
      console.log("No existing Stripe customer found");
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingAmount = subtotal >= 50 ? 0 : 9.99; // Free shipping over $50
    const taxRate = 0.08; // 8% tax rate - replace with dynamic calculation
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + shippingAmount + taxAmount;

    console.log("Order totals:", { subtotal, shippingAmount, taxAmount, totalAmount });

    // Create or update customer in our database
    const { data: customerData, error: customerError } = await supabaseService
      .from("customers")
      .upsert({
        email: customerInfo.email,
        first_name: customerInfo.firstName,
        last_name: customerInfo.lastName,
        phone: customerInfo.phone,
        is_guest: true, // For now, treat all as guest checkouts
        stripe_customer_id: customerId,
      }, {
        onConflict: 'email',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (customerError) {
      console.error("Customer creation error:", customerError);
      throw new Error(`Failed to create customer: ${customerError.message}`);
    }

    console.log("Customer created/updated:", customerData.id);

    // Create order in database
    const { data: orderData, error: orderError } = await supabaseService
      .from("orders")
      .insert({
        customer_id: customerData.id,
        subtotal: subtotal,
        tax_amount: taxAmount,
        shipping_amount: shippingAmount,
        total_amount: totalAmount,
        currency: 'USD',
        payment_status: 'pending',
        fulfillment_status: 'unfulfilled',
        shipping_address: shippingAddress,
        billing_address: billingAddress || shippingAddress,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    console.log("Order created:", orderData.id, orderData.order_number);

    // Create order items
    const orderItems = cartItems.map(item => ({
      order_id: orderData.id,
      product_id: item.id,
      product_name: item.name,
      product_image: item.image,
      quantity: item.quantity,
      price_each: item.price,
    }));

    const { error: itemsError } = await supabaseService
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items creation error:", itemsError);
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    console.log("Order items created:", orderItems.length);

    // Create Stripe line items
    const lineItems = cartItems.map(item => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add shipping as a line item if applicable
    if (shippingAmount > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Shipping",
          },
          unit_amount: Math.round(shippingAmount * 100),
        },
        quantity: 1,
      });
    }

    // Add tax as a line item
    if (taxAmount > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Tax",
          },
          unit_amount: Math.round(taxAmount * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerInfo.email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderData.id}`,
      cancel_url: `${req.headers.get("origin")}/cart?cancelled=true`,
      metadata: {
        order_id: orderData.id,
        order_number: orderData.order_number,
      },
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU'], // Add more countries as needed
      },
      customer_creation: customerId ? undefined : 'always',
    });

    console.log("Stripe session created:", session.id);

    // Update order with Stripe session ID
    await supabaseService
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", orderData.id);

    return new Response(JSON.stringify({ 
      url: session.url,
      order_id: orderData.id,
      order_number: orderData.order_number 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Payment creation error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});