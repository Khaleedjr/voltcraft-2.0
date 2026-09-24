import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { Container, Fig } from "@/components/ui";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Delivery details and payment for your VoltCraft order.",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <Container>
      <div className="py-10 sm:py-14">
        <Fig>Checkout</Fig>
        <h1 className="mt-3 font-display text-[2rem] leading-[1.08] tracking-[-0.025em] sm:text-[2.6rem]">
          Where is it going?
        </h1>
        <div className="mt-9">
          <CheckoutForm />
        </div>
      </div>
    </Container>
  );
}
