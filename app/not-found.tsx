import { StoreShell } from "@/components/store-shell";
import { ButtonLink, Container, Fig } from "@/components/ui";

export default function NotFound() {
  return (
    <StoreShell>
    <Container>
      <div className="py-20 sm:py-28">
        <Fig>Error 404 — open circuit</Fig>
        <h1 className="mt-4 max-w-[16ch] font-display text-[clamp(2rem,5vw,3.4rem)] leading-[1.06] tracking-[-0.022em]">
          Nothing on the other end of that link.
        </h1>
        <p className="mt-5 max-w-[48ch] text-[1rem] leading-relaxed text-muted">
          The page moved, or the part was retired from the catalogue. The shelves are this way.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <ButtonLink href="/shop">Browse the catalogue</ButtonLink>
          <ButtonLink href="/" variant="underline">
            Back to the front page →
          </ButtonLink>
        </div>
      </div>
    </Container>
    </StoreShell>
  );
}
