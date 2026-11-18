import { Banknote, Gem, HandCoins, Package, PiggyBank } from "lucide-react";
import type { AssetCategory } from "@/lib/sources/types";

const ICONS: Readonly<Record<AssetCategory, typeof Banknote>> = {
  cash: Banknote,
  savings: PiggyBank,
  preciousMetals: Gem,
  regularJewellery: Gem,
  receivables: HandCoins,
  tradeGoods: Package,
};

export function CategoryIcon({
  category,
  className = "size-4",
}: {
  category: AssetCategory;
  className?: string;
}) {
  const Icon = ICONS[category];
  return <Icon aria-hidden className={className} strokeWidth={1.8} />;
}
