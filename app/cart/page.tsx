import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
import { Container, Fig } from "@/components/ui";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review your VoltCraft order before checkout.",
};

export default function CartPage() {
  return (
    <Container>
      <div className="py-10 sm:py-14">
        <Fig>Your order</Fig>
        <h1 className="mt-3 font-display text-[2rem] leading-[1.08] tracking-[-0.025em] sm:text-[2.6rem]">
          Cart
        </h1>
        <div className="mt-9">
          <CartView />
        </div>
      </div>
    </Container>
  );
}
