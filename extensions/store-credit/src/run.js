// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @type {FunctionRunResult}
 */
const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  const store_credit = input.cart.buyerIdentity?.customer?.storeCredits?.value ? parseFloat(input.cart.buyerIdentity.customer.storeCredits.value) : 0.00;
  if(store_credit > 0){
    let discount_amount = {amount: 0};
    if(store_credit < input.cart.cost.subtotalAmount.amount){
      discount_amount = {amount: store_credit};
    } else {
      discount_amount = {amount: input.cart.cost.subtotalAmount.amount};
    }
    return {
      discounts: [
        {
          targets: [{
            orderSubtotal: {
              excludedVariantIds: []
            }
          }],
          message: "Store Credit",
          value: {
            fixedAmount: discount_amount
          }
        }
      ],
      discountApplicationStrategy: DiscountApplicationStrategy.First
    };
  }

  return EMPTY_DISCOUNT;
}
