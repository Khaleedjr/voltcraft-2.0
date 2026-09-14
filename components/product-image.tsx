import Image from "next/image";
import { ProductPlate } from "@/components/product-plate";
import { primaryCategory, type Product } from "@/lib/catalogue";

/**
 * Product photography comes from the store's media library. A handful of lines
 * have no photo, so those fall back to a drawing-sheet plate rather than a gap.
 */
export function ProductImage({
  product,
  ratio = "aspect-[4/3]",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px",
  priority = false,
  index = 0,
}: {
  product: Product;
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  index?: number;
}) {
  const src = product.images[index];

  if (!src) {
    return <ProductPlate category={primaryCategory(product)} label={product.name} ratio={ratio} />;
  }

  return (
    <div className={`relative ${ratio} w-full max-w-full overflow-hidden border border-line bg-raised`}>
      <Image
        src={src}
        alt={product.name}
        fill
        sizes={sizes}
        priority={priority}
        className="object-contain p-3"
      />
    </div>
  );
}
