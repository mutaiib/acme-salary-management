import { Card } from "@astryxdesign/core/Card";
import { Icon } from "@astryxdesign/core/Icon";
import { CircleDollarSign } from "lucide-react";

/**
 * The mark of the product: a dollar icon on a tile of the accent color. It is decoration,
 * so a screen reader skips it; the product name is always next to it.
 */
export function BrandMark() {
  return (
    <span aria-hidden="true">
      <Card variant="blue" padding={1.5}>
        <Icon icon={CircleDollarSign} color="accent" />
      </Card>
    </span>
  );
}
