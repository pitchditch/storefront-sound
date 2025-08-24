import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    console.log("Payment verification started");

    const { session_id, order_id } = await req.json();

    if (!session_id || !order_id) {
      throw new Error("Missing session_id or order_id");
    }

    console.log("Verifying payment for session:", session_id, "order:", order_id);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log("Stripe session status:", session.payment_status);

    // Update order based on payment status
    let paymentStatus = 'pending';
    let fulfillmentStatus = 'unfulfilled';

    if (session.payment_status === 'paid') {
      paymentStatus = 'paid';
      fulfillmentStatus = 'processing';
      console.log("Payment successful, updating order status");
    } else if (session.payment_status === 'unpaid') {
      paymentStatus = 'failed';
      console.log("Payment failed");
    }

    // Update order in database
    const { data: orderData, error: orderError } = await supabaseService
      .from("orders")
      .update({
        payment_status: paymentStatus,
        fulfillment_status: fulfillmentStatus,
        stripe_payment_intent_id: session.payment_intent as string,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id)
      .select()
      .single();

    if (orderError) {
      console.error("Order update error:", orderError);
      throw new Error(`Failed to update order: ${orderError.message}`);
    }

    console.log("Order updated successfully:", orderData.order_number);

    // If payment is successful, trigger fulfillment process
    if (paymentStatus === 'paid') {
      console.log("Payment confirmed, order ready for fulfillment");
      
      // TODO: Trigger supplier API calls for order fulfillment
      // This would involve:
      // 1. Get order items with their supplier information
      // 2. Group items by supplier
      // 3. Call respective supplier APIs (AliExpress, Spocket, Printful)
      // 4. Update order items with supplier order IDs
      
      // For now, we'll just log that fulfillment should start
      const { data: orderItems } = await supabaseService
        .from("order_items")
        .select(`
          *,
          products (
            supplier_id,
            supplier_product_id,
            suppliers (name, slug, api_config)
          )
        `)
        .eq("order_id", order_id);

      console.log("Order items for fulfillment:", orderItems?.length);
      
      // TODO: Implement supplier-specific fulfillment logic here
      // Example: await fulfillAliExpressItems(aliExpressItems);
      // Example: await fulfillSpocketItems(spocketItems);
      // Example: await fulfillPrintfulItems(printfulItems);
    }

    return new Response(JSON.stringify({
      success: true,
      order: orderData,
      payment_status: paymentStatus,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Payment verification error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});